/**
 * Geofence - Web-compatible geolocation notifications
 * Uses browser Geolocation API in web, Capacitor in native apps
 */
import { calculateDistance } from '../../hooks/useGeolocation';
import { sendLocal } from './push';

// Check if running in Capacitor native environment
const isNative = typeof window !== 'undefined' && 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).Capacitor?.isNativePlatform?.();

// Lazy-loaded Capacitor Geolocation (only in native apps)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Geolocation: any = null;

async function loadGeolocation() {
  if (!Geolocation && isNative) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      Geolocation = require('@capacitor/geolocation');
    } catch {
      console.log('[Geofence] Geolocation not available');
    }
  }
  return Geolocation;
}

export interface GeofenceZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  parkingId?: string;
}

export interface GeofenceEvent {
  zoneId: string;
  type: 'enter' | 'exit';
  timestamp: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

type GeofenceCallback = (event: GeofenceEvent) => void;

// Active zones storage (in-memory for the session)
const activeZones: Map<string, GeofenceZone> = new Map();

// Event listeners
const enterListeners: Map<string, GeofenceCallback> = new Map();
const exitListeners: Map<string, GeofenceCallback> = new Map();

// Polling interval for checking location
let locationPollingInterval: ReturnType<typeof setInterval> | null = null;
let lastKnownPosition: { latitude: number; longitude: number } | null = null;

/**
 * Создать геозону
 * @param zone - Параметры зоны
 * @returns Созданная зона
 */
export async function createZone(zone: Omit<GeofenceZone, 'id'>): Promise<GeofenceZone> {
  const newZone: GeofenceZone = {
    ...zone,
    id: `zone_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
  };

  activeZones.set(newZone.id, newZone);
  console.log('[Geofence] Зона создана:', newZone.name, newZone.radius, 'm');

  // Start location monitoring if not running
  if (!locationPollingInterval) {
    startLocationMonitoring();
  }

  return newZone;
}

/**
 * Удалить геозону
 * @param zoneId - ID зоны для удаления
 */
export async function removeZone(zoneId: string): Promise<void> {
  activeZones.delete(zoneId);
  enterListeners.delete(zoneId);
  exitListeners.delete(zoneId);

  console.log('[Geofence] Зона удалена:', zoneId);

  // Stop monitoring if no zones left
  if (activeZones.size === 0) {
    stopLocationMonitoring();
  }
}

/**
 * Подписаться на событие входа в зону
 * @param zoneId - ID зоны
 * @param callback - Функция обратного вызова
 */
export function onEnter(zoneId: string, callback: GeofenceCallback): () => void {
  enterListeners.set(zoneId, callback);
  console.log('[Geofence] Подписка на вход:', zoneId);

  return () => {
    enterListeners.delete(zoneId);
  };
}

/**
 * Подписаться на событие выхода из зоны
 * @param zoneId - ID зоны
 * @param callback - Функция обратного вызова
 */
export function onExit(zoneId: string, callback: GeofenceCallback): () => void {
  exitListeners.set(zoneId, callback);
  console.log('[Geofence] Подписка на выход:', zoneId);

  return () => {
    exitListeners.delete(zoneId);
  };
}

/**
 * Получить текущую позицию
 * @returns Координаты или null
 */
export async function getCurrentPosition(): Promise<{ latitude: number; longitude: number } | null> {
  // In native app, use Capacitor Geolocation
  const geoModule = await loadGeolocation();
  
  if (geoModule) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const position = await (geoModule as any).getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (error) {
      console.log('[Geofence] Capacitor error, falling back to browser:', error);
    }
  }
  
  // Web fallback: use browser Geolocation API
  return new Promise((resolve) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log('[Geofence] Browser geolocation error:', error.message);
          // Fallback to Moscow center for development
          resolve({ latitude: 55.7558, longitude: 37.6173 });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      // Fallback if no geolocation available
      resolve({ latitude: 55.7558, longitude: 37.6173 });
    }
  });
}

/**
 * Проверить, находится ли точка в радиусе зоны
 * @param zone - Геозона
 * @param lat - Широта
 * @param lon - Долгота
 * @returns true если в зоне
 */
function isInZone(zone: GeofenceZone, lat: number, lon: number): boolean {
  const distanceKm = calculateDistance(lat, lon, zone.latitude, zone.longitude);
  const distanceMeters = distanceKm * 1000;
  return distanceMeters <= zone.radius;
}

/**
 * Запустить мониторинг геолокации
 */
function startLocationMonitoring(): void {
  console.log('[Geofence] Запуск мониторинга геолокации');
  
  // Initial position check
  getCurrentPosition().then(pos => {
    if (pos) {
      lastKnownPosition = pos;
    }
  });

  // Poll every 30 seconds
  locationPollingInterval = setInterval(async () => {
    const currentPosition = await getCurrentPosition();
    
    if (!currentPosition || !lastKnownPosition) {
      lastKnownPosition = currentPosition;
      return;
    }

    // Check each zone
    for (const [zoneId, zone] of activeZones) {
      const wasInZone = isInZone(zone, lastKnownPosition.latitude, lastKnownPosition.longitude);
      const isNowInZone = isInZone(zone, currentPosition.latitude, currentPosition.longitude);

      // Enter event
      if (!wasInZone && isNowInZone) {
        const event: GeofenceEvent = {
          zoneId: zone.id,
          type: 'enter',
          timestamp: new Date().toISOString(),
          coordinates: currentPosition,
        };

        console.log('[Geofence] Вход в зону:', zone.name);

        // Trigger local notification
        if (zone.parkingId) {
          sendLocal({
            title: 'Вы прибыли',
            body: `Вы приближаетесь к "${zone.name}"`,
            data: { zoneId, parkingId: zone.parkingId, type: 'geofence_enter' },
          });
        }

        // Trigger callback
        const callback = enterListeners.get(zoneId);
        if (callback) {
          callback(event);
        }
      }

      // Exit event
      if (wasInZone && !isNowInZone) {
        const event: GeofenceEvent = {
          zoneId: zone.id,
          type: 'exit',
          timestamp: new Date().toISOString(),
          coordinates: currentPosition,
        };

        console.log('[Geofence] Выход из зоны:', zone.name);

        // Trigger callback
        const callback = exitListeners.get(zoneId);
        if (callback) {
          callback(event);
        }
      }
    }

    lastKnownPosition = currentPosition;
  }, 30000);
}

/**
 * Остановить мониторинг геолокации
 */
function stopLocationMonitoring(): void {
  if (locationPollingInterval) {
    clearInterval(locationPollingInterval);
    locationPollingInterval = null;
    console.log('[Geofence] Мониторинг остановлен');
  }
}

/**
 * Получить список активных зон
 * @returns Массив зон
 */
export function getActiveZones(): GeofenceZone[] {
  return Array.from(activeZones.values());
}

/**
 * Проверить приближение к парковке
 * @param parkingLat - Широта парковки
 * @param parkingLon - Долгота парковки
 * @param thresholdMeters - Порог в метрах
 * @returns true если пользователь рядом
 */
export async function isNearby(
  parkingLat: number,
  parkingLon: number,
  thresholdMeters: number = 500
): Promise<boolean> {
  const position = await getCurrentPosition();
  
  if (!position) {
    return false;
  }

  const distanceKm = calculateDistance(
    position.latitude,
    position.longitude,
    parkingLat,
    parkingLon
  );
  
  return distanceKm * 1000 <= thresholdMeters;
}

/**
 * Уведомление о приближении к парковке
 */
export async function notifyApproaching(
  parkingId: string,
  parkingTitle: string,
  distanceMeters: number
): Promise<number> {
  return sendLocal({
    title: 'Вы приближаетесь',
    body: `До "${parkingTitle}" ${Math.round(distanceMeters)} м`,
    data: { parkingId, type: 'approaching' },
  });
}