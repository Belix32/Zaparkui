import { ReactNode, HTMLAttributes } from 'react';
import styles from './MobileCard.module.css';

export interface MobileCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Вариант карточки */
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  /** Размер */
  size?: 'small' | 'medium' | 'large';
  /** Заголовок */
  title?: string;
  /** Подзаголовок */
  subtitle?: string;
  /** Контент */
  children: ReactNode;
  /** Футер */
  footer?: ReactNode;
  /** Клик */
  onClick?: () => void;
}

/**
 * MobileCard - мобильная адаптированная карточка
 * 
 * Особенности:
 * - Оптимизирована для мобильных устройств
 * - Поддержка variant (default, elevated, outlined, ghost)
 * - Support для touch interactions
 * - Safe area padding
 */
export function MobileCard({
  variant = 'default',
  size = 'medium',
  title,
  subtitle,
  children,
  footer,
  onClick,
  className = '',
  ...props
}: MobileCardProps) {
  const classes = [
    styles.card,
    styles[variant],
    styles[size],
    onClick ? styles.clickable : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div 
      className={classes}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? ' button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {(title || subtitle) && (
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      )}
      
      <div className={styles.content}>
        {children}
      </div>
      
      {footer && (
        <div className={styles.footer}>
          {footer}
        </div>
      )}
    </div>
  );
}

export default MobileCard;