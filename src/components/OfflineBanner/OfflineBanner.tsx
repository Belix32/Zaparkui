import { useState, useEffect } from 'react';
import styles from './OfflineBanner.module.css';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsOnline(navigator.onLine);
    setShow(!navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShow(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShow(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!show) return null;

  return (
    <div className={styles.banner} role="alert">
      <span className={styles.icon}>📡</span>
      <span className={styles.text}>Нет подключения к интернету. Проверьте соединение.</span>
    </div>
  );
}