import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayout } from './components/AdminLayout';
import styles from './AdminTravel.module.css';
import type { TravelBooking } from '../../lib/travel/types';

interface DashboardStats {
  totalBookings: number;
  activeTrips: number;
  totalRevenue: number;
  totalCommission: number;
}

const MOCK_STATS: DashboardStats = {
  totalBookings: 45,
  activeTrips: 12,
  totalRevenue: 1250000,
  totalCommission: 187500,
};

const MOCK_RECENT_BOOKINGS: Partial<TravelBooking>[] = [
  {
    id: 'tb_0001abc',
    destination: { id: 'd1', name: 'Сочи', slug: 'sochi' } as any,
    partner: { id: 'p1', name: 'Авангард-Авто' } as any,
    total_price: 35000,
    status: 'active',
    start_date: '2025-06-01T10:00:00Z',
    end_date: '2025-06-07T10:00:00Z',
    created_at: '2025-05-20T14:30:00Z',
  },
  {
    id: 'tb_0002def',
    destination: { id: 'd2', name: 'Анапа', slug: 'anapa' } as any,
    partner: { id: 'p2', name: 'Юг-Авто' } as any,
    total_price: 28000,
    status: 'confirmed',
    start_date: '2025-06-10T10:00:00Z',
    end_date: '2025-06-15T10:00:00Z',
    created_at: '2025-05-19T11:00:00Z',
  },
  {
    id: 'tb_0003ghi',
    destination: { id: 'd3', name: 'Геленджик', slug: 'gelendzhik' } as any,
    partner: { id: 'p1', name: 'Авангард-Авто' } as any,
    total_price: 42000,
    status: 'pending',
    start_date: '2025-06-20T10:00:00Z',
    end_date: '2025-06-28T10:00:00Z',
    created_at: '2025-05-18T09:15:00Z',
  },
  {
    id: 'tb_0004jkl',
    destination: { id: 'd1', name: 'Сочи', slug: 'sochi' } as any,
    partner: { id: 'p3', name: 'Black Sea Rent' } as any,
    total_price: 56000,
    status: 'completed',
    start_date: '2025-05-10T10:00:00Z',
    end_date: '2025-05-17T10:00:00Z',
    created_at: '2025-04-25T16:45:00Z',
  },
  {
    id: 'tb_0005mno',
    destination: { id: 'd4', name: 'Новороссийск', slug: 'novorossiysk' } as any,
    partner: { id: 'p2', name: 'Юг-Авто' } as any,
    total_price: 31000,
    status: 'cancelled',
    start_date: '2025-05-05T10:00:00Z',
    end_date: '2025-05-10T10:00:00Z',
    created_at: '2025-04-20T08:30:00Z',
  },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтверждено',
  active: 'Активно',
  completed: 'Завершено',
  cancelled: 'Отменено',
};

const QUICK_LINKS = [
  { path: '/admin/travel/destinations', label: 'Управление направлениями' },
  { path: '/admin/travel/partners', label: 'Партнёры' },
  { path: '/admin/travel/cars', label: 'Автомобили' },
  { path: '/admin/travel/bookings', label: 'Бронирования' },
  { path: '/admin/travel/storage', label: 'Хранение' },
];

export function AdminTravelDashboard() {
  const { hasAdminAccess } = useAuth();
  const navigate = useNavigate();
  const [stats] = useState<DashboardStats>(MOCK_STATS);
  const [recentBookings] = useState<Partial<TravelBooking>[]>(MOCK_RECENT_BOOKINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!hasAdminAccess) {
    return <Navigate to="/admin-login" />;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-loading">Загрузка...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.travelDashboard}>
        <div className={styles.travelPageHeader}>
          <h1>Поездки на море — Дашборд</h1>
        </div>

        {/* Stats Grid */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className={styles.travelStatIcon + ' ' + styles.travelStatIconBookings} />
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.totalBookings}</span>
              <span className="admin-stat-label">Всего бронирований</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className={styles.travelStatIcon + ' ' + styles.travelStatIconActive} />
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.activeTrips}</span>
              <span className="admin-stat-label">Активных поездок</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className={styles.travelStatIcon + ' ' + styles.travelStatIconRevenue} />
            <div className="admin-stat-content">
              <span className="admin-stat-value">{formatCurrency(stats.totalRevenue)}</span>
              <span className="admin-stat-label">Доход</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className={styles.travelStatIcon + ' ' + styles.travelStatIconCommission} />
            <div className="admin-stat-content">
              <span className="admin-stat-value">{formatCurrency(stats.totalCommission)}</span>
              <span className="admin-stat-label">Комиссия</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className={styles.travelQuickLinks}>
          {QUICK_LINKS.map((link) => (
            <div
              key={link.path}
              className={styles.travelQuickLink}
              onClick={() => navigate(link.path)}
            >
              {link.label}
            </div>
          ))}
        </div>

        {/* Recent Bookings */}
        <div className="admin-card">
          <h3>Последние бронирования</h3>
          {recentBookings.length === 0 ? (
            <p className="admin-empty">Нет бронирований</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Направление</th>
                    <th>Партнёр</th>
                    <th>Даты</th>
                    <th>Сумма</th>
                    <th>Статус</th>
                    <th>Дата брони</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <span className="admin-id">{booking.id?.slice(0, 8)}</span>
                      </td>
                      <td>{(booking.destination as any)?.name || '-'}</td>
                      <td>{(booking.partner as any)?.name || '-'}</td>
                      <td>
                        <div className={styles.travelDatesCell}>
                          <span>{formatDate(booking.start_date)}</span>
                          <span className={styles.travelDatesSeparator}>—</span>
                          <span>{formatDate(booking.end_date)}</span>
                        </div>
                      </td>
                      <td className={styles.travelPriceCell}>
                        {formatCurrency(booking.total_price || 0)}
                      </td>
                      <td>
                        <span className={`${styles.travelBadge} ${styles['travelBadge' + (booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : '')]}`}>
                          {STATUS_LABELS[booking.status || ''] || booking.status}
                        </span>
                      </td>
                      <td className="parking-date">{formatDate(booking.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
