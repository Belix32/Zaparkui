import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import { Booking, Parking, getParkingById } from '../../lib/supabase';
import styles from './PaymentComingSoon.module.css';

export function PaymentComingSoon() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const bookingId = searchParams.get('bookingId');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [parking, setParking] = useState<Parking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    const stored: Booking[] = JSON.parse(localStorage.getItem('zaparkyi_bookings') || '[]');
    const found = stored.find(b => b.id === bookingId);
    if (found) {
      setBooking(found);
      getParkingById(found.parking_id).then(p => {
        setParking(p);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const hasBooking = !!bookingId && !!booking;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <div className={styles.icon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
        </div>

        <h1 className={styles.title}>Бронирование подтверждено!</h1>

        {loading && <p className={styles.message}>Загрузка...</p>}

        {!loading && hasBooking && (
          <>
            <p className={styles.message}>Бронирование успешно создано!</p>

            <div className={styles.details}>
              {parking && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Парковка</span>
                  <span className={styles.detailValue}>{parking.title}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Период</span>
                <span className={styles.detailValue}>
                  {formatDate(booking.start_date)} — {formatDate(booking.end_date)}
                </span>
              </div>
              {booking.car_brand && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Автомобиль</span>
                  <span className={styles.detailValue}>
                    {booking.car_brand} {booking.car_model} ({booking.car_number})
                  </span>
                </div>
              )}
              {booking.total_price != null && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Стоимость</span>
                  <span className={styles.detailValue}>
                    {booking.total_price.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {!loading && !hasBooking && (
          <p className={styles.message}>Спасибо за использование Запаркуй!</p>
        )}

        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={() => navigate('/my-bookings')}
          >
            Мои бронирования
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/catalog')}
          >
            Вернуться к каталогу
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PaymentComingSoon;