/**
 * usePushNotifications - Hook для управления push-уведомлениями
 */

import { useState, useEffect, useCallback } from 'react';
import {
  requestPermission,
  checkPermission,
  subscribe,
  unsubscribe,
  sendLocal,
  clearAll,
  PermissionState,
  PushSubscription,
  notifyBookingConfirmed,
} from '../lib/notifications/push';

interface UsePushNotificationsReturn {
  // Состояние
  permission: PermissionState | null;
  subscription: PushSubscription | null;
  isLoading: boolean;
  error: string | null;
  // Методы
  init: () => Promise<void>;
  subscribeUser: (userId?: string) => Promise<void>;
  unsubscribeUser: () => Promise<void>;
  sendNotification: (title: string, body: string, data?: Record<string, string>) => Promise<void>;
  clearNotifications: () => Promise<void>;
  // Уведомления о бронированиях
  notifyBooking: (bookingId: string, parkingTitle: string) => Promise<void>;
}

const STORAGE_KEY = 'zaparkyi_push_subscription';

/**
 * Hook для работы с push-уведомлениями
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загружаем подписку из storage при инициализации
  useEffect(() => {
    const loadSubscription = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSubscription(parsed);
        }
      } catch {
        // Игнорируем ошибки чтения
      }
    };

    loadSubscription();
  }, []);

  /**
   * Инициализировать уведомления - проверить разрешения
   */
  const init = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const perm = await checkPermission();
      setPermission(perm);
    } catch (err) {
      console.error('Push init error:', err);
      setError('Ошибка инициализации уведомлений');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Подписать пользователя на уведомления
   */
  const subscribeUser = useCallback(async (userId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const perm = await requestPermission();
      
      if (!perm.granted) {
        setError('Разрешение на уведомления отклонено');
        setIsLoading(false);
        return;
      }

      setPermission(perm);

      const sub = await subscribe(userId);
      setSubscription(sub);

      // Сохраняем в storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sub));

      console.log('[usePushNotifications] Подписка оформлена:', sub.token);
    } catch (err) {
      console.error('Subscribe error:', err);
      setError('Ошибка подписки на уведомления');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Отписать пользователя от уведомлений
   */
  const unsubscribeUser = useCallback(async () => {
    if (!subscription?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      await unsubscribe(subscription.id);
      setSubscription(null);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Unsubscribe error:', err);
      setError('Ошибка отписки от уведомлений');
    } finally {
      setIsLoading(false);
    }
  }, [subscription?.id]);

  /**
   * Отправить уведомление
   */
  const sendNotification = useCallback(async (
    title: string,
    body: string,
    data?: Record<string, string>
  ) => {
    try {
      await sendLocal({ title, body, data });
    } catch (err) {
      console.error('Send notification error:', err);
      setError('Ошибка отправки уведомления');
    }
  }, []);

  /**
   * Очистить все уведомления
   */
  const clearNotifications = useCallback(async () => {
    try {
      await clearAll();
    } catch (err) {
      console.error('Clear notifications error:', err);
    }
  }, []);

  /**
   * Отправить уведомление о бронировании
   */
  const notifyBooking = useCallback(async (bookingId: string, parkingTitle: string) => {
    try {
      await notifyBookingConfirmed(bookingId, parkingTitle);
    } catch (err) {
      console.error('Notify booking error:', err);
    }
  }, []);

  return {
    permission,
    subscription,
    isLoading,
    error,
    init,
    subscribeUser,
    unsubscribeUser,
    sendNotification,
    clearNotifications,
    notifyBooking,
  };
}

export default usePushNotifications;