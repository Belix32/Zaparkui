import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import styles from './TravelBookingConfirm.module.css';
import sharedStyles from './Travel.module.css';

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

function formatDate(dateStr: string): string {
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

export function TravelBookingConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const bookingId = searchParams.get('bookingId');
  const [booking, setBooking] = useState<TravelBookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setError('ID бронирования не указан');
      setLoading(false);
      return;
    }

    // Load from localStorage
    const stored = localStorage.getItem('zaparkyi_travel_bookings');
    if (!stored) {
      setError('Бронирование не найдено');
      setLoading(false);
      return;
    }

    const bookings: TravelBookingData[] = JSON.parse(stored);
    const found = bookings.find(b => b.id === bookingId);

    if (!found) {
      setError('Бронирование не найдено');
      setLoading(false);
      return;
    }

    setBooking(found);
    setLoading(false);
  }, [bookingId]);

  const handleConfirm = () => {
    if (!booking) return;

    setConfirming(true);

    // Update booking status to confirmed
    const stored = localStorage.getItem('zaparkyi_travel_bookings');
    if (stored) {
      const bookings: TravelBookingData[] = JSON.parse(stored);
      const updated = bookings.map(b =>
        b.id === booking.id ? { ...b, status: 'confirmed' as const } : b
      );
      localStorage.setItem('zaparkyi_travel_bookings', JSON.stringify(updated));
    }

    setConfirming(false);
    navigate(`/travel/booking/success?id=${booking.id}`);
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

  if (error && !booking) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={sharedStyles.error}>
            <p>{error}</p>
            <Button variant="primary" onClick={() => navigate('/travel')}>
              Вернуться к поездкам
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const days = calcDays(booking.start_date, booking.end_date);

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
          <h1 className={styles.title}>Подтверждение брони</h1>
        </div>

        <div className={styles.content}>
          {/* Booking Details */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Детали бронирования</h2>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Направление</span>
              <span className={styles.detailValue}>
                {booking.destination === 'sochi' && 'Сочи'}
                {booking.destination === 'anapa' && 'Анапа'}
                {booking.destination === 'gelendzhik' && 'Геленджик'}
                {!['sochi', 'anapa', 'gelendzhik'].includes(booking.destination) && booking.destination}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Автомобиль в прокат</span>
              <span className={styles.detailValue}>
                {booking.partner_car_brand} {booking.partner_car_model}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Партнёр</span>
              <span className={styles.detailValue}>{booking.partner_name}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Период</span>
              <span className={styles.detailValue}>
                {formatDate(booking.start_date)} — {formatDate(booking.end_date)}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Длительность</span>
              <span className={styles.detailValue}>
                {days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}
              </span>
            </div>
            {booking.storage_enabled && (
              <>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Ваш автомобиль</span>
                  <span className={styles.detailValue}>
                    {booking.car_brand} {booking.car_model}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Госномер</span>
                  <span className={styles.detailValue}>{booking.car_plate}</span>
                </div>
                {booking.car_color && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Цвет</span>
                    <span className={styles.detailValue}>{booking.car_color}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Хранение</span>
                  <span className={styles.detailValue}>Включено</span>
                </div>
              </>
            )}
          </div>

          {/* Price */}
          <div className={styles.priceSection}>
            <h2 className={styles.cardTitle}>Стоимость</h2>
            <div className={styles.priceRow}>
              <span>Аренда ({days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'})</span>
              <span className={styles.priceRowValue}>{booking.rent_price.toLocaleString('ru-RU')} ₽</span>
            </div>
            {booking.storage_enabled && booking.storage_price > 0 && (
              <div className={styles.priceRow}>
                <span>Хранение ({days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'})</span>
                <span className={styles.priceRowValue}>{booking.storage_price.toLocaleString('ru-RU')} ₽</span>
              </div>
            )}
            <div className={styles.priceRow}>
              <span>Комиссия сервиса</span>
              <span className={styles.priceRowValue}>{booking.service_fee.toLocaleString('ru-RU')} ₽</span>
            </div>
            <div className={styles.priceTotal}>
              <span>Итого</span>
              <span className={styles.priceTotalValue}>{booking.total_price.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>

          {/* Error */}
          {error && <div className={sharedStyles.errorMessage}>{error}</div>}

          {/* Actions */}
          <div className={styles.actions}>
            <Button
              variant="primary"
              size="large"
              className={styles.confirmButton}
              onClick={handleConfirm}
              disabled={confirming}
            >
              {confirming ? 'Подтверждение...' : 'Подтвердить бронирование'}
            </Button>
            <button
              type="button"
              className={styles.cancelLink}
              onClick={() => navigate(-1)}
            >
              Отменить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TravelBookingConfirm;
