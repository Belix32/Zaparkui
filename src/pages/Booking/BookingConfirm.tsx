import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getSupabaseClient, Booking, Parking, updateBooking, getParkingById } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button/Button';
import styles from './BookingConfirm.module.css';

/**
 * BookingConfirm - Confirmation and payment page
 * Displays booking details and integrates with ЮKassa for payment
 */
export function BookingConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const bookingId = searchParams.get('bookingId');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [parking, setParking] = useState<Parking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'card' | 'sbp'>('card');

  // Load booking and parking data
  useEffect(() => {
    const loadData = async () => {
      if (!bookingId) {
        setError('ID бронирования не указан');
        setLoading(false);
        return;
      }

      try {
        const supabase = getSupabaseClient();
        
        // Fetch booking
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (bookingError || !bookingData) {
          setError('Бронирование не найдено');
          setLoading(false);
          return;
        }

        setBooking(bookingData as Booking);

        // Fetch parking
        if (bookingData.parking_id) {
          const parkingData = await getParkingById(bookingData.parking_id);
          setParking(parkingData);
        }
      } catch (err) {
        console.error('Error loading booking:', err);
        setError('Ошибка загрузки данных бронирования');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [bookingId]);

  // Handle payment with ЮKassa
  const handlePayment = useCallback(async () => {
    if (!booking || !user) return;

    setProcessingPayment(true);
    setError(null);

    try {
      // In a real implementation, you would call your backend to create a ЮKassa payment
      // For now, we'll simulate a successful payment
      
      // Update booking status to confirmed
      const supabase = getSupabaseClient();
      
      // Generate QR code data (in production, this would come from the backend)
      const qrData = `ZAPARKYI:${booking.id}:${booking.parking_id}`;
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          payment_method: selectedPayment === 'card' ? 'card' : 'sbp',
          payment_id: `pay_${Date.now()}`,
          qr_code: qrData,
        })
        .eq('id', booking.id);

      if (updateError) {
        throw new Error('Ошибка обновления бронирования');
      }

      // Navigate to success page
      navigate(`/booking/success?bookingId=${booking.id}`);
    } catch (err) {
      console.error('Payment error:', err);
      setError('Ошибка оплаты. Попробуйте снова.');
    } finally {
      setProcessingPayment(false);
    }
  }, [booking, user, selectedPayment, navigate]);

  // Generate mock payment link for ЮKassa
  const generatePaymentLink = useCallback(() => {
    if (!booking || !parking) return '';
    
    // In production, this would be a real ЮKassa payment link
    // For demo purposes, we simulate the payment flow
    return `https://payment.yookassa.ru/?amount=${booking.total_price}&currency=RUB`;
  }, [booking, parking]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

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

  if (error && !booking) {
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

  if (!booking || !parking) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className={styles.title}>Подтверждение брони</h1>
      </div>

      <div className={styles.content}>
        {/* Booking Details */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Детали бронирования</h2>
          
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Парковка:</span>
            <span className={styles.detailValue}>{parking.title}</span>
          </div>
          
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Адрес:</span>
            <span className={styles.detailValue}>{parking.address}</span>
          </div>
          
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Период:</span>
            <span className={styles.detailValue}>
              {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
            </span>
          </div>
          
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Время:</span>
            <span className={styles.detailValue}>
              {booking.start_time || '00:00'} - {booking.end_time || '23:59'}
            </span>
          </div>
          
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Тип:</span>
            <span className={styles.detailValue}>
              {booking.booking_type === 'hourly' && 'Почасовая'}
              {booking.booking_type === 'daily' && 'Суточная'}
              {booking.booking_type === 'monthly' && 'Месячная'}
            </span>
          </div>
          
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Автомобиль:</span>
            <span className={styles.detailValue}>
              {booking.car_brand} {booking.car_model}
            </span>
          </div>
          
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Гос. номер:</span>
            <span className={styles.detailValue}>{booking.car_number}</span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Способ оплаты</h2>
          
          <div className={styles.paymentMethods}>
            <button
              type="button"
              className={`${styles.paymentMethod} ${selectedPayment === 'card' ? styles.paymentActive : ''}`}
              onClick={() => setSelectedPayment('card')}
            >
              <div className={styles.paymentIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              <div className={styles.paymentInfo}>
                <span className={styles.paymentName}>Банковская карта</span>
                <span className={styles.paymentDesc}>Visa, MasterCard, МИР</span>
              </div>
            </button>
            
            <button
              type="button"
              className={`${styles.paymentMethod} ${selectedPayment === 'sbp' ? styles.paymentActive : ''}`}
              onClick={() => setSelectedPayment('sbp')}
            >
              <div className={styles.paymentIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div className={styles.paymentInfo}>
                <span className={styles.paymentName}>СБП</span>
                <span className={styles.paymentDesc}>Система Быстрых Платежей</span>
              </div>
            </button>
          </div>
        </div>

        {/* Payment via ЮKassa */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Оплата через ЮKassa</h2>
          
          <div className={styles.yookassaInfo}>
            <div className={styles.yookassaLogo}>
              <span className={styles.logoText}>Ю</span>
              <span className={styles.logoSubtext}>Kassa</span>
            </div>
            <p className={styles.yookassaDesc}>
              Безопасная оплата. Деньги списываются только после подтверждения.
            </p>
          </div>

          {/* Payment Amount */}
          <div className={styles.amountSection}>
            <span className={styles.amountLabel}>К оплате:</span>
            <span className={styles.amountValue}>
              {booking.total_price?.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && <div className={styles.errorMessage}>{error}</div>}

        {/* Pay Button */}
        <Button
          type="button"
          variant="primary"
          size="large"
          disabled={processingPayment}
          onClick={handlePayment}
          className={styles.payButton}
        >
          {processingPayment ? 'Обработка платежа...' : `Оплатить ${booking.total_price?.toLocaleString('ru-RU')} ₽`}
        </Button>

        {/* Cancel Link */}
        <button
          type="button"
          className={styles.cancelLink}
          onClick={() => navigate(-1)}
        >
          Отменить бронирование
        </button>
      </div>
    </div>
  );
}

// Helper function to update booking (add to supabase.ts if needed)
async function updateBooking(id: string, data: Partial<Booking>): Promise<Booking> {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('bookings')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating booking:', error);
    throw new Error(error.message);
  }

  return result as Booking;
}

export default BookingConfirm;