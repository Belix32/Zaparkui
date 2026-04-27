import { useState, useEffect } from 'react';
import { AdminLayout } from './components/AdminLayout';
import { 
  getAdminStats, 
  getRecentBookings, 
  getRecentParkings, 
  getRecentUsers,
  isSupabaseConfigured,
} from '../../lib/supabase';
import './AdminDashboard.css';

interface Stats {
  totalUsers: number;
  totalParkings: number;
  activeParkings: number;
  totalBookings: number;
  activeBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'booking' | 'parking' | 'review';
  message: string;
  timestamp: string;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalParkings: 0,
    activeParkings: 0,
    totalBookings: 0,
    activeBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    
    try {
      // Try to load from Supabase first
      if (isSupabaseConfigured()) {
        const stats = await getAdminStats();
        setStats({
          totalUsers: stats.totalUsers,
          totalParkings: stats.totalParkings,
          activeParkings: stats.activeParkings,
          totalBookings: stats.totalBookings,
          activeBookings: stats.activeBookings,
          pendingBookings: stats.pendingBookings,
          totalRevenue: stats.totalRevenue,
          newUsersThisWeek: stats.newUsersThisWeek,
          newUsersThisMonth: stats.newUsersThisMonth,
        });

        // Load recent activity from Supabase
        const [recentBookings, recentParkings, recentUsers] = await Promise.all([
          getRecentBookings(5),
          getRecentParkings(3),
          getRecentUsers(2),
        ]);

        const activities: RecentActivity[] = [];
        
        recentBookings.forEach((b) => {
          activities.push({
            id: b.id,
            type: 'booking',
            message: `Новое бронирование #${b.id.slice(0, 8)}`,
            timestamp: b.created_at,
          });
        });
        
        recentParkings.forEach((p) => {
          activities.push({
            id: p.id,
            type: 'parking',
            message: `Новая парковка: ${p.title}`,
            timestamp: p.created_at,
          });
        });
        
        recentUsers.forEach((u) => {
          activities.push({
            id: u.id,
            type: 'user',
            message: `Новый пользователь: ${u.name}`,
            timestamp: u.created_at,
          });
        });
        
        setRecentActivity(activities.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ).slice(0, 10));
      } else {
        // Fallback to localStorage (demo mode)
        loadStatsFromLocalStorage();
      }
    } catch (error) {
      console.error('Error loading stats from Supabase:', error);
      // Fallback to localStorage on error
      loadStatsFromLocalStorage();
    }
    
    setLoading(false);
  };

  const loadStatsFromLocalStorage = () => {
    const users = JSON.parse(localStorage.getItem('zaparkyi_admin_users') || '[]');
    const parkings = JSON.parse(localStorage.getItem('zaparkyi_parkings') || '[]');
    const bookings = JSON.parse(localStorage.getItem('zaparkyi_bookings') || '[]');
    
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
    
    const newUsers = users.filter((u: any) => new Date(u.created_at || now).getTime() > monthAgo);
    
    setStats({
      totalUsers: users.length,
      totalParkings: parkings.length,
      activeParkings: parkings.filter((p: any) => p.is_active !== false).length,
      totalBookings: bookings.length,
      activeBookings: bookings.filter((b: any) => b.status === 'active' || b.status === 'confirmed').length,
      pendingBookings: bookings.filter((b: any) => b.status === 'pending').length,
      totalRevenue: bookings
        .filter((b: any) => b.payment_status === 'paid')
        .reduce((sum: number, b: any) => sum + (b.total_price || 0), 0),
      newUsersThisWeek: newUsers.filter((u: any) => new Date(u.created_at || now).getTime() > weekAgo).length,
      newUsersThisMonth: newUsers.length,
    });

    // Generate recent activity
    const activities: RecentActivity[] = [];
    
    bookings.slice(-5).forEach((b: any) => {
      activities.push({
        id: b.id,
        type: 'booking',
        message: `Новое бронирование #${b.id.slice(0, 8)}`,
        timestamp: b.created_at || new Date().toISOString(),
      });
    });
    
    parkings.slice(-3).forEach((p: any) => {
      activities.push({
        id: p.id,
        type: 'parking',
        message: `Новая парковка: ${p.title}`,
        timestamp: p.created_at || new Date().toISOString(),
      });
    });
    
    users.slice(-2).forEach((u: any) => {
      activities.push({
        id: u.id,
        type: 'user',
        message: `Новый пользователь: ${u.name}`,
        timestamp: u.created_at || new Date().toISOString(),
      });
    });
    
    setRecentActivity(activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 10));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
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
      <div className="admin-dashboard">
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">👥</div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.totalUsers}</span>
              <span className="admin-stat-label">Всего пользователей</span>
              <span className="admin-stat-sub">+{stats.newUsersThisWeek} за неделю</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">🅿️</div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.totalParkings}</span>
              <span className="admin-stat-label">Всего парковок</span>
              <span className="admin-stat-sub">{stats.activeParkings} активных</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">📅</div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.totalBookings}</span>
              <span className="admin-stat-label">Всего бронирований</span>
              <span className="admin-stat-sub">{stats.activeBookings} активных</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">💰</div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{formatCurrency(stats.totalRevenue)}</span>
              <span className="admin-stat-label">Общая выручка</span>
              <span className="admin-stat-sub">{stats.pendingBookings} в ожидании</span>
            </div>
          </div>
        </div>

        <div className="admin-dashboard-grid">
          <div className="admin-card admin-activity-card">
            <h3>📋 Последняя активность</h3>
            {recentActivity.length === 0 ? (
              <p className="admin-empty">Нет активности</p>
            ) : (
              <ul className="admin-activity-list">
                {recentActivity.map((activity) => (
                  <li key={activity.id} className="admin-activity-item">
                    <span className="admin-activity-icon">
                      {activity.type === 'user' && '👤'}
                      {activity.type === 'booking' && '📅'}
                      {activity.type === 'parking' && '🅿️'}
                      {activity.type === 'review' && '⭐'}
                    </span>
                    <span className="admin-activity-message">{activity.message}</span>
                    <span className="admin-activity-time">{formatDate(activity.timestamp)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="admin-card admin-quick-actions">
            <h3>⚡ Быстрые действия</h3>
            <div className="admin-quick-actions-grid">
              <a href="/admin/parkings" className="admin-quick-action">
                🅿️ Все парковки
              </a>
              <a href="/admin/users" className="admin-quick-action">
                👥 Все пользователи
              </a>
              <a href="/admin/bookings" className="admin-quick-action">
                📅 Бронирования
              </a>
              <a href="/admin/reviews" className="admin-quick-action">
                ⭐ Модерация отзывов
              </a>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}