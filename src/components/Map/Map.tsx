import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Parking } from '../../lib/supabase';
import styles from './Map.module.css';

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
      console.log('[Map] Geolocation not available');
    }
  }
  return Geolocation;
}

// Fix Leaflet default icon issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Fix for Vite/Rollup asset imports - use CDN
const fixMarkerUrls = () => {
  const markerBase = 'https://unpkg.com/leaflet@1.9.4/dist/images/';
  if (!(L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl) {
    L.Icon.Default.mergeOptions({
      iconUrl: markerBase + 'marker-icon.png',
      iconRetinaUrl: markerBase + 'marker-icon-2x.png',
      shadowUrl: markerBase + 'marker-shadow.png',
    });
  }
};
fixMarkerUrls();

// Custom brand icon - car/parking icon
const createParkingIcon = (spots: number, isSelected: boolean = false) => {
  const bgColor = isSelected ? '#ef4444' : '#22c55e';
  return L.divIcon({
    className: `${styles.parkingMarker} ${isSelected ? styles.parkingMarkerSelected : ''}`,
    html: `
      <div class="${styles.markerContainer}">
        <div class="${styles.markerIcon}" style="background-color: ${bgColor}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2-4H6L4 10l-2.5 1.1C.7 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
        <div class="${styles.markerLabel}">${spots}</div>
      </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
  });
};

// User location icon
const userIcon = L.divIcon({
  className: styles.userMarker,
  html: `
    <div class="${styles.userMarkerIcon}">
      <div class="${styles.userMarkerPulse}"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// OSM tile layer - primary
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

interface ParkingMapProps {
  parkings: Parking[];
  userLatitude?: number;
  userLongitude?: number;
  selectedParking?: Parking | null;
  onSelectParking?: (parking: Parking) => void;
  className?: string;
  height?: string;
  showUserLocation?: boolean;
  centerOnUser?: boolean;
  fullscreen?: boolean;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

// Component to recenter map
function MapController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (center[0] && center[1]) {
      map.setView(center, zoom, { animate: true });
    }
  }, [map, center, zoom]);

  return null;
}

// Component to handle user location tracking
// Uses Capacitor in native apps, browser Geolocation API in web
function LocationTracker({
  onLocationUpdate,
  enabled,
}: {
  onLocationUpdate: (location: UserLocation) => void;
  enabled: boolean;
}) {
  useEffect(() => {
    if (!enabled) return;

    const getLocation = async () => {
      try {
        // Try Capacitor first in native apps
        const geoModule = await loadGeolocation();
        
        if (geoModule) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const permission = await (geoModule as any).requestPermissions();
          if (permission.location !== 'granted') {
            console.log('Capacitor location permission denied');
          } else {
            const position = await (geoModule as any).getCurrentPosition({
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });

            onLocationUpdate({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            return;
          }
        }
        
        // Fallback to browser Geolocation API
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              onLocationUpdate({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            (error) => {
              console.error('Browser geolocation error:', error.message);
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    getLocation();

    // Watch position using browser API
    let watchId: number | null = null;
    
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          onLocationUpdate({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Watch error:', error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [enabled, onLocationUpdate]);

  return null;
}

const defaultCenter: [number, number] = [55.7558, 37.6173]; // Moscow
const defaultZoom = 12;

/**
 * Map component with Leaflet for searching and displaying parkings
 * P1 feature - Поиск по карте
 * Mobile-optimized version with OSM tiles
 */
export function ParkingMap({
  parkings,
  userLatitude,
  userLongitude,
  selectedParking,
  onSelectParking,
  className,
  height = '400px',
  showUserLocation = true,
  centerOnUser = true,
  fullscreen = false,
}: ParkingMapProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Determine center
  let center: [number, number] = defaultCenter;
  const hasUserCoords = userLatitude && userLongitude;
  
  if (centerOnUser && userLocation) {
    center = [userLocation.latitude, userLocation.longitude];
  } else if (hasUserCoords) {
    center = [userLatitude!, userLongitude!];
  } else if (selectedParking?.latitude && selectedParking?.longitude) {
    center = [selectedParking.latitude, selectedParking.longitude];
  } else if (parkings.length > 0) {
    const pWithCoords = parkings.find(p => p.latitude && p.longitude);
    if (pWithCoords) {
      center = [pWithCoords.latitude!, pWithCoords.longitude!];
    }
  }

  // Memoize parking markers
  const parkingMarkers = useMemo(() => {
    return parkings
      .filter(p => p.latitude && p.longitude)
      .map((parking) => {
        const isSelected = selectedParking?.id === parking.id;
        
        return (
          <Marker
            key={parking.id}
            position={[parking.latitude!, parking.longitude!]}
            icon={createParkingIcon(parking.spots, isSelected)}
            eventHandlers={{
              click: () => {
                onSelectParking?.(parking);
              },
            }}
          >
            <Popup>
              <div className={styles.popup}>
                <strong className={styles.popupTitle}>{parking.title}</strong>
                <p className={styles.popupAddress}>{parking.address}</p>
                <p className={styles.popupPrice}>
                  {parking.price.toLocaleString('ru-RU')} ₽/мес
                </p>
                {parking.rating && (
                  <p className={styles.popupRating}>
                    ★ {parking.rating} ({parking.reviewCount})
                  </p>
                )}
                <div className={styles.popupSpots}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2-4H6L4 10l-2.5 1.1C.7 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2"/>
                    <circle cx="7" cy="17" r="2"/>
                    <circle cx="17" cy="17" r="2"/>
                  </svg>
                  <span>{parking.spots} мест</span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      });
  }, [parkings, selectedParking, onSelectParking]);

  // Handle location update
  const handleLocationUpdate = (location: UserLocation) => {
    setUserLocation(location);
    setIsLocating(false);
  };

  // Request user location manually
  const requestUserLocation = async () => {
    setIsLocating(true);
    try {
      const permission = await Geolocation.requestPermissions();
      if (permission.location === 'granted') {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div 
      className={`${styles.mapWrapper} ${fullscreen ? styles.fullscreen : ''} ${className || ''}`}
      style={{ height }}
    >
      {/* Mobile location button */}
      {showUserLocation && (
        <button
          className={`${styles.locationButton} ${userLocation ? styles.locationButtonActive : ''} ${isLocating ? styles.locating : ''}`}
          onClick={requestUserLocation}
          title="Показать моё местоположение"
          disabled={isLocating}
        >
          {isLocating ? (
            <span className={styles.spinner}></span>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v2m0 16v2M2 12h2m16 0h2" />
            </svg>
          )}
        </button>
      )}

      <MapContainer
        center={center}
        zoom={defaultZoom}
        className={styles.map}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        {/* OSM Tiles - free, no API key */}
        <TileLayer
          attribution={OSM_ATTRIBUTION}
          url={OSM_TILE_URL}
        />
        
        {/* Zoom control positioned for mobile */}
        <ZoomControl position="bottomright" />

        {/* Map controller */}
        <MapController center={center} zoom={defaultZoom} />

        {/* User location tracking */}
        {showUserLocation && centerOnUser && (
          <LocationTracker onLocationUpdate={handleLocationUpdate} enabled={!!centerOnUser} />
        )}

        {/* User location marker */}
        {(userLocation || (userLatitude && userLongitude)) && (
          <Marker
            position={[
              userLocation?.latitude ?? userLatitude ?? 0,
              userLocation?.longitude ?? userLongitude ?? 0
            ]}
            icon={userIcon}
          >
            <Popup>
              <div className={styles.userPopup}>Ваше местоположение</div>
            </Popup>
          </Marker>
        )}

        {/* Parking markers */}
        {parkingMarkers}
      </MapContainer>
    </div>
  );
}

/**
 * Simple map for single parking location display
 * Optimized for mobile with compact view
 */
export function ParkingLocationMap({
  latitude,
  longitude,
}: {
  latitude?: number;
  longitude?: number;
}) {
  if (!latitude || !longitude) {
    return (
      <div className={styles.noLocation}>
        <p>Местоположение не указано</p>
      </div>
    );
  }
  
  return (
    <div className={styles.mapWrapper}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        className={styles.miniMap}
        scrollWheelZoom={false}
        dragging={true}
        zoomControl={false}
      >
        <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
        <Marker position={[latitude, longitude]} icon={createParkingIcon(1, true)} />
      </MapContainer>
    </div>
  );
}