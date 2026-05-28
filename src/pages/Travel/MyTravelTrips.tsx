import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button/Button';
import styles from './MyTravelTrips.module.css';

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
    month: 'short',
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

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Ожидает подтверждения';
    case 'confirmed': return 'Подтверждено';
    case 'active': return 'Активно';
    case 'completed': return 'Завершено';
    case 'cancelled': return 'Отменено';
    default: return status;
  }
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'pending': return styles.statusPending;
    case 'confirmed': return styles.statusConfirmed;
    case 'active': return styles.statusActive;
    case 'completed': return styles.statusCompleted;
    case 'cancelled': return styles.statusCancelled;
    default: return '';
  }
}

export function MyTravelTrips() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<TravelBookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem('zaparkyi_travel_bookings');
      if (stored) {
        const allBookings: TravelBookingData[] = JSON.parse(stored);
        const userBookings = allBookings.filter(b => b.user_id === user.id);
        // Sort by created_at descending
        userBookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setTrips(userBookings);
        setIsDemo(true);
      }
    } catch (err) {
      console.error('Error loading trips:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleCancel = useCallback((tripId: string) => {
    if (!confirm('Вы уверены, что хотите отменить поездку?')) return;

    setCancellingId(tripId);

    try {
      const stored = localStorage.getItem('zaparkyi_travel_bookings');
      if (stored) {
        const bookings: TravelBookingData[] = JSON.parse(stored);
        const updated = bookings.map(b =>
          b.id === tripId ? { ...b, status: 'cancelled' } : b
        );
        localStorage.setItem('zaparkyi_travel_bookings', JSON.stringify(updated));
        setTrips(prev =>
          prev.map(t => t.id === tripId ? { ...t, status: 'cancelled' } : t)
        );
      }
    } catch (err) {
      console.error('Error cancelling trip:', err);
    } finally {
      setCancellingId(null);
    }
  }, []);

  const activeTrips = trips.filter(t =>
    t.status === 'pending' || t.status === 'confirmed' || t.status === 'active'
  );
  const historyTrips = trips.filter(t =>
    t.status === 'completed' || t.status === 'cancelled'
  );

  const displayTrips = activeTab === 'active' ? activeTrips : historyTrips;

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className={styles.emptyTitle}>Войдите в аккаунт</h2>
            <p className={styles.emptyText}>
              Чтобы просматривать свои поездки, необходимо авторизоваться
            </p>
            <Button variant="primary" onClick={() => navigate('/login')}>
              Войти
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Загрузка поездок...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Мои поездки</h1>
          <Button variant="primary" onClick={() => navigate('/travel/search')}>
            Новая поездка
          </Button>
        </div>

        {/* Demo Mode Banner */}
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
            {activeTrips.length > 0 && (
              <span className={styles.badge}>{activeTrips.length}</span>
            )}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'history' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('history')}
          >
            История
            {historyTrips.length > 0 && (
              <span className={styles.badge}>{historyTrips.length}</span>
            )}
          </button>
        </div>

        {/* Trip List */}
        <div className={styles.list}>
          {displayTrips.length > 0 ? (
            displayTrips.map((trip) => (
              <div key={trip.id} className={styles.tripCard}>
                <div className={styles.tripHeader}>
                  <h3 className={styles.tripDestination}>
                    <span className={styles.tripDestinationIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    {getDestinationLabel(trip.destination)}
                  </h3>
                  <span className={`${styles.tripStatus} ${getStatusClass(trip.status)}`}>
                    {getStatusLabel(trip.status)}
                  </span>
                </div>

                <div className={styles.tripDetails}>
                  <div className={styles.tripDetailRow}>
                    <span>Автомобиль</span>
                    <span className={styles.tripDetailValue}>
                      {trip.partner_car_brand} {trip.partner_car_model}
                    </span>
                  </div>
                  <div className={styles.tripDetailRow}>
                    <span>Партнёр</span>
                    <span className={styles.tripDetailValue}>{trip.partner_name}</span>
                  </div>
                  <div className={styles.tripDetailRow}>
                    <span>Период</span>
                    <span className={styles.tripDetailValue}>
                      {formatDate(trip.start_date)} — {formatDate(trip.end_date)}
                    </span>
                  </div>
                  {trip.storage_enabled && (
                    <div className={styles.tripDetailRow}>
                      <span>Хранение</span>
                      <span className={styles.tripDetailValue}>
                        {trip.car_brand} {trip.car_model} ({trip.car_plate})
                      </span>
                    </div>
                  )}
                  <div className={styles.tripDetailRow}>
                    <span>Стоимость</span>
                    <span className={styles.tripPrice}>
                      {trip.total_price.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className={styles.tripActions}>
                  {trip.status === 'confirmed' && (
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => navigate(`/travel/booking/success?id=${trip.id}`)}
                    >
                      Открыть QR-код
                    </Button>
                  )}
                  {(trip.status === 'pending' || trip.status === 'confirmed') && (
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => handleCancel(trip.id)}
                      disabled={cancellingId === trip.id}
                    >
                      {cancellingId === trip.id ? 'Отмена...' : 'Отменить'}
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="3" width="15" height="13" rx="2" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <h2 className={styles.emptyTitle}>
                {activeTab === 'active' ? 'Нет активных поездок' : 'История поездок пуста'}
              </h2>
              <p className={styles.emptyText}>
                {activeTab === 'active'
                  ? 'Забронируйте автомобиль на курорте и отправляйтесь на море'
                  : 'У вас пока нет завершённых поездок'}
              </p>
              {activeTab === 'active' && (
                <Button variant="primary" onClick={() => navigate('/travel/search')}>
                  Забронировать поездку
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyTravelTrips;
