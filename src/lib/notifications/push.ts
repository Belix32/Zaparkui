/**
 * Push Notifications - Web-compatible stub for push notifications
 * Falls back to browser APIs or no-ops in web environment
 */

// Check if running in Capacitor native environment
const isNative = typeof window !== 'undefined' && 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).Capacitor?.isNativePlatform?.();

// Lazy-loaded Capacitor module (only in native apps)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let LocalNotifications: any = null;

async function loadLocalNotifications() {
  if (!LocalNotifications && isNative) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      LocalNotifications = require('@capacitor/local-notifications');
    } catch {
      console.log('[Push] LocalNotifications not available');
    }
  }
  return LocalNotifications;
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
    const module = await loadLocalNotifications();
    if (module) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (module as any).requestPermissions();
      if (result && 'granted' in result) {
        return {
          granted: Boolean((result as { granted: boolean }).granted),
          canSchedule: Boolean((result as { granted: boolean }).granted),
        };
      }
    }
    return { granted: true, canSchedule: true };
  } catch (error) {
    console.log('[Push] Разрешение уже предоставлено (web mode):', error);
    return { granted: true, canSchedule: true };
  }
}

/**
 * Проверить текущее состояние разрешений
 * @returns Состояние разрешений
 */
export async function checkPermission(): Promise<PermissionState> {
  try {
    const module = await loadLocalNotifications();
    if (module) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (module as any).checkPermissions();
      if (result && 'receive' in result) {
        return {
          granted: result.receive === 'granted',
          canSchedule: result.receive === 'granted',
        };
      }
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
  
  // In native app, use LocalNotifications
  const module = await loadLocalNotifications();
  if (module) {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (module as any).schedule({
        notifications: [notification],
      });
      console.log('[Push] Уведомление отправлено (native):', notification.title);
      return notificationId;
    } catch (error) {
      console.log('[Push] Ошибка отправки:', error);
      return notificationId;
    }
  }

  // Web fallback: show browser notification if permitted
  if ('Notification' in window && Notification.permission === 'granted') {
    new window.Notification(payload.title, { body: payload.body });
  }
  
  console.log('[Push] Уведомление (mock/web):', payload.title);
  return notificationId;
}

/**
 * Удалить все запланированные уведомления
 */
export async function clearAll(): Promise<void> {
  try {
    const module = await loadLocalNotifications();
    if (module) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (module as any).cancel({ notifications: [] });
    }
    console.log('[Push] Все уведомления удалены');
  } catch (error) {
    console.log('[Push] Очистка (web mode):', error);
  }
}

/**
 * Получить список запланированных уведомлений
 */
export async function getScheduled(): Promise<unknown[]> {
  try {
    const module = await loadLocalNotifications();
    if (module) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (module as any).getPending();
      return result.notifications || [];
    }
    return [];
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plugin = isNative ? (window as any).Capacitor?.Plugins?.LocalNotifications : null;
  
  if (plugin) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      plugin.addListener('localNotificationReceived', (notification: any) => {
        callback(notification);
      });
    } catch {
      console.log('[Push] Foreground listener unavailable');
    }
  }

  return () => {};
}

/**
 * Обработчик для уведомлений, открытых из трея
 * @param callback - Функция обратного вызова
 */
export function onNotificationTapped(
  callback: (notification: unknown) => void
): () => void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plugin = isNative ? (window as any).Capacitor?.Plugins?.LocalNotifications : null;
  
  if (plugin) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      plugin.addListener('localNotificationActionPerformed', (notification: any) => {
        callback(notification);
      });
    } catch {
      console.log('[Push] Notification tap listener unavailable');
    }
  }

  return () => {};
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