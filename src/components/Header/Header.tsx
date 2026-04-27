import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../Button/Button';
import { useFavorites } from '../../hooks';
import styles from './Header.module.css';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { toggleTheme, isDark } = useTheme();
  const { user, logout, hasAdminAccess } = useAuth();
  const { favorites } = useFavorites();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className="container">
        <div className={styles.headerInner}>
          <Link to="/" className={styles.logo}>
            <img src="/vite.svg" alt="Logo" className={styles.logoIcon} />
            <span>Запаркуй</span>
          </Link>

<nav className={styles.nav} aria-label="Главное меню">
        <NavLink to="/" className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}>Главная</NavLink>
        <NavLink to="/catalog" className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}>Каталог</NavLink>
      </nav>

          <div className={styles.actions}>
            <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
              {isDark ? '☀️' : '🌙'}
            </button>
            {user ? (
              <>
                <Link to="/profile" className={styles.favoritesLink}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {favorites.length > 0 && <span className={styles.favoritesBadge}>{favorites.length}</span>}
                </Link>
                <Link to="/dashboard"><Button variant="ghost" size="small">Личный кабинет</Button></Link>
                {hasAdminAccess && (
                  <Link to="/admin"><Button variant="outline" size="small">Админка</Button></Link>
                )}
                <Button variant="secondary" size="small" onClick={handleLogout}>Выйти</Button>
              </>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost" size="small">Вход</Button></Link>
                <Link to="/register"><Button variant="primary" size="small">Регистрация</Button></Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}