import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import styles from './TravelBooking.module.css';
import sharedStyles from './Travel.module.css';

interface PartnerInfo {
  id: string;
  name: string;
  rating: number;
}

interface PartnerCar {
  id: string;
  partner_id: string;
  brand: string;
  model: string;
  year: number;
  transmission: string;
  seats: number;
  price_per_day: number;
  deposit: number;
  image: string;
  partner: PartnerInfo;
}

interface TravelBookingData {
  id: string;
  user_id: string;
  car_id: string;
  destination: string;
  start_date: string;
  end_date: string;
  car_brand: string;
  car_model: string;
  car_color: string;
  car_plate: string;
  storage_enabled: boolean;
  rent_price: number;
  storage_price: number;
  service_fee: number;
  total_price: number;
  status: string;
  partner_name: string;
  partner_car_brand: string;
  partner_car_model: string;
  transmission: string;
  price_per_day: number;
  created_at: string;
}

const MOCK_CARS: PartnerCar[] = [
  { id: 'car-1', partner_id: 'partner-1', brand: 'Hyundai', model: 'Solaris', year: 2023, transmission: 'automatic', seats: 5, price_per_day: 2500, deposit: 10000, image: '', partner: { id: 'partner-1', name: 'АвтоМоре Сочи', rating: 4.5 } },
  { id: 'car-2', partner_id: 'partner-1', brand: 'Kia', model: 'Rio', year: 2023, transmission: 'automatic', seats: 5, price_per_day: 2800, deposit: 10000, image: '', partner: { id: 'partner-1', name: 'АвтоМоре Сочи', rating: 4.5 } },
  { id: 'car-3', partner_id: 'partner-1', brand: 'Toyota', model: 'Camry', year: 2024, transmission: 'automatic', seats: 5, price_per_day: 4500, deposit: 20000, image: '', partner: { id: 'partner-1', name: 'АвтоМоре Сочи', rating: 4.5 } },
  { id: 'car-4', partner_id: 'partner-2', brand: 'Renault', model: 'Duster', year: 2023, transmission: 'manual', seats: 5, price_per_day: 3200, deposit: 15000, image: '', partner: { id: 'partner-2', name: 'Южный Прокат', rating: 4.2 } },
  { id: 'car-5', partner_id: 'partner-2', brand: 'Lada', model: 'Vesta', year: 2024, transmission: 'manual', seats: 5, price_per_day: 2000, deposit: 8000, image: '', partner: { id: 'partner-2', name: 'Южный Прокат', rating: 4.2 } },
  { id: 'car-6', partner_id: 'partner-2', brand: 'Nissan', model: 'Qashqai', year: 2023, transmission: 'automatic', seats: 5, price_per_day: 3800, deposit: 18000, image: '', partner: { id: 'partner-2', name: 'Южный Прокат', rating: 4.2 } },
];

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function calcDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
}

