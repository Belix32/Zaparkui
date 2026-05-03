import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import styles from './PaymentComingSoon.module.css';

/**
 * PaymentComingSoon - Shown after booking is created (payment pending)
 * Indicates that convenient payment methods are coming soon
 */
export function PaymentComingSoon() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <div className={styles.icon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
        </div>
        
        <h1 className={styles.title}>Спасибо за бронирование!</h1>
        
        <p className={styles.message}>
          Здесь скоро будут удобные способы оплаты
        </p>
        
        <p className={styles.subMessage}>
          В ближайшее время мы добавим оплату банковской картой, СБП и другие удобные способы. 
          Бронирование сохранено и ожидает оплаты.
        </p>

        <div className={styles.actions}>
          <Button 
            variant="primary"
            onClick={() => navigate('/my-bookings')}
          >
            Мои бронирования
          </Button>
          <Button 
            variant="ghost"
            onClick={() => navigate('/catalog')}
          >
            Вернуться к каталогу
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PaymentComingSoon;