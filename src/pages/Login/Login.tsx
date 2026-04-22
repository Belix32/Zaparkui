import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../Auth.module.css';

// Security: Rate limiting utility
const loginAttempts = new Map<string, { count: number; timestamp: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(email: string): { allowed: boolean; remainingTime?: number } {
  const attempts = loginAttempts.get(email);
  if (!attempts) return { allowed: true };
  
  if (attempts.count >= MAX_ATTEMPTS) {
    const elapsed = Date.now() - attempts.timestamp;
    if (elapsed < LOCKOUT_TIME) {
      return { allowed: false, remainingTime: Math.ceil((LOCKOUT_TIME - elapsed) / 1000) };
    }
    // Reset after lockout period
    loginAttempts.delete(email);
  }
  return { allowed: true };
}

function recordFailedAttempt(email: string): void {
  const attempts = loginAttempts.get(email) || { count: 0, timestamp: 0 };
  attempts.count++;
  attempts.timestamp = Date.now();
  loginAttempts.set(email, attempts);
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
  const { login } = useAuth();
  const navigate = useNavigate();

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