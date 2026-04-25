import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../Auth.module.css';

// Security: Rate limiting utility (max 5 attempts per minute)
const loginAttempts = new Map<string, { count: number; timestamp: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_TIME = 60 * 1000; // 1 minute window

function checkRateLimit(email: string): { allowed: boolean; remainingTime?: number } {
  const attempts = loginAttempts.get(email);
  const now = Date.now();
  
  if (!attempts) return { allowed: true };
  
  // Check if we're in the 1-minute window
  const windowElapsed = now - attempts.firstAttempt;
  if (windowElapsed >= WINDOW_TIME) {
    // Reset the window
    loginAttempts.delete(email);
    return { allowed: true };
  }
  
  if (attempts.count >= MAX_ATTEMPTS) {
    const remainingTime = Math.ceil((WINDOW_TIME - windowElapsed) / 1000);
    return { allowed: false, remainingTime };
  }
  return { allowed: true };
}

function recordFailedAttempt(email: string): void {
  const now = Date.now();
  const attempts = loginAttempts.get(email);
  
  if (!attempts || (now - attempts.firstAttempt) >= WINDOW_TIME) {
    // Start new tracking window
    loginAttempts.set(email, { count: 1, timestamp: now, firstAttempt: now });
  } else {
    attempts.count++;
    attempts.timestamp = now;
    loginAttempts.set(email, attempts);
  }
}

// Security: Sanitize input
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .substring(0, 254);
}

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isLoading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Security: Sanitize inputs
    const sanitizedEmail = sanitizeInput(email);
    
    if (!sanitizedEmail || !password) {
      setError('Заполните все поля');
      setLoading(false);
      return;
    }

    // Security: Rate limiting check
    const rateCheck = checkRateLimit(sanitizedEmail);
    if (!rateCheck.allowed) {
      setError(`Слишком много попыток. Попробуйте через ${rateCheck.remainingTime} секунд`);
      setLoading(false);
      return;
    }

    const result = await login(sanitizedEmail, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      recordFailedAttempt(sanitizedEmail);
      setError(result.error || 'Ошибка входа. Попробуйте снова.');
    }
    setLoading(false);
  };

  // Security: Debounced input handler
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow valid email characters
    const sanitized = value.replace(/[^\w@.\-]/g, '');
    setEmail(sanitized);
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <div className={styles.header}>
            <div className={styles.logo}>
              <img src="/vite.svg" alt="Logo" className={styles.logoIcon} />
              <span>Запаркуй</span>
            </div>
          </div>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <img src="/vite.svg" alt="Logo" className={styles.logoIcon} />
            <span>Запаркуй</span>
          </div>
          <h1 className={styles.title}>С возвращением</h1>
          <p className={styles.subtitle}>Войдите в свой аккаунт</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          <Input
            type="email"
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChange={handleEmailChange}
            autoComplete="email"
            required
            disabled={loading}
          />
          <Input
            type="password"
            label="Пароль"
            placeholder="••••••••"
            value={password}
            onChange={handlePasswordChange}
            autoComplete="current-password"
            required
            minLength={8}
            disabled={loading}
          />
          <Button type="submit" variant="primary" fullWidth disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </Button>
        </form>

        <div className={styles.divider}>или</div>

        <p className={styles.footer}>
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}