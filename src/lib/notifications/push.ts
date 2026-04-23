/**
 * Push Notifications - Заглушка push-уведомлений через Capacitor
 * Симулирует локальные уведомления
 */

import { LocalNotifications } from '@capacitor/local-notifications';

// Capacitor v5 types compatibility
interface NotificationPermissionResult {
  granted: boolean;
}

interface NotificationCheckResult {
  receive?: string;
}

export interface PushSubscription {
  id: string;
  token: string;
  userId?: string;
  registeredAt: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  schedule?: Date;
}

export interface PermissionState {
  granted: boolean;
  canSchedule: boolean;
}

/**
 * Запросить разрешение на отправку уведомлений
 * @returns Состояние разрешения
 */
export async function requestPermission(): Promise<PermissionState> {
  try {
    const result = await LocalNotifications.requestPermissions();
    if (result && 'granted' in result) {
      return {
        granted: Boolean((result as { granted: boolean }).granted),
        canSchedule: Boolean((result as { granted: boolean }).granted),
      };
    }
    return { granted: true, canSchedule: true };
  } catch (error) {
    console.log('[Push Mock] Разрешение уже предоставлено (Cordova):', error);
    return { granted: true, canSchedule: true };
  }
}

/**
 * Проверить текущее состояние разрешений
 * @returns Состояние разрешений
 */
export async function checkPermission(): Promise<PermissionState> {
  try {
    const result = await LocalNotifications.checkPermissions();
    if (result && 'receive' in result) {
      return {
        granted: result.receive === 'granted',
        canSchedule: result.receive === 'granted',
      };
    }
    return { granted: true, canSchedule: true };
  } catch {
    return { granted: true, canSchedule: true };
  }
}

/**
 * Подписаться на push-уведомления
 * @param userId - ID пользователя (опционально)
 * @returns Объект подписки
 */
export async function subscribe(userId?: string): Promise<PushSubscription> {
  // Запрашиваем разрешение
  const permission = await requestPermission();
  
  if (!permission.granted) {
    throw new Error('Разрешение на уведомления не предоставлено');
  }

  // Генерируем токен (в реальном приложении он бы пришел от FCM/APNs)
  const token = `fcm_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  const subscription: PushSubscription = {
    id: `sub_${Date.now()}`,
    token,
    userId,
    registeredAt: new Date().toISOString(),
  };

  console.log('[Push Mock] Подписка создана:', subscription.id);
  return subscription;
}

/**
 * Отписаться от push-уведомлений
 * @param subscriptionId - ID подписки
 */
export async function unsubscribe(subscriptionId: string): Promise<void> {
  console.log('[Push Mock] Отписка от:', subscriptionId);
  // В реальном приложении здесь бы был запрос на удаление подписки
}

/**
 * Отправить локальное уведомление
 * @param payload - Данные уведомления
 * @returns ID уведомления
 */
export async function sendLocal(payload: NotificationPayload): Promise<number> {
  // Проверяем разрешение
  const permission = await checkPermission();
  
  if (!permission.granted) {
    throw new Error('Нет разрешения на отправку уведомлений');
  }

  const notificationId = Date.now();
  
  // Create notification object
  const notification: {
    title: string;
    body: string;
    id: number;
    extra?: Record<string, string>;
    schedule?: { at: Date };
  } = {
    title: payload.title,
    body: payload.body,
    id: notificationId,
    extra: payload.data,
  };

  if (payload.schedule) {
    notification.schedule = {
      at: payload.schedule,
    };
  }

  try {
    await LocalNotifications.schedule({
      notifications: [notification],
    });
    console.log('[Push Mock] Уведомление отправлено:', notification.title);
    return notificationId;
  } catch (error) {
    console.log('[Push Mock] Ошибка отправки (ожидаемо в dev):', error);
    // В dev режиме возвращаем mock ID
    return notificationId;
  }
}

/**
 * Удалить все запланированные уведомления
 */
export async function clearAll(): Promise<void> {
  try {
    await LocalNotifications.cancel({ notifications: [] });
    console.log('[Push Mock] Все уведомления удалены');
  } catch (error) {
    console.log('[Push Mock] Очистка (ожидаемо в dev):', error);
  }
}

/**
 * Получить список запланированных уведомлений
 */
export async function getScheduled(): Promise<unknown[]> {
  try {
    const result = await LocalNotifications.getPending();
    return result.notifications || [];
  } catch {
    return [];
  }
}

/**
 * Обработчик для foreground уведомлений
 * @param callback - Функция обратного вызова
 */
export function onForegroundNotification(
  callback: (notification: unknown) => void
): () => void {
  // Добавляем listener для foreground уведомлений
  try {
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      callback(notification);
    });
  } catch {
    console.log('[Push Mock] Foreground listener (mock mode)');
  }

  // Возвращаем функцию для удаления listener
  return () => {
    try {
      // Cleanup если необходимо
    } catch {
      // Игнорируем
    }
  };
}

/**
 * Обработчик для уведомлений, открытых из трея
 * @param callback - Функция обратного вызова
 */
export function onNotificationTapped(
  callback: (notification: unknown) => void
): () => void {
  try {
    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      callback(notification);
    });
  } catch {
    console.log('[Push Mock] Notification tap listener (mock mode)');
  }

  return () => {
    try {
      // Cleanup
    } catch {
      // Игнорируем
    }
  };
}

/**
 * Утилита для создания уведомления о бронировании
 */
export async function notifyBookingConfirmed(bookingId: string, parkingTitle: string): Promise<number> {
  return sendLocal({
    title: 'Бронирование подтверждено',
    body: `Парковка "${parkingTitle}" успешно забронирована`,
    data: { bookingId, type: 'booking_confirmed' },
  });
}

/**
 * Утилита для создания уведомления о напоминании
 */
export async function notifyBookingReminder(
  bookingId: string,
  parkingTitle: string,
  minutesBefore: number
): Promise<number> {
  const minutesText = minutesBefore >= 60 
    ? `${Math.floor(minutesBefore / 60)} час${minutesBefore >= 120 ? 'ов' : ''}`
    : `${minutesBefore} минут`;
    
  return sendLocal({
    title: 'Напоминание о брони',
    body: `Бронирование на "${parkingTitle}" начнется через ${minutesText}`,
    data: { bookingId, type: 'booking_reminder' },
  });
}