import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import styles from './TravelBookingSuccess.module.css';
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

function getDestinationLabel(slug: string): string {
  switch (slug) {
    case 'sochi': return 'Сочи';
    case 'anapa': return 'Анапа';
    case 'gelendzhik': return 'Геленджик';
    default: return slug;
  }
}

export function TravelBookingSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const bookingId = searchParams.get('id');
  const [booking, setBooking] = useState<TravelBookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (!bookingId) {
      setError('ID бронирования не указан');
      setLoading(false);
      return;
    }

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

    // Generate QR code URL
    const qrData = encodeURIComponent(`ZAPARKYI:TRAVEL:${found.id}:${found.car_id}:${found.destination}`);
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&bgcolor=ffffff&color=000000`);

    setLoading(false);
  }, [bookingId]);

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

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Success Header */}
        <div className={styles.successHeader}>
          <div className={styles.successIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1 className={styles.title}>Бронирование подтверждено!</h1>
          <p className={styles.subtitle}>
            Спасибо! Ваша поездка на море забронирована
          </p>
          <div className={styles.bookingId}>
            № {booking.id.substring(0, 8).toUpperCase()}
          </div>
        </div>

        <div className={styles.content}>
          {/* QR Code Card */}
          <div className={styles.qrCard}>
            <h2 className={styles.cardTitle}>QR-код для получения авто</h2>
            <p className={styles.qrDesc}>
              Предъявите этот QR-код при получении автомобиля
            </p>
            <div className={styles.qrWrapper}>
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="QR-код бронирования"
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--border)',
                  }}
                />
              ) : (
                <div className={styles.qrPlaceholder}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="2" width="8" height="8" rx="1" />
                    <rect x="14" y="2" width="8" height="8" rx="1" />
                    <rect x="2" y="14" width="8" height="8" rx="1" />
                    <rect x="14" y="14" width="3" height="3" rx="0.5" />
                    <rect x="19" y="14" width="3" height="3" rx="0.5" />
                    <rect x="14" y="19" width="3" height="3" rx="0.5" />
                    <rect x="19" y="19" width="3" height="3" rx="0.5" />
                  </svg>
                  <span className={styles.qrPlaceholderText}>QR-код</span>
                </div>
              )}
            </div>
          </div>

          {/* Booking Details */}
          <div className={styles.detailsCard}>
            <h2 className={styles.cardTitle}>Детали поездки</h2>

            <div className={styles.detailRow}>
              <span className={styles.detailIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <div className={styles.detailContent}>
                <span className={styles.detailLabel}>Направление</span>
                <span className={styles.detailValue}>{getDestinationLabel(booking.destination)}</span>
              </div>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13" rx="2" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </span>
              <div className={styles.detailContent}>
                <span className={styles.detailLabel}>Автомобиль в прокат</span>
                <span className={styles.detailValue}>
                  {booking.partner_car_brand} {booking.partner_car_model}
                </span>
                <span className={styles.carPlate}>Партнёр: {booking.partner_name}</span>
              </div>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </span>
              <div className={styles.detailContent}>
                <span className={styles.detailLabel}>Период</span>
                <span className={styles.detailValue}>
                  {formatDate(booking.start_date)} — {formatDate(booking.end_date)}
                </span>
              </div>
            </div>

            {booking.storage_enabled && (
              <div className={styles.detailRow}>
                <span className={styles.detailIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="2" />
                    <path d="M6 12h12" />
                    <path d="M12 6v12" />
                  </svg>
                </span>
                <div className={styles.detailContent}>
                  <span className={styles.detailLabel}>Ваш автомобиль на хранении</span>
                  <span className={styles.detailValue}>
                    {booking.car_brand} {booking.car_model}
                  </span>
                  {booking.car_plate && (
                    <span className={styles.carPlate}>{booking.car_plate}</span>
                  )}
                </div>
              </div>
            )}

            <div className={styles.detailRow}>
              <span className={styles.detailIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
              <div className={styles.detailContent}>
                <span className={styles.detailLabel}>Оплачено</span>
                <span className={styles.detailHighlight}>
                  {booking.total_price.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className={styles.statusBadge}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>Бронирование подтверждено</span>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <Button
              variant="primary"
              className={styles.actionButton}
              onClick={() => navigate('/travel/my-trips')}
            >
              Мои поездки
            </Button>
            <Button
              variant="ghost"
              className={styles.actionButton}
              onClick={() => navigate('/travel')}
            >
              На главную
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TravelBookingSuccess;
