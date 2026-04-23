import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Parking } from '../../lib/supabase';
import styles from './OSMMap.module.css';

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
      console.log('[OSMMap] Geolocation not available');
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

// OSM tile layer with proper attribution
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

interface OSMMapProps {
  parkings: Parking[];
  selectedParking?: Parking | null;
  onSelectParking?: (parking: Parking) => void;
  className?: string;
  height?: string;
  showUserLocation?: boolean;
  centerOnUser?: boolean;
  zoom?: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

// Component to handle map center updates
function MapCenterController({
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
function LocationTracker({
  onLocationUpdate,
}: {
  onLocationUpdate: (location: UserLocation) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const watchLocation = async () => {
      try {
        // Try Capacitor first in native apps
        const geoModule = await loadGeolocation();
        
        if (geoModule) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const permission = await (geoModule as any).requestPermissions();
          if (permission.location !== 'granted') {
            console.log('Location permission not granted');
          } else {
            // Get current position first
            const position = await (geoModule as any).getCurrentPosition({
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });

            onLocationUpdate({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            
            // Set up watch (the watchId is stored internally by Capacitor)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            await (geoModule as any).watchPosition(
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000,
              },
              (position: { coords: { latitude: number; longitude: number } }, error: unknown) => {
                if (error) {
                  console.error('Watch position error:', error);
                  return;
                }
                if (position) {
                  onLocationUpdate({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                  });
                }
              }
            );
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
              console.error('Error getting location:', error.message);
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    watchLocation();

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
          console.error('Watch position error:', error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [map, onLocationUpdate]);

  return null;
}

const defaultCenter: [number, number] = [55.7558, 37.6173]; // Moscow
const defaultZoom = 12;

/**
 * OSMMap - OpenStreetMap based map component with parking markers
 * Features:
 * - OpenStreetMap tiles (no API key needed)
 * - User geolocation via Capacitor
 * - Custom brand icons
 */
export function OSMMap({
  parkings,
  selectedParking,
  onSelectParking,
  className,
  height = '400px',
  showUserLocation = true,
  centerOnUser = true,
  zoom = defaultZoom,
}: OSMMapProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Determine map center
  let center: [number, number] = defaultCenter;
  if (centerOnUser && userLocation) {
    center = [userLocation.latitude, userLocation.longitude];
  } else if (selectedParking?.latitude && selectedParking?.longitude) {
    center = [selectedParking.latitude, selectedParking.longitude];
  } else if (parkings.length > 0) {
    const pWithCoords = parkings.find((p) => p.latitude && p.longitude);
    if (pWithCoords) {
      center = [pWithCoords.latitude!, pWithCoords.longitude!];
    }
  }

  // Memoize parking markers
  const parkingMarkers = useMemo(() => {
    return parkings
      .filter((p) => p.latitude && p.longitude)
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
                <div className={styles.popupPrice}>
                  {parking.price.toLocaleString('ru-RU')} ₽/мес
                </div>
                {parking.rating && (
                  <div className={styles.popupRating}>
                    <span className={styles.starIcon}>★</span>
                    <span>{parking.rating}</span>
                    <span className={styles.reviewCount}>
                      ({parking.reviewCount})
                    </span>
                  </div>
                )}
                <div className={styles.popupSpots}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2-4H6L4 10l-2.5 1.1C.7 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
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

  // Request user location
  const requestUserLocation = async () => {
    setIsLocating(true);
    try {
      // Try Capacitor first in native apps
      const geoModule = await loadGeolocation();
      
      if (geoModule) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const permission = await (geoModule as any).requestPermissions();
        if (permission.location === 'granted') {
          const position = await (geoModule as any).getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
          });
          setUserLocation({
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
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.error('Error getting location:', error.message);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div
      className={`${styles.mapWrapper} ${className || ''}`}
      style={{ height }}
    >
      {/* Location button */}
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
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v2m0 16v2M2 12h2m16 0h2" />
              <path d="M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
            </svg>
          )}
        </button>
      )}

      <MapContainer
        center={center}
        zoom={zoom}
        className={styles.map}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />

        {/* Map center controller */}
        <MapCenterController center={center} zoom={zoom} />

        {/* User location tracking */}
        {showUserLocation && centerOnUser && (
          <LocationTracker onLocationUpdate={handleLocationUpdate} />
        )}

        {/* User location marker */}
        {userLocation && (
          <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
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

export default OSMMap;