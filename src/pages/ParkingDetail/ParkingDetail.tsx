/**
 * ParkingDetail - Детали парковки с геолокационными уведомлениями
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Button, MobileButton } from '../../components';
import { Parking, getParkingById } from '../../lib/supabase';
import { useGeofence } from '../../hooks';
import { calculateDistance } from '../../hooks/useGeofence';
import styles from './ParkingDetail.module.css';

export function ParkingDetail() {
  const searchParams = useSearchParams();
  const navigate = useNavigate();
  const parkingId = searchParams[0].get('parkingId');

  const [parking, setParking] = useState<Parking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enableGeofence, setEnableGeofence] = useState(false);

  // Geofence hook
  const {
    loading: geofenceLoading,
    isNearParking,
    distanceToParking,
    addParkingZone,
    removeParkingZone,
    checkProximity,
    refreshPosition,
    userPosition,
  } = useGeofence({
    radius: 500,
    autoNotify: true,
    proximityCheckInterval: 15,
  });

  // Load parking data
  useEffect(() => {
    async function loadParking() {
      if (!parkingId) {
        setError('ID парковки не указан');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getParkingById(parkingId);
        
        if (!data) {
          setError('Парковка не найдена');
          return;
        }

        setParking(data);
      } catch (err) {
        console.error('Error loading parking:', err);
        setError('Не удалось загрузить данные парковки');
      } finally {
        setLoading(false);
      }
    }

    loadParking();
  }, [parkingId]);

  // Enable geofence monitoring when parking is loaded
  useEffect(() => {
    if (parking && enableGeofence && parking.latitude && parking.longitude) {
      addParkingZone(parking.id, parking.title, parking.latitude, parking.longitude);
    }

    return () => {
      if (parking) {
        removeParkingZone(parking.id);
      }
    };
  }, [parking, enableGeofence]);

  // Handle toggle geofence
  const handleToggleGeofence = useCallback(async () => {
    if (!parking) return;

    if (enableGeofence) {
      await removeParkingZone(parking.id);
      setEnableGeofence(false);
    } else {
      setEnableGeofence(true);
    }
  }, [parking, enableGeofence, addParkingZone, removeParkingZone]);

  // Handle booking
  const handleBooking = useCallback(() => {
    if (!parking) return;
    navigate(`/booking?parkingId=${parking.id}`);
  }, [parking, navigate]);

  // Calculate distance if we have user position
  const distance = (parking && userPosition)
    ? calculateDistance(
        userPosition.latitude,
        userPosition.longitude,
        parking.latitude,
        parking.longitude
      ) * 1000
    : null;

  // Show loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !parking) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error || 'Парковка не найдена'}</p>
          <Link to="/catalog">
            <Button variant="primary">К каталогу</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          ← Назад
        </button>
        <h1 className={styles.title}>{parking.title}</h1>
      </div>

      {/* Image */}
      {parking.image && (
        <div className={styles.imageWrapper}>
          <img src={parking.image} alt={parking.title} className={styles.image} />
        </div>
      )}

      {/* Info Card */}
      <div className={styles.card}>
        <div className={styles.address}>
          <span className={styles.label}>Адрес</span>
          <p>{parking.address}</p>
        </div>

        {parking.district && (
          <div className={styles.infoRow}>
            <span className={styles.label}>Район</span>
            <span>{parking.district}</span>
          </div>
        )}

        {parking.metro && (
          <div className={styles.infoRow}>
            <span className={styles.label}>Метро</span>
            <span>{parking.metro}</span>
          </div>
        )}

        <div className={styles.infoRow}>
          <span className={styles.label}>Тип</span>
          <span>{parking.parkingType === 'ground' ? 'Открытая' : parking.parkingType === 'underground' ? 'Подземная' : parking.parkingType === 'covered' ? 'Крытая' : 'Крышная'}</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Цена</span>
          <span className={styles.price}>{parking.price} ₽/мес</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Мест</span>
          <span>{parking.spots}</span>
        </div>

        {parking.rating && (
          <div className={styles.infoRow}>
            <span className={styles.label}>Рейтинг</span>
            <span>★ {parking.rating.toFixed(1)} ({parking.reviewCount})</span>
          </div>
        )}
      </div>

      {/* Distance & Location */}
      {distance !== null && (
        <div className={styles.locationCard}>
          <div className={styles.distance}>
            <span className={styles.label}>Расстояние</span>
            <span>{Math.round(distance)} м</span>
          </div>

          {/* Geofence Notification */}
          <div className={styles.geofenceSection}>
            <button
              className={`${styles.geofenceToggle} ${enableGeofence ? styles.active : ''}`}
              onClick={handleToggleGeofence}
              disabled={geofenceLoading}
            >
              {geofenceLoading ? 'Подключение...' : enableGeofence ? 'Уведомления вкл.' : 'Уведомления выкл.'}
            </button>

            {/* Nearby Notification */}
            {isNearParking && enableGeofence && (
              <div className={styles.nearbyAlert}>
                <span className={styles.nearbyIcon}>📍</span>
                <div className={styles.nearbyText}>
                  <strong>Вы рядом!</strong>
                  <p>До парковки {Math.round(distanceToParking || 0)} м</p>
                </div>
              </div>
            )}

            {/* Manual proximity check */}
            {distance < 1000 && !isNearParking && enableGeofence && (
              <p className={styles.proximityStatus}>
                Вы в {Math.round(distance)} м от парковки
              </p>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {parking.description && (
        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>Описание</h3>
          <p className={styles.description}>{parking.description}</p>
        </div>
      )}

      {/* Amenities */}
      {parking.amenities && parking.amenities.length > 0 && (
        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>Удобства</h3>
          <div className={styles.amenities}>
            {parking.amenities.map((amenity, index) => (
              <span key={index} className={styles.amenity}>
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <MobileButton
          variant="primary"
          onClick={handleBooking}
          fullWidth
        >
          Забронировать
        </MobileButton>
      </div>
    </div>
  );
}