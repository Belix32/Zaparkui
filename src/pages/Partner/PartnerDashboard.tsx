import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PartnerLayout } from './PartnerLayout';
import styles from './Partner.module.css';

const MOCK_STATS = {
  totalBookings: 18,
  activeBookings: 5,
  totalCars: 8,
  availableCars: 5,
  totalStorage: 7,
  activeStorage: 3,
  totalRevenue: 425000,
};

const MOCK_BOOKINGS = [
  { id: 'BK-001', destination: 'Сочи', car: 'Hyundai Solaris', dates: '01.06.2026 - 07.06.2026', total_price: 35000, status: 'active' },
  { id: 'BK-002', destination: 'Анапа', car: 'Kia Rio', dates: '10.06.2026 - 15.06.2026', total_price: 28000, status: 'confirmed' },
  { id: 'BK-003', destination: 'Сочи', car: 'Toyota Camry', dates: '20.06.2026 - 28.06.2026', total_price: 56000, status: 'pending' },
  { id: 'BK-004', destination: 'Геленджик', car: 'Renault Duster', dates: '05.06.2026 - 10.06.2026', total_price: 31000, status: 'completed' },
  { id: 'BK-005', destination: 'Сочи', car: 'Nissan Qashqai', dates: '15.07.2026 - 22.07.2026', total_price: 42000, status: 'pending' },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтверждено',
  active: 'Активно',
  completed: 'Завершено',
  cancelled: 'Отменено',
};

export function PartnerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = {
      pending: styles.badgePending,
      confirmed: styles.badgeConfirmed,
      active: styles.badgeActive,
      completed: styles.badgeCompleted,
      cancelled: styles.badgeCancelled,
    };
    return map[status] || '';
  };

  if (loading) {
    return (
      <PartnerLayout>
        <div className={styles.loading}>Загрузка...</div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout title="Дашборд">
      <div>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📋</div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{MOCK_STATS.totalBookings}</span>
              <span className={styles.statLabel}>Всего броней</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconOrange}`}>🚀</div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{MOCK_STATS.activeBookings}</span>
              <span className={styles.statLabel}>Активные поездки</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconGreen}`}>🚗</div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>
                {MOCK_STATS.availableCars}/{MOCK_STATS.totalCars}
              </span>
              <span className={styles.statLabel}>Автомобили</span>
              <span className={styles.statSub}>{MOCK_STATS.availableCars} свободно</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconPurple}`}>💰</div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{formatCurrency(MOCK_STATS.totalRevenue)}</span>
              <span className={styles.statLabel}>Доход</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle} style={{ marginBottom: 20 }}>
            Быстрые действия
          </h3>
          <div className={styles.quickActionsGrid}>
            <button className={styles.quickAction} onClick={() => navigate('/partner/cars')}>
              <span className={styles.quickActionIcon}>🚗</span>
              Мои автомобили
            </button>
            <button className={styles.quickAction} onClick={() => navigate('/partner/bookings')}>
              <span className={styles.quickActionIcon}>📅</span>
              Бронирования
            </button>
            <button className={styles.quickAction} onClick={() => navigate('/partner/storage')}>
              <span className={styles.quickActionIcon}>🔒</span>
              Хранение
            </button>
            <button className={styles.quickAction} onClick={() => navigate('/travel')}>
              <span className={styles.quickActionIcon}>🌊</span>
              На сайт
            </button>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Последние бронирования</h3>
          </div>
          {MOCK_BOOKINGS.length === 0 ? (
            <div className={styles.empty}>
              <h3>Нет бронирований</h3>
              <p>Бронирования пока не поступали.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Направление</th>
                    <th>Автомобиль</th>
                    <th>Даты</th>
                    <th>Сумма</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_BOOKINGS.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <span className={styles.idCell}>{booking.id}</span>
                      </td>
                      <td>{booking.destination}</td>
                      <td>{booking.car}</td>
                      <td>{booking.dates}</td>
                      <td className={styles.priceCell}>{formatCurrency(booking.total_price)}</td>
                      <td>
                        <span className={`${styles.badge} ${getStatusClass(booking.status)}`}>
                          {STATUS_LABELS[booking.status] || booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PartnerLayout>
  );
}