export function TravelBooking() {
  const { carId } = useParams<{ carId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const startDate = searchParams.get('start') || '';
  const endDate = searchParams.get('end') || '';
  const destination = searchParams.get('destination') || '';

  const [car, setCar] = useState<PartnerCar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User's own car info for storage
  const [ownBrand, setOwnBrand] = useState('');
  const [ownModel, setOwnModel] = useState('');
  const [ownColor, setOwnColor] = useState('');
  const [ownPlate, setOwnPlate] = useState('');
  const [plateError, setPlateError] = useState('');

  // Storage toggle
  const [storageEnabled, setStorageEnabled] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  // Load car
  useEffect(() => {
    if (!carId) {
      setError('Автомобиль не указан');
      setLoading(false);
      return;
    }

    // Simulate API load
    const timer = setTimeout(() => {
      const found = MOCK_CARS.find(c => c.id === carId);
      if (found) {
        setCar(found);
      } else {
        setError('Автомобиль не найден');
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [carId]);

  const days = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return calcDays(startDate, endDate);
  }, [startDate, endDate]);

  const rentTotal = useMemo(() => {
    if (!car) return 0;
    return car.price_per_day * days;
  }, [car, days]);

  const storageTotal = useMemo(() => {
    if (!storageEnabled) return 0;
    return 500 * days;
  }, [storageEnabled, days]);

  const serviceFee = useMemo(() => {
    const base = rentTotal + storageTotal;
    return Math.round(base * 0.15);
  }, [rentTotal, storageTotal]);

  const totalPrice = useMemo(() => {
    return rentTotal + storageTotal + serviceFee;
  }, [rentTotal, storageTotal, serviceFee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    if (!car) return;

    // Validate plate if storage enabled
    if (storageEnabled) {
      if (!ownPlate || ownPlate.trim().length < 5) {
        setPlateError('Укажите госномер автомобиля');
        return;
      }
      setPlateError('');
    }

    setSubmitting(true);

    // Create booking in localStorage
    const bookingData: TravelBookingData = {
      id: generateId(),
      user_id: user.id,
      car_id: car.id,
      destination,
      start_date: startDate,
      end_date: endDate,
      car_brand: ownBrand,
      car_model: ownModel,
      car_color: ownColor,
      car_plate: ownPlate.toUpperCase(),
      storage_enabled: storageEnabled,
      rent_price: rentTotal,
      storage_price: storageTotal,
      service_fee: serviceFee,
      total_price: totalPrice,
      status: 'pending',
      partner_name: car.partner.name,
      partner_car_brand: car.brand,
      partner_car_model: car.model,
      transmission: car.transmission,
      price_per_day: car.price_per_day,
      created_at: new Date().toISOString(),
    };

    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem('zaparkyi_travel_bookings') || '[]');
    existing.push(bookingData);
    localStorage.setItem('zaparkyi_travel_bookings', JSON.stringify(existing));

    setSubmitting(false);

    // Navigate to confirmation
    navigate(`/travel/booking/confirm?bookingId=${bookingData.id}`);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={sharedStyles.loading}>
            <div className={sharedStyles.spinner} />
            <p>Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !car) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={sharedStyles.error}>
            <p>{error}</p>
            <Button variant="primary" onClick={() => navigate('/travel/search')}>
              Вернуться к поиску
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!car) return null;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={sharedStyles.backButton} onClick={() => navigate(-1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Назад
          </button>
          <h1 className={styles.title}>Бронирование</h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Car Details */}
          <div className={styles.carCard}>
            <div className={styles.carImage}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <div className={styles.carInfo}>
              <h2 className={styles.carName}>{car.brand} {car.model}</h2>
              <div className={styles.carSpecs}>
                <span className={styles.carSpec}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  {car.transmission === 'automatic' ? 'Автомат' : 'Механика'}
                </span>
                <span className={styles.carSpec}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  {car.seats} мест
                </span>
                <span className={styles.carSpec}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="2" />
                    <path d="M6 12h12" />
                    <path d="M12 6v12" />
                  </svg>
                  {car.year} г.
                </span>
              </div>
              <div className={styles.carPartner}>
                Партнёр: {car.partner.name} ★ {car.partner.rating}
              </div>
              <div className={styles.carPrice}>
                {car.price_per_day.toLocaleString('ru-RU')} ₽{' '}
                <span className={styles.carPriceLabel}>/ сутки</span>
              </div>
            </div>
          </div>

          {/* Date Display */}
          {startDate && endDate && (
            <div className={styles.dateDisplay}>
              <div className={styles.dateBox}>
                <div className={styles.dateLabel}>Заезд</div>
                <div className={styles.dateValue}>{formatDateDisplay(startDate)}</div>
              </div>
              <div className={styles.dateBox}>
                <div className={styles.dateLabel}>Выезд</div>
                <div className={styles.dateValue}>{formatDateDisplay(endDate)}</div>
              </div>
              <div className={styles.dateBox}>
                <div className={styles.dateLabel}>Длительность</div>
                <div className={styles.dateValue}>
                  {days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}
                </div>
              </div>
            </div>
          )}

          {/* Your Car Info for Storage */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Ваш автомобиль</h3>
            <div className={styles.carFormGrid}>
              <Input
                label="Марка"
                value={ownBrand}
                onChange={(e) => setOwnBrand(e.target.value)}
                placeholder="Toyota"
              />
              <Input
                label="Модель"
                value={ownModel}
                onChange={(e) => setOwnModel(e.target.value)}
                placeholder="Camry"
              />
            </div>
            <div className={styles.carFormGrid}>
              <Input
                label="Цвет"
                value={ownColor}
                onChange={(e) => setOwnColor(e.target.value)}
                placeholder="Белый"
              />
              <Input
                label="Госномер"
                value={ownPlate}
                onChange={(e) => {
                  setOwnPlate(e.target.value.toUpperCase());
                  if (plateError) setPlateError('');
                }}
                placeholder="А777АА77"
                maxLength={9}
                error={plateError}
              />
            </div>
          </div>

          {/* Storage Toggle */}
          <div
            className={`${styles.storageToggle} ${storageEnabled ? styles.storageToggleActive : ''}`}
            onClick={() => setStorageEnabled(!storageEnabled)}
            role="checkbox"
            aria-checked={storageEnabled}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setStorageEnabled(!storageEnabled);
              }
            }}
          >
            <div className={`${styles.storageCheckbox} ${storageEnabled ? styles.storageCheckboxChecked : ''}`}>
              {storageEnabled && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <div className={styles.storageInfo}>
              <div className={styles.storageTitle}>Оставить свою машину на хранение</div>
              <div className={styles.storagePrice}>500 ₽ / сутки</div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className={styles.priceBreakdown}>
            <h3 className={styles.sectionTitle}>Детализация стоимости</h3>
            <div className={styles.priceRow}>
              <span>Аренда: {days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'} × {car.price_per_day.toLocaleString('ru-RU')} ₽/день</span>
              <span className={styles.priceRowValue}>{rentTotal.toLocaleString('ru-RU')} ₽</span>
            </div>
            {storageEnabled && (
              <div className={styles.priceRow}>
                <span>Хранение: {days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'} × 500 ₽/день</span>
                <span className={styles.priceRowValue}>{storageTotal.toLocaleString('ru-RU')} ₽</span>
              </div>
            )}
            <div className={styles.priceRow}>
              <span>Комиссия сервиса (15%)</span>
              <span className={styles.priceRowValue}>{serviceFee.toLocaleString('ru-RU')} ₽</span>
            </div>
            <div className={styles.priceTotal}>
              <span>ИТОГО</span>
              <span className={styles.priceTotalValue}>{totalPrice.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>

          {/* Error */}
          {error && <div className={sharedStyles.errorMessage}>{error}</div>}

          {/* Submit */}
          <div className={styles.formActions}>
            <Button
              type="submit"
              variant="primary"
              size="large"
              disabled={submitting}
              className={styles.submitButton}
            >
              {submitting ? 'Создание бронирования...' : 'Забронировать'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TravelBooking;
