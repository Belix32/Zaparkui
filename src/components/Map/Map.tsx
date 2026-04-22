import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Parking } from '../../lib/supabase';
import styles from './Map.module.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet default icon issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Fix for Vite/Rollup asset imports
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

interface ParkingMapProps {
  parkings: Parking[];
  userLatitude?: number;
  userLongitude?: number;
  selectedParking?: Parking | null;
  onSelectParking?: (parking: Parking) => void;
  className?: string;
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
      map.setView(center, zoom);
    }
  }, [map, center, zoom]);
  
  return null;
}

const defaultCenter: [number, number] = [55.7558, 37.6173]; // Moscow
const defaultZoom = 11;

/**
 * Map component with Leaflet for searching and displaying parkings
 * P1 feature - Поиск по карте
 */
export function ParkingMap({
  parkings,
  userLatitude,
  userLongitude,
  selectedParking,
  onSelectParking,
  className,
}: ParkingMapProps) {
  
  // Determine center
  let center: [number, number] = defaultCenter;
  if (userLatitude && userLongitude) {
    center = [userLatitude, userLongitude];
  } else if (selectedParking?.latitude && selectedParking?.longitude) {
    center = [selectedParking.latitude, selectedParking.longitude];
  } else if (parkings.length > 0) {
    const pWithCoords = parkings.find(p => p.latitude && p.longitude);
    if (pWithCoords) {
      center = [pWithCoords.latitude!, pWithCoords.longitude!];
    }
  }
  
  return (
    <div className={`${styles.mapWrapper} ${className || ''}`}>
      <MapContainer
        center={center}
        zoom={defaultZoom}
        className={styles.map}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://yandex.ru/maps">ЯндексКарты</a>'
          url="https://core-renderer-tiles.maps.yandex.ru/tiles?l=map&x={x}&y={y}&z={z}&scale=1&lang=ru_RU"
        />
        
        {/* User location marker */}
        {userLatitude && userLongitude && (
          <Marker
            position={[userLatitude, userLongitude]}
            icon={L.divIcon({
              className: styles.userMarker,
              html: '<div class="user-marker-icon"></div>',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })}
          >
            <Popup>Ваше местоположение</Popup>
          </Marker>
        )}
        
        {/* Parking markers */}
        {parkings.map((parking) => {
          if (!parking.latitude || !parking.longitude) {
            return null;
          }
          
          const isSelected = selectedParking?.id === parking.id;
          
          return (
            <Marker
              key={parking.id}
              position={[parking.latitude, parking.longitude]}
              eventHandlers={{
                click: () => {
                  onSelectParking?.(parking);
                },
              }}
              icon={L.divIcon({
                className: `${styles.parkingMarker} ${isSelected ? styles.parkingMarkerSelected : ''}`,
                html: `<div class="parking-marker-icon">${parking.spots}</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 32],
              })}
            >
              <Popup>
                <div className={styles.popup}>
                  <strong>{parking.title}</strong>
                  <p>{parking.address}</p>
                  <p>
                    {parking.price.toLocaleString('ru-RU')} ₽/мес
                  </p>
                  {parking.rating && (
                    <p>★ {parking.rating} ({parking.reviewCount})</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        <MapController center={center} zoom={defaultZoom} />
      </MapContainer>
    </div>
  );
}

/**
 * Simple map for single parking location display
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
        dragging={false}
        zoomControl={false}
      >
        <TileLayer
          url="https://core-renderer-tiles.maps.yandex.ru/tiles?l=map&x={x}&y={y}&z={z}&scale=1&lang=ru_RU"
        />
        <Marker position={[latitude, longitude]} />
      </MapContainer>
    </div>
  );
}