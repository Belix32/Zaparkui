import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Partner.module.css';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/partner', label: 'Дашборд', icon: '📊' },
  { path: '/partner/cars', label: 'Мои авто', icon: '🚗' },
  { path: '/partner/bookings', label: 'Бронирования', icon: '📅' },
  { path: '/partner/storage', label: 'Хранение', icon: '🔒' },
];

interface PartnerLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function PartnerLayout({ children, title = 'Кабинет партнёра' }: PartnerLayoutProps) {
  const { user, logout, isPartner } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const closeSidebar = () => setSidebarOpen(false);

  if (!isPartner) {
    return (
      <div className={styles.unauthorized}>
        <h1>Доступ запрещён</h1>
        <p>У вас нет прав партнёра для просмотра этой страницы.</p>
        <button onClick={() => navigate('/')}>На главную</button>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 99,
          }}
          onClick={closeSidebar}
        />
      )}

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarLogo}>Запаркуй</h2>
          <span className={styles.sidebarBadge}>Партнёр</span>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>
            <div className={styles.navSectionTitle}>Меню</div>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
                end={item.path === '/partner'}
                onClick={closeSidebar}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarUserInfo}>
            <span className={styles.sidebarUserName}>{user?.name || 'Партнёр'}</span>
            <span className={styles.sidebarUserEmail}>{user?.email || ''}</span>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Выйти
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className={styles.mobileToggle}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Открыть меню"
            >
              {sidebarOpen ? '✕' : '☰'}
            </button>
            <h1 className={styles.headerTitle}>{title}</h1>
          </div>
          <div className={styles.headerActions}>
            <button onClick={() => navigate('/')} className={styles.backBtn}>
              ← На сайт
            </button>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
