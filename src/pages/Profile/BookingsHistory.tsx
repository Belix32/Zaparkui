import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getUserBookings, Booking, getParkingById, Parking, updateBookingStatus, isSupabaseConfigured } from '../../lib/supabase';
import { parkings as staticParkings } from '../../data/parkings';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button/Button';
import styles from './BookingsHistory.module.css';

/** Booking payment status type */
type PaymentStatus = 'pending' | 'paid' | 'refunded';

/**
 * Format date for display
 */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Get booking status label in Russian
 */
const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending': return 'Ожидает оплаты';
    case 'confirmed': return 'Подтверждено';
    case 'active': return 'Активно';
    case 'cancelled': return 'Отменено';
    case 'completed': return 'Завершено';
    default: return status;
  }
};

/**
 * Get payment status label in Russian
 */
const getPaymentStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending': return 'Ожидает оплаты';
    case 'paid': return 'Оплачено';
    case 'refunded': return 'Возвращено';
    default: return status;
  }
};

/**
 * Get booking status CSS class
 */
const getStatusClass = (status: string): string => {
  switch (status) {
    case 'pending': return styles.statusPending;
    case 'confirmed': return styles.statusConfirmed;
    case 'active': return styles.statusActive;
    case 'cancelled': return styles.statusCancelled;
    case 'completed': return styles.statusCompleted;
    default: return '';
  }
};

/**
 * Get payment status CSS class
 */
const getPaymentStatusClass = (status: PaymentStatus): string => {
  switch (status) {
    case 'pending': return styles.paymentPending;
    case 'paid': return styles.paymentPaid;
    case 'refunded': return styles.paymentRefunded;
    default: return '';
  }
};

/**
 * BookingsHistory - Component to display user's bookings
 * Shows active bookings, history, and allows cancellation/extension
 */
export function BookingsHistory() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [parkingCache, setParkingCache] = useState<Record<string, Parking>>({});
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  // Load bookings
  useEffect(() => {
    const loadBookings = async () => {
      if (!user) return;

      try {
        if (!isSupabaseConfigured()) {
          setIsDemo(true);
          const stored: Booking[] = JSON.parse(localStorage.getItem('zaparkyi_bookings') || '[]');
          const userBookings = stored.filter(b => b.user_id === user.id);
          setBookings(userBookings);

          const parkingIds = [...new Set(userBookings.map(b => b.parking_id))];
          const cache: Record<string, Parking> = {};
          for (const pid of parkingIds) {
            const p = staticParkings.find(p => p.id === pid);
            if (p) cache[pid] = p;
          }
          setParkingCache(cache);
        } else {
          const data = await getUserBookings(user.id);
          setBookings(data);

          const parkingIds = [...new Set(data.map(b => b.parking_id))];
          const cache: Record<string, Parking> = {};
          
          for (const parkingId of parkingIds) {
            const parking = await getParkingById(parkingId);
            if (parking) {
              cache[parkingId] = parking;
            }
          }
          
          setParkingCache(cache);
        }
      } catch (err) {
        console.error('Error loading bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [user]);

  // Cancel booking
  const handleCancel = useCallback(async (bookingId: string) => {
    if (!confirm('Вы уверены, что хотите отменить бронирование?')) {
      return;
    }

    setCancellingId(bookingId);
    try {
      await updateBookingStatus(bookingId, 'cancelled');
      setBookings(prev => 
        prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b)
      );
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Ошибка отмены бронирования');
    } finally {
      setCancellingId(null);
    }
  }, []);

  // Extend booking
  const handleExtend = useCallback(async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    // Calculate extension period
    const currentEnd = new Date(booking.end_date);
    const extensionDays = booking.booking_type === 'monthly' ? 30 : 
                         booking.booking_type === 'daily' ? 1 : 1;
    const newEndDate = new Date(currentEnd);
    newEndDate.setDate(newEndDate.getDate() + extensionDays);

    const confirmExtend = confirm(
      `Продлить бронирование до ${formatDate(newEndDate.toISOString())}?`
    );

    if (!confirmExtend) return;

    setExtendingId(bookingId);
    try {
      // TODO: Implement extension logic with payment
      console.log('Extending booking:', bookingId, 'to', newEndDate.toISOString());
      
      // Update local state (in real implementation, this would come from the API)
      setBookings(prev => 
        prev.map(b => b.id === bookingId ? { ...b, end_date: newEndDate.toISOString() } : b)
      );
      
      alert('Бронирование успешно продлено!');
    } catch (err) {
      console.error('Error extending booking:', err);
      alert('Ошибка продления бронирования');
    } finally {
      setExtendingId(null);
    }
  }, [bookings]);

  // Download PDF receipt (stub)
  const handleDownloadReceipt = useCallback((booking: Booking) => {
    // Stub for PDF receipt generation
    // In a real app, this would generate/download a PDF receipt
    console.log('Download receipt for booking:', booking.id);
    
    alert('Скачивание чека будет доступно в ближайшем обновлении');
  }, []);

  // Filter bookings by status
  const activeBookings = bookings.filter(b => 
    b.status === 'pending' || b.status === 'confirmed' || b.status === 'active'
  );
  const completedBookings = bookings.filter(b => 
    b.status === 'cancelled' || b.status === 'completed'
  );

  const displayBookings = activeTab === 'active' ? activeBookings : completedBookings;

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Загрузка бронирований...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Мои бронирования</h2>
      </div>

      {/* Demo mode banner */}
      {isDemo && (
        <div className={styles.demoBanner}>
          Режим демонстрации — данные загружены из локального хранилища
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'active' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Активные
          {activeBookings.length > 0 && (
            <span className={styles.badge}>{activeBookings.length}</span>
          )}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'history' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('history')}
        >
          История
          {completedBookings.length > 0 && (
            <span className={styles.badge}>{completedBookings.length}</span>
          )}
        </button>
      </div>

      {/* Bookings List */}
      <div className={styles.list}>
        {displayBookings.length > 0 ? (
          displayBookings.map(booking => {
            const parking = parkingCache[booking.parking_id];
            const paymentStatus: PaymentStatus = 
              booking.payment_status as PaymentStatus || 
              (booking.status === 'cancelled' ? 'refunded' : 
               booking.status === 'pending' ? 'pending' : 'paid');
            
            return (
              <div key={booking.id} className={styles.bookingCard}>
                <div className={styles.bookingHeader}>
                  <h3 className={styles.parkingName}>
                    {parking?.title || 'Парковка'}
                  </h3>
                  <span className={`${styles.status} ${getStatusClass(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                </div>

                <div className={styles.bookingDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Адрес:</span>
                    <span className={styles.detailValue}>
                      {parking?.address || '-'}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Период:</span>
                    <span className={styles.detailValue}>
                      {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Автомобиль:</span>
                    <span className={styles.detailValue}>
                      {booking.car_brand} {booking.car_model} ({booking.car_number})
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
                    <span className={styles.detailLabel}>Сумма:</span>
                    <span className={styles.priceValue}>
                      {booking.total_price?.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Оплата:</span>
                    <span className={`${styles.paymentStatus} ${getPaymentStatusClass(paymentStatus)}`}>
                      {getPaymentStatusLabel(paymentStatus)}
                    </span>
                  </div>
                </div>

                {/* Booking Actions */}
                <div className={styles.bookingActions}>
                  {booking.status === 'confirmed' && (
                    <Link to={`/booking/success?bookingId=${booking.id}`}>
                      <Button variant="primary" size="small">
                        Открыть QR-код
                      </Button>
                    </Link>
                  )}
                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => handleExtend(booking.id)}
                      disabled={extendingId === booking.id}
                    >
                      {extendingId === booking.id ? 'Продление...' : 'Продлить'}
                    </Button>
                  )}
                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancellingId === booking.id}
                    >
                      {cancellingId === booking.id ? 'Отмена...' : 'Отменить'}
                    </Button>
                  )}
                  {booking.status === 'completed' && (
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => handleDownloadReceipt(booking)}
                    >
                      Скачать чек
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p>
              {activeTab === 'active' 
                ? 'У вас нет активных бронирований' 
                : 'История бронирований пуста'}
            </p>
            <Link to="/catalog">
              <Button variant="primary">Найти парковку</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingsHistory;