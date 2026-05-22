import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button/Button';
import styles from './AdminLogin.module.css';

/**
 * AdminLogin - Dedicated admin authentication page
 * Accessible at /admin-login
 */
export function AdminLogin() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Введите email и пароль');
      setLoading(false);
      return;
    }

    try {
      const result = await login(email, password);
      
      if (result.success) {
        if (result.role === 'admin') {
          navigate('/admin');
        } else {
          setError('У вас нет доступа к админ-панели');
        }
      } else {
        setError(result.error || 'Ошибка входа');
      }
    } catch (err) {
      setError('Ошибка входа. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  }, [email, password, login, navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 className={styles.title}>Админ-панель</h1>
          <p className={styles.subtitle}>Вход для администраторов</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.field}>
            <label htmlFor="email">Email администратора</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </Button>
        </form>

        <div className={styles.footer}>
          <a href="/" className={styles.backLink}>
            ← Вернуться на сайт
          </a>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;