import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import './AdminLayout.css';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/admin', label: 'Дашборд', icon: '' },
  { path: '/admin/parkings', label: 'Парковки', icon: '' },
  { path: '/admin/users', label: 'Пользователи', icon: '' },
  { path: '/admin/bookings', label: 'Бронирования', icon: '' },
  { path: '/admin/reviews', label: 'Отзывы', icon: '' },
  { path: '/admin/promotions', label: 'Акции', icon: '' },
  { path: '/admin/settings', label: 'Настройки', icon: '' },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout, hasAdminAccess } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!hasAdminAccess) {
    return (
      <div className="admin-unauthorized">
        <h1>Доступ запрещен</h1>
        <p>У вас нет прав для просмотра этой страницы.</p>
        <button onClick={() => navigate('/')}>На главную</button>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Zaparkyi</h2>
          <span className="admin-badge">{user?.role === 'admin' ? 'Админ' : 'Модератор'}</span>
        </div>
        
        <nav className="admin-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              end={item.path === '/admin'}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <span className="admin-user-name">{user?.name}</span>
            <span className="admin-user-email">{user?.email}</span>
          </div>
          <button onClick={handleLogout} className="admin-logout-btn">
            Выйти
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>Панель управления</h1>
          <div className="admin-header-actions">
            <button onClick={() => navigate('/')} className="admin-back-btn">
              ← На сайт
            </button>
          </div>
        </header>
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}