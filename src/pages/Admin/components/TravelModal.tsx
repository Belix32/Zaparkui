import { useEffect, useCallback, type ReactNode } from 'react';
import styles from './TravelModal.module.css';

export type ModalSize = 'default' | 'wide' | 'full';
export type ModalVariant = 'view' | 'edit' | 'add' | 'delete' | 'custom';

interface TravelModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called when the modal should close (overlay click, escape, close btn) */
  onClose: () => void;
  /** Modal title in header */
  title: string;
  /** Optional subtitle below title */
  subtitle?: string;
  /** Icon emoji shown in header */
  icon?: string;
  /** Size variant */
  size?: ModalSize;
  /** Content of the modal body */
  children: ReactNode;
  /** Optional footer content. If not provided, no footer is shown. */
  footer?: ReactNode;
  /** If true, body has no padding (for custom layouts) */
  bodyNoPadding?: boolean;
}

/**
 * TravelModal — A beautiful, animated modal for the Sea Trips admin section.
 *
 * Features:
 * - Fade + scale animation on open
 * - Gradient header with icon
 * - Escape key to close
 * - Overlay click to close
 * - Dark mode compatible via CSS variables
 */
export function TravelModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  size = 'default',
  children,
  footer,
  bodyNoPadding = false,
}: TravelModalProps) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const sizeClass =
    size === 'wide' ? styles.modalWide : size === 'full' ? styles.modalFull : '';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${sizeClass}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {icon && (
              <div className={styles.headerIcon}>{icon}</div>
            )}
            <div>
              <h2 className={styles.headerTitle}>{title}</h2>
              {subtitle && (
                <div className={styles.headerSubtitle}>{subtitle}</div>
              )}
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={`${styles.body} ${bodyNoPadding ? styles.bodyNoPadding : ''}`}>
          {children}
        </div>

        {/* Footer (if provided) */}
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}

/**
 * Helper to create footer button configurations
 */
export const ModalButtons = {
  close: (onClose: () => void) => (
    <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>
      Закрыть
    </button>
  ),

  cancel: (onClose: () => void) => (
    <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>
      Отмена
    </button>
  ),

  save: (onSave: () => void, disabled = false, label = 'Сохранить') => (
    <button
      className={`${styles.btn} ${styles.btnPrimary}`}
      onClick={onSave}
      disabled={disabled}
    >
      {label}
    </button>
  ),

  add: (onAdd: () => void, disabled = false, label = 'Добавить') => (
    <button
      className={`${styles.btn} ${styles.btnPrimary}`}
      onClick={onAdd}
      disabled={disabled}
    >
      {label}
    </button>
  ),

  delete: (onDelete: () => void, label = 'Удалить') => (
    <button className={`${styles.btn} ${styles.btnDanger}`} onClick={onDelete}>
      {label}
    </button>
  ),

  confirm: (onConfirm: () => void, label = 'Подтвердить') => (
    <button className={`${styles.btn} ${styles.btnSuccess}`} onClick={onConfirm}>
      {label}
    </button>
  ),

  dangerAction: (onAction: () => void, label = 'Подтвердить') => (
    <button className={`${styles.btn} ${styles.btnDanger}`} onClick={onAction}>
      {label}
    </button>
  ),

  custom: (label: string, onClick: () => void, variant: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' = 'primary') => {
    const variantClass = {
      primary: styles.btnPrimary,
      secondary: styles.btnSecondary,
      danger: styles.btnDanger,
      success: styles.btnSuccess,
      warning: styles.btnWarning,
    }[variant];
    return (
      <button className={`${styles.btn} ${variantClass}`} onClick={onClick}>
        {label}
      </button>
    );
  },
};
