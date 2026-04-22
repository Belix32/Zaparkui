import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../Auth.module.css';

// Security: Rate limiting
const registerAttempts = new Map<string, { count: number; timestamp: number }>();
const MAX_ATTEMPTS = 3;
const LOCKOUT_TIME = 60 * 60 * 1000; // 1 hour

function checkRateLimit(email: string): { allowed: boolean; remainingTime?: number } {
  const attempts = registerAttempts.get(email);
  if (!attempts) return { allowed: true };
  
  if (attempts.count >= MAX_ATTEMPTS) {
    const elapsed = Date.now() - attempts.timestamp;
    if (elapsed < LOCKOUT_TIME) {
      return { allowed: false, remainingTime: Math.ceil((LOCKOUT_TIME - elapsed) / 1000) };
    }
    registerAttempts.delete(email);
  }
  return { allowed: true };
}

function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .substring(0, 100);
}

function sanitizePhone(input: string): string {
  return input
    .replace(/[^\d\s\-+()]/g, '')
    .replace(/\s/g, '')
    .substring(0, 20);
}

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, isLoading: authLoading, isAuthenticated } = useAuth();
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
    setSuccessMessage('');
    setLoading(true);

    // Security: Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const sanitizedPhone = sanitizePhone(phone);
    
    if (!sanitizedName || !sanitizedEmail || !sanitizedPhone || !password) {
      setError('Заполните все поля');
      setLoading(false);
      return;
    }

    // Security: Minimum length checks
    if (sanitizedName.length < 2) {
      setError('Имя должно быть не менее 2 символов');
      setLoading(false);
      return;
    }
    
    if (password.length < 8) {
      setError('Пароль должен быть не менее 8 символов');
      setLoading(false);
      return;
    }

    // Security: Rate limiting
    const rateCheck = checkRateLimit(sanitizedEmail);
    if (!rateCheck.allowed) {
      setError(`Слишком много попыток регистрации. Попробуйте через ${rateCheck.remainingTime} секунд`);
      setLoading(false);
      return;
    }

    const result = await register(sanitizedName, sanitizedEmail, sanitizedPhone, password);
    
    if (result.success) {
      // Check if verification is needed (handle both old and new response formats)
      const needsVerification = 'needsVerification' in result && result.needsVerification;
      
      if (needsVerification) {
        // Email verification required
        setSuccessMessage('Проверьте вашу почту для подтверждения регистрации');
        // Clear form after successful registration with verification
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
      } else {
        // Auto-login successful
        navigate('/dashboard');
      }
    } else {
      registerAttempts.set(sanitizedEmail, {
        count: (registerAttempts.get(sanitizedEmail)?.count || 0) + 1,
        timestamp: Date.now(),
      });
      setError(result.error || 'Ошибка регистрации. Попробуйте снова.');
    }
    setLoading(false);
  };

  // Security: Controlled input handlers
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/[^\w\s\u0400-\u04FF\-]/g, '').substring(0, 50);
    setName(sanitized);
  }, []);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/[^\w@.\-]/g, '').toLowerCase().substring(0, 254);
    setEmail(sanitized);
  }, []);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(sanitizePhone(e.target.value));
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow up to 128 chars for password
    setPassword(e.target.value.substring(0, 128));
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
          <h1 className={styles.title}>Создать аккаунт</h1>
          <p className={styles.subtitle}>Присоединяйтесь к Запаркуй</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          {successMessage && <div className={styles.success}>{successMessage}</div>}
          <Input
            type="text"
            label="Имя"
            placeholder="Ваше имя"
            value={name}
            onChange={handleNameChange}
            autoComplete="name"
            required
            minLength={2}
            maxLength={50}
            disabled={loading}
          />
          <Input
            type="email"
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChange={handleEmailChange}
            autoComplete="email"
            required
            maxLength={254}
            disabled={loading}
          />
          <Input
            type="tel"
            label="Телефон"
            placeholder="+79990000000"
            value={phone}
            onChange={handlePhoneChange}
            autoComplete="tel"
            required
            minLength={10}
            maxLength={20}
            disabled={loading}
          />
          <Input
            type="password"
            label="Пароль"
            placeholder="••••••••"
            value={password}
            onChange={handlePasswordChange}
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            disabled={loading}
          />
          <Button type="submit" variant="primary" fullWidth disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
        </form>

        <div className={styles.divider}>или</div>

        <p className={styles.footer}>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}