import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getSupabaseClient, Booking, Parking, getParkingById } from '../../lib/supabase';
import { Button } from '../../components/Button/Button';
import styles from './BookingSuccess.module.css';

/**
 * BookingSuccess - Success page after booking confirmation
 * Displays booking details and QR code for parking access
 */
export function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const bookingId = searchParams.get('bookingId');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [parking, setParking] = useState<Parking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

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
        
        // Fetch booking with parking info
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

        // Generate QR code URL using a free QR code API
        if (bookingData.qr_code) {
          // Using QRServer API for generating QR codes
          const qrData = encodeURIComponent(bookingData.qr_code);
          setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&bgcolor=ffffff&color=000000`);
        } else {
          // Fallback QR code with booking ID
          const qrData = encodeURIComponent(`ZAPARKYI:${bookingId}`);
          setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&bgcolor=ffffff&color=000000`);
        }

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

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Download QR code
  const downloadQR = useCallback(() => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `zaparkyi-booking-${bookingId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [qrCodeUrl, bookingId]);

  // Share booking info
  const shareBooking = useCallback(async () => {
    if (!booking || !parking) return;

    const shareText = `Бронирование парковки "${parking.title}"
📅 ${formatDate(booking.start_date)} - ${formatDate(booking.end_date)}
🚗 ${booking.car_brand} ${booking.car_model} (${booking.car_number})
💰 Оплачено: ${booking.total_price} ₽

Запаркуй - бронирование парковок`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Бронирование парковки',
          text: shareText,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
      alert('Информация скопирована в буфер обмена');
    }
  }, [booking, parking]);

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
      {/* Success Header */}
      <div className={styles.successHeader}>
        <div className={styles.successIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h1 className={styles.title}>Бронирование подтверждено!</h1>
        <p className={styles.subtitle}>
          Спасибо! Ваше бронирование успешно оплачено
        </p>
      </div>

      <div className={styles.content}>
        {/* QR Code Card */}
        <div className={styles.qrCard}>
          <h2 className={styles.cardTitle}>QR-код для парковки</h2>
          <p className={styles.qrDesc}>
            Предъявите этот QR-код при въезде на парковку
          </p>
          
          <div className={styles.qrWrapper}>
            <img 
              src={qrCodeUrl} 
              alt="QR-код бронирования" 
              className={styles.qrCode}
            />
          </div>
          
          <div className={styles.qrActions}>
            <Button 
              variant="outline" 
              size="small" 
              onClick={downloadQR}
              className={styles.qrButton}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Скачать
            </Button>
            <Button 
              variant="outline" 
              size="small" 
              onClick={shareBooking}
              className={styles.qrButton}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Поделиться
            </Button>
          </div>
        </div>

        {/* Booking Details */}
        <div className={styles.detailsCard}>
          <h2 className={styles.cardTitle}>Детали бронирования</h2>
          
          <div className={styles.detailRow}>
            <span className={styles.detailIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </span>
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Парковка</span>
              <span className={styles.detailValue}>{parking.title}</span>
            </div>
          </div>
          
          <div className={styles.detailRow}>
            <span className={styles.detailIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </span>
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Адрес</span>
              <span className={styles.detailValue}>{parking.address}</span>
            </div>
          </div>
          
          <div className={styles.detailRow}>
            <span className={styles.detailIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </span>
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Период</span>
              <span className={styles.detailValue}>
                {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
              </span>
            </div>
          </div>
          
          <div className={styles.detailRow}>
            <span className={styles.detailIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </span>
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Автомобиль</span>
              <span className={styles.detailValue}>
                {booking.car_brand} {booking.car_model}
              </span>
              <span className={styles.carNumber}>{booking.car_number}</span>
            </div>
          </div>
          
          <div className={styles.detailRow}>
            <span className={styles.detailIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </span>
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Оплачено</span>
              <span className={styles.detailValuePaid}>
                {booking.total_price?.toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className={styles.statusBadge}>
          <span className={styles.statusIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </span>
          <span>
            {booking.status === 'confirmed' && 'Бронирование подтверждено'}
            {booking.status === 'active' && 'Бронирование активно'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={() => navigate('/profile')}
            className={styles.actionButton}
          >
            Мои бронирования
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/catalog')}
            className={styles.actionButton}
          >
            Вернуться к каталогу
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BookingSuccess;