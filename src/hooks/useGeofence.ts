/**
 * useGeofence - Hook для управления геолокационными уведомлениями
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  GeofenceZone,
  GeofenceEvent,
  createZone,
  removeZone,
  onEnter,
  onExit,
  getCurrentPosition,
  isNearby,
  notifyApproaching,
  getActiveZones,
} from '../lib/notifications/geofence';
import { calculateDistance } from './useGeolocation';

export interface UseGeofenceOptions {
  /** Радиус зоны в метрах (по умолчанию 500м) */
  radius?: number;
  /** Включить автоматические уведомления */
  autoNotify?: boolean;
  /** Интервал проверки приближения в секундах */
  proximityCheckInterval?: number;
}

export interface UseGeofenceReturn {
  /** Активные зоны */
  zones: GeofenceZone[];
  /** Загрузка */
  loading: boolean;
  /** Ошибка */
  error: string | null;
  /** Текущая позиция пользователя */
  userPosition: { latitude: number; longitude: number } | null;
  /** Рядом с парковкой */
  isNearParking: boolean;
  /** Расстояние до парковки в метрах */
  distanceToParking: number | null;
  /** Добавить зону для парковки */
  addParkingZone: (parkingId: string, parkingTitle: string, lat: number, lon: number) => Promise<void>;
  /** Удалить зону парковки */
  removeParkingZone: (parkingId: string) => Promise<void>;
  /** Подписаться на вход */
  subscribeToEnter: (parkingId: string, callback: (event: GeofenceEvent) => void) => () => void;
  /** Подписаться на выход */
  subscribeToExit: (parkingId: string, callback: (event: GeofenceEvent) => void) => () => void;
  /** Проверить приближение к парковке */
  checkProximity: (lat: number, lon: number, threshold?: number) => Promise<boolean>;
  /** Обновить позицию */
  refreshPosition: () => Promise<void>;
}

/**
 * Hook для управления геолокационными уведомлениями
 * @param options - Настройки хука
 */
export function useGeofence(options: UseGeofenceOptions = {}): UseGeofenceReturn {
  const {
    radius = 500,
    autoNotify = true,
    proximityCheckInterval = 30,
  } = options;

  const [zones, setZones] = useState<GeofenceZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isNearParking, setIsNearParking] = useState(false);
  const [distanceToParking, setDistanceToParking] = useState<number | null>(null);

  // Track parking zones by parkingId
  const zoneIdsRef = useRef<Map<string, string>>(new Map());
  const currentParkingRef = useRef<{ lat: number; lon: number; title: string; id: string } | null>(null);

  // Check proximity interval
  const proximityIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Обновить позицию пользователя
   */
  const refreshPosition = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const position = await getCurrentPosition();
      setUserPosition(position);

      // Check proximity if we have a parking set
      if (currentParkingRef.current && position) {
        const distanceKm = calculateDistance(
          position.latitude,
          position.longitude,
          currentParkingRef.current.lat,
          currentParkingRef.current.lon
        );
        const distanceM = distanceKm * 1000;
        setDistanceToParking(distanceM);

        const near = distanceM <= radius;
        setIsNearParking(near);

        // Send notification if approaching
        if (autoNotify && near && distanceM < radius) {
          await notifyApproaching(
            currentParkingRef.current.id,
            currentParkingRef.current.title,
            distanceM
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка геолокации');
    } finally {
      setLoading(false);
    }
  }, [radius, autoNotify]);

  /**
   * Добавить зону для парковки
   */
  const addParkingZone = useCallback(async (
    parkingId: string,
    parkingTitle: string,
    lat: number,
    lon: number
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Remove existing zone for this parking if any
      const existingZoneId = zoneIdsRef.current.get(parkingId);
      if (existingZoneId) {
        await removeZone(existingZoneId);
      }

      // Create new zone
      const zone = await createZone({
        name: parkingTitle,
        latitude: lat,
        longitude: lon,
        radius,
        parkingId,
      });

      zoneIdsRef.current.set(parkingId, zone.id);
      setZones(getActiveZones());

      // Store current parking for proximity checks
      currentParkingRef.current = { id: parkingId, title: parkingTitle, lat, lon };

      // Start proximity monitoring
      if (!proximityIntervalRef.current) {
        refreshPosition();
        proximityIntervalRef.current = setInterval(refreshPosition, proximityCheckInterval * 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания зоны');
    } finally {
      setLoading(false);
    }
  }, [radius, refreshPosition, proximityCheckInterval]);

  /**
   * Удалить зону парковки
   */
  const removeParkingZone = useCallback(async (parkingId: string) => {
    try {
      setLoading(true);
      const zoneId = zoneIdsRef.current.get(parkingId);
      
      if (zoneId) {
        await removeZone(zoneId);
        zoneIdsRef.current.delete(parkingId);
        setZones(getActiveZones());

        // Clear current parking if it was this one
        if (currentParkingRef.current?.id === parkingId) {
          currentParkingRef.current = null;
          setIsNearParking(false);
          setDistanceToParking(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления зоны');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Подписаться на вход в зону
   */
  const subscribeToEnter = useCallback((parkingId: string, callback: (event: GeofenceEvent) => void) => {
    const zoneId = zoneIdsRef.current.get(parkingId);
    if (!zoneId) {
      console.warn('[useGeofence] Зона не найдена для парковки:', parkingId);
      return () => {};
    }
    return onEnter(zoneId, callback);
  }, []);

  /**
   * Подписаться на выход из зоны
   */
  const subscribeToExit = useCallback((parkingId: string, callback: (event: GeofenceEvent) => void) => {
    const zoneId = zoneIdsRef.current.get(parkingId);
    if (!zoneId) {
      console.warn('[useGeofence] Зона не найдена для парковки:', parkingId);
      return () => {};
    }
    return onExit(zoneId, callback);
  }, []);

  /**
   * Проверить приближение к координатам
   */
  const checkProximity = useCallback(async (
    lat: number,
    lon: number,
    threshold: number = radius
  ): Promise<boolean> => {
    return isNearby(lat, lon, threshold);
  }, [radius]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (proximityIntervalRef.current) {
        clearInterval(proximityIntervalRef.current);
      }
    };
  }, []);

  return {
    zones,
    loading,
    error,
    userPosition,
    isNearParking,
    distanceToParking,
    addParkingZone,
    removeParkingZone,
    subscribeToEnter,
    subscribeToExit,
    checkProximity,
    refreshPosition,
  };
}