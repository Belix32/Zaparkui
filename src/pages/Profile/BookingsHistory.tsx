import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getUserBookings, Booking, getParkingById, Parking, updateBookingStatus } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button/Button';
import styles from './BookingsHistory.module.css';

/**
 * BookingsHistory - Component to display user's bookings
 * Shows active bookings, history, and allows cancellation
 */
export function BookingsHistory() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [parkingCache, setParkingCache] = useState<Record<string, Parking>>({});
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Load bookings
  useEffect(() => {
    const loadBookings = async () => {
      if (!user) return;

      try {
        const data = await getUserBookings(user.id);
        setBookings(data);

        // Load parking details for each booking
        const parkingIds = [...new Set(data.map(b => b.parking_id))];
        const cache: Record<string, Parking> = {};
        
        for (const parkingId of parkingIds) {
          const parking = await getParkingById(parkingId);
          if (parking) {
            cache[parkingId] = parking;
          }
        }
        
        setParkingCache(cache);
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

  // Filter bookings by status
  const activeBookings = bookings.filter(b => 
    b.status === 'pending' || b.status === 'confirmed' || b.status === 'active'
  );
  const completedBookings = bookings.filter(b => 
    b.status === 'cancelled' || b.status === 'completed'
  );

  const displayBookings = activeTab === 'active' ? activeBookings : completedBookings;

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает оплаты';
      case 'confirmed': return 'Подтверждено';
      case 'active': return 'Активно';
      case 'cancelled': return 'Отменено';
      case 'completed': return 'Завершено';
      default: return status;
    }
  };

  // Get status class
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return styles.statusPending;
      case 'confirmed': return styles.statusConfirmed;
      case 'active': return styles.statusActive;
      case 'cancelled': return styles.statusCancelled;
      case 'completed': return styles.statusCompleted;
      default: return '';
    }
  };

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
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancellingId === booking.id}
                    >
                      {cancellingId === booking.id ? 'Отмена...' : 'Отменить'}
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