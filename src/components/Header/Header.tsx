import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../Button/Button';
import { useFavorites } from '../../hooks';
import styles from './Header.module.css';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const { favorites } = useFavorites();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [navigate]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className="container">
        <div className={styles.headerInner}>
          <Link to="/" className={styles.logo}>
            <img src="/vite.svg" alt="Logo" className={styles.logoIcon} />
            <span>Запаркуй</span>
          </Link>

          <nav className={`${styles.nav} ${mobileMenuOpen ? styles.navOpen : ''}`}>
            <NavLink to="/" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}>
              Главная
            </NavLink>
            <NavLink to="/catalog" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}>
              Каталог
            </NavLink>
          </nav>

          <div className={styles.actions}>
            <button 
              className={styles.themeToggle} 
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            {user ? (
              <>
                <Link to="/profile" className={styles.favoritesLink}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {favorites.length > 0 && (
                    <span className={styles.favoritesBadge}>{favorites.length}</span>
                  )}
                </Link>
                <Link to="/dashboard">
                  <Button variant="ghost" size="small">Личный кабинет</Button>
                </Link>
                <Button variant="secondary" size="small" onClick={handleLogout}>
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="small">Вход</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="small">Регистрация</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            className={`${styles.menuButton} ${mobileMenuOpen ? styles.menuButtonOpen : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span className={styles.menuIcon}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <div className={`${styles.mobileMenuOverlay} ${mobileMenuOpen ? styles.mobileMenuOverlayOpen : ''}`} onClick={() => setMobileMenuOpen(false)} />
      
      {/* Mobile menu */}
      <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
        <nav className={styles.mobileNav}>
          <NavLink to="/" className={({ isActive }) => isActive ? `${styles.mobileNavLink} ${styles.mobileNavLinkActive}` : styles.mobileNavLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Главная
          </NavLink>
          <NavLink to="/catalog" className={({ isActive }) => isActive ? `${styles.mobileNavLink} ${styles.mobileNavLinkActive}` : styles.mobileNavLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Каталог
          </NavLink>
          {user && (
<NavLink to="/profile" className={({ isActive }) => isActive ? `${styles.mobileNavLink} ${styles.mobileNavLinkActive}` : styles.mobileNavLink}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Профиль
            </NavLink>
          </nav>
        <div className={styles.mobileAuth}>
          {user ? (
            <Button variant="secondary" fullWidth onClick={handleLogout}>
              Выйти
            </Button>
          ) : (
            <div className={styles.mobileAuthButtons}>
              <Link to="/login">
                <Button variant="ghost" fullWidth>Вход</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" fullWidth>Регистрация</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}