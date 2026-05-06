import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { getParkingById, Parking, createBooking, Booking, checkParkingAvailability } from '../../lib/supabase';
import { parkings } from '../../data/parkings';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button/Button';
import styles from './BookingPage.module.css';

// Validate Russian license plate
// Format: А123ВС (7 chars) or А123ВС777 (8 chars)
function validateLicensePlate(plate: string): { valid: boolean; error?: string } {
  const cleaned = plate.toUpperCase().replace(/[^А-ЯЁA-Z0-9]/g, '');
  
  if (cleaned.length < 6) {
    return { valid: false, error: 'Госномер слишком короткий' };
  }
  
  // Russian plate pattern: 1-2 letters + 3 digits + 2-3 letters (optional region)
  const plateRegex = /^[А-ЯЁ]{1,2}\d{3}[А-ЯЁ]{2}(\d{2,3})?$/;
  
  if (!plateRegex.test(cleaned)) {
    return { valid: false, error: 'Неверный формат госномера. Пример: А123ВС или А123ВС777' };
  }
  
  return { valid: true };
}

/**
 * BookingPage - Main booking page
 * Allows user to select date, time, booking type, and car for parking reservation
 */
export function BookingPage() {
  // Get parking ID from route params or search params
  const params = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Support both 'id' param and 'parkingId' query param
  const parkingId = params.id || searchParams.get('id') || searchParams.get('parkingId');
  const [parking, setParking] = useState<Parking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Booking form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');
  const [bookingType, setBookingType] = useState<'hourly' | 'daily' | 'monthly'>('monthly');
  
  // Car info state
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carNumber, setCarNumber] = useState('');

  // Retry wrapper for Supabase operations
  const withRetry = async <T,>(fn: () => Promise<T>, retries = 3): Promise<T> => {
    let lastError: Error | null = null;
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        // Check if retryable
        if (err?.message?.includes('Lock') || err?.message?.includes('claim')) {
          await new Promise(r => setTimeout(r, 1000 * (i + 1)));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  };

  // Load parking data
  useEffect(() => {
    const loadParking = async () => {
      if (!parkingId) {
        setError('ID парковки не указан');
        setLoading(false);
        return;
      }

      try {
        // Try to get from Supabase first with retry
        const data = await withRetry(() => getParkingById(parkingId));
        
        if (data) {
          setParking(data);
        } else {
          // Fallback to static data if not found in Supabase
          const staticParking = parkings.find(p => p.id === parkingId);
          if (staticParking) {
            setParking(staticParking);
          } else {
            setError('Парковка не найдена');
          }
        }
        
        // Set default dates
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(tomorrow.toISOString().split('T')[0]);
      } catch (err) {
        console.error('Error loading parking:', err);
        // Try static fallback on error
        const staticParking = parkings.find(p => p.id === parkingId);
        if (staticParking) {
          setParking(staticParking);
          // Set default dates
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          setStartDate(today.toISOString().split('T')[0]);
          setEndDate(tomorrow.toISOString().split('T')[0]);
        } else {
          setError('Ошибка загрузки данных парковки');
        }
      } finally {
        setLoading(false);
      }
    };

    loadParking();
  }, [parkingId]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!parking) return 0;
    
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const hours = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
    const days = hours / 24;

    switch (bookingType) {
      case 'hourly':
        return Math.round(parking.price / 24 / 30 * hours); // Hourly rate
      case 'daily':
        return Math.round(parking.price / 30 * days); // Daily rate
      case 'monthly':
      default:
        return parking.price * Math.max(1, Math.ceil(days / 30)); // Monthly rate
    }
  }, [parking, startDate, endDate, startTime, endTime, bookingType]);

  // Calculate number of days
  const bookingDays = useMemo(() => {
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }, [startDate, endDate, startTime, endTime]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !parking) return;
    
    if (!startDate || !endDate) {
      setError('Выберите даты бронирования');
      return;
    }
    
    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (startDateObj < today) {
      setError('Дата начала не может быть в прошлом');
      return;
    }
    
    if (endDateObj < startDateObj) {
      setError('Дата окончания должна быть позже даты начала');
      return;
    }
    
    // Validate minimum booking period
    const minDays = bookingType === 'hourly' ? 0 : bookingType === 'daily' ? 1 : 30;
    const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    if (bookingType === 'monthly' && daysDiff < 30) {
      setError('Минимальный срок аренды на месяц - 30 дней');
      return;
    }

    if (!carBrand || carBrand.trim().length < 2) {
      setError('Укажите марку автомобиля');
      return;
    }
    
    if (!carModel || carModel.trim().length < 2) {
      setError('Укажите модель автомобиля');
      return;
    }
    
    if (!carNumber || carNumber.trim().length < 5) {
      setError('Укажите госномер автомобиля');
      return;
    }
    
    // Validate license plate format
    const plateValidation = validateLicensePlate(carNumber);
    if (!plateValidation.valid) {
      setError(plateValidation.error || 'Неверный формат госномера');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Check parking availability before booking
      const availability = await checkParkingAvailability(parking.id, startDate, endDate);
      if (!availability.available) {
        setError(availability.message);
        setSubmitting(false);
        return;
      }
      
      const booking: Booking = await withRetry(() => createBooking({
        user_id: user.id,
        parking_id: parking.id,
        start_date: startDate,
        end_date: endDate,
        start_time: startTime,
        end_time: endTime,
        booking_type: bookingType,
        car_brand: carBrand,
        car_model: carModel,
        car_number: carNumber.toUpperCase(),
        total_price: totalPrice,
        status: 'pending',
      }), 5);

      // Navigate to confirmation page
      navigate(`/booking/confirm?bookingId=${booking.id}`);
    } catch (err: any) {
      console.error('Error creating booking:', err);
      
      // Check for auth lock error
      if (err?.message?.includes('Lock') || err?.message?.includes('claim')) {
        setError('Ошибка подключения. Попробуйте ещё раз через несколько секунд.');
      } else {
        setError(err?.message || 'Ошибка создания бронирования. Попробуйте снова.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [user, parking, startDate, endDate, startTime, endTime, bookingType, carBrand, carModel, carNumber, totalPrice, navigate]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error && !parking) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error}</p>
          <Button variant="primary" onClick={() => navigate('/catalog')}>
            Вернуться к каталогу
          </Button>
        </div>
      </div>
    );
  }

  if (!parking) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className={styles.title}>Бронирование</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Parking Info Card */}
        <div className={styles.parkingCard}>
          <h2 className={styles.parkingTitle}>{parking.title}</h2>
          <p className={styles.parkingAddress}>{parking.address}</p>
          <div className={styles.parkingDetails}>
            <span className={styles.priceTag}>
              {parking.price.toLocaleString('ru-RU')} ₽/мес
            </span>
            <span className={styles.spotsTag}>{parking.spots} мест</span>
          </div>
        </div>

        {/* Booking Type Selection */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Тип бронирования</h3>
          <div className={styles.bookingTypeGrid}>
            <button
              type="button"
              className={`${styles.typeButton} ${bookingType === 'hourly' ? styles.typeActive : ''}`}
              onClick={() => setBookingType('hourly')}
            >
              <span className={styles.typeIcon}>⏱️</span>
              <span className={styles.typeName}>Почасовая</span>
              <span className={styles.typePrice}>от {Math.round(parking.price / 24 / 30)} ₽/час</span>
            </button>
            <button
              type="button"
              className={`${styles.typeButton} ${bookingType === 'daily' ? styles.typeActive : ''}`}
              onClick={() => setBookingType('daily')}
            >
              <span className={styles.typeIcon}>📅</span>
              <span className={styles.typeName}>Суточная</span>
              <span className={styles.typePrice}>от {Math.round(parking.price / 30)} ₽/день</span>
            </button>
            <button
              type="button"
              className={`${styles.typeButton} ${bookingType === 'monthly' ? styles.typeActive : ''}`}
              onClick={() => setBookingType('monthly')}
            >
              <span className={styles.typeIcon}>📆</span>
              <span className={styles.typeName}>Месяц</span>
              <span className={styles.typePrice}>{parking.price.toLocaleString('ru-RU')} ₽</span>
            </button>
          </div>
        </div>

        {/* Date Selection */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Период бронирования</h3>
          <div className={styles.dateGrid}>
            <div className={styles.dateField}>
              <label htmlFor="startDate">Дата начала</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className={styles.dateField}>
              <label htmlFor="endDate">Дата окончания</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                required
              />
            </div>
          </div>
          <div className={styles.dateGrid}>
            <div className={styles.dateField}>
              <label htmlFor="startTime">Время начала</label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className={styles.dateField}>
              <label htmlFor="endTime">Время окончания</label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <p className={styles.periodInfo}>
            Период: <strong>{bookingDays} {bookingDays === 1 ? 'день' : bookingDays < 5 ? 'дня' : 'дней'}</strong>
          </p>
        </div>

        {/* Car Info */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Данные автомобиля</h3>
          <div className={styles.carGrid}>
            <div className={styles.carField}>
              <label htmlFor="carBrand">Марка</label>
              <input
                type="text"
                id="carBrand"
                value={carBrand}
                onChange={(e) => setCarBrand(e.target.value)}
                placeholder="Toyota"
                required
              />
            </div>
            <div className={styles.carField}>
              <label htmlFor="carModel">Модель</label>
              <input
                type="text"
                id="carModel"
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
                placeholder="Camry"
                required
              />
            </div>
          </div>
          <div className={styles.carField}>
            <label htmlFor="carNumber">Гос. номер</label>
            <input
              type="text"
              id="carNumber"
              value={carNumber}
              onChange={(e) => setCarNumber(e.target.value.toUpperCase())}
              placeholder="А777АА77"
              maxLength={9}
              required
            />
          </div>
        </div>

        {/* Total Summary */}
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Тип бронирования:</span>
            <span>
              {bookingType === 'hourly' && 'Почасовая'}
              {bookingType === 'daily' && 'Суточная'}
              {bookingType === 'monthly' && 'Месячная'}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span>Период:</span>
            <span>{bookingDays} {bookingDays === 1 ? 'день' : bookingDays < 5 ? 'дня' : 'дней'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Автомобиль:</span>
            <span>{carBrand} {carModel}</span>
          </div>
          <div className={styles.summaryTotal}>
            <span>Итого к оплате:</span>
            <span className={styles.totalAmount}>
              {totalPrice.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && <div className={styles.errorMessage}>{error}</div>}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="large"
          disabled={submitting}
          className={styles.submitButton}
        >
          {submitting ? 'Создание бронирования...' : 'Перейти к оплате'}
        </Button>
      </form>
    </div>
  );
}

export default BookingPage;