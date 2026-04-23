import { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './MobileButton.module.css';

export interface MobileButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Вариант кнопки */
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  /** Размер кнопки */
  size?: 'small' | 'medium' | 'large';
  /** Полная ширина */
  fullWidth?: boolean;
  /** Загрузка */
  loading?: boolean;
  /** Иконка перед текстом */
  icon?: ReactNode;
  /** children */
  children: ReactNode;
}

/**
 * MobileButton - мобильная адаптированная кнопка
 * 
 * Особенности:
 * - Touch-friendly размер (min 44px по рекомендациям Apple)
 * - Оптимизирована для мобильных устройств
 * - Поддержка loading состояния
 * - Поддержка иконок
 */
export function MobileButton({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: MobileButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    size !== 'medium' ? styles[size] : '',
    fullWidth ? styles.fullWidth : '',
    loading ? styles.loading : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button 
      className={classes} 
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className={styles.spinner} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4"/>
          </svg>
        </span>
      )}
      {!loading && icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.text}>{children}</span>
    </button>
  );
}

export default MobileButton;