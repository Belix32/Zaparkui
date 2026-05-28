import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './TravelMap.module.css';

// Fix Leaflet default icon issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ============================================================================
// Types
// ============================================================================

interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  has_storage: boolean;
  has_rental: boolean;
  destination: string;
  partner: string;
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_LOCATIONS: OfficeLocation[] = [
  {
    id: 'loc-1',
    name: 'АвтоМоре Сочи — Центральный офис',
    address: 'Сочи, ул. Навагинская, 7',
    latitude: 43.5855,
    longitude: 39.7231,
    phone: '+7 (862) 200-10-10',
    has_storage: true,
    has_rental: true,
    destination: 'Сочи',
    partner: 'АвтоМоре Сочи',
  },
  {
    id: 'loc-2',
    name: 'АвтоМоре Сочи — Адлер',
    address: 'Сочи, Адлер, ул. Ленина, 219',
    latitude: 43.43,
    longitude: 39.909,
    phone: '+7 (862) 200-10-11',
    has_storage: true,
    has_rental: true,
    destination: 'Сочи',
    partner: 'АвтоМоре Сочи',
  },
  {
    id: 'loc-3',
    name: 'АвтоМоре Сочи — Аэропорт',
    address: 'Сочи, Аэропорт, зона прилёта',
    latitude: 43.4489,
    longitude: 39.9453,
    phone: '+7 (862) 200-10-12',
    has_storage: false,
    has_rental: true,
    destination: 'Сочи',
    partner: 'АвтоМоре Сочи',
  },
  {
    id: 'loc-4',
    name: 'Южный Прокат — Анапа',
    address: 'Анапа, ул. Крымская, 150',
    latitude: 44.89,
    longitude: 37.318,
    phone: '+7 (861) 333-55-55',
    has_storage: true,
    has_rental: true,
    destination: 'Анапа',
    partner: 'Южный Прокат',
  },
  {
    id: 'loc-5',
    name: 'Южный Прокат — Анапа Ж/Д',
    address: 'Анапа, Вокзальная площадь, 1',
    latitude: 44.898,
    longitude: 37.31,
    phone: '+7 (861) 333-55-56',
    has_storage: true,
    has_rental: true,
    destination: 'Анапа',
    partner: 'Южный Прокат',
  },
  {
    id: 'loc-6',
    name: 'Южный Прокат — Геленджик',
    address: 'Геленджик, ул. Курзальная, 10',
    latitude: 44.5615,
    longitude: 38.073,
    phone: '+7 (861) 333-55-57',
    has_storage: true,
    has_rental: true,
    destination: 'Геленджик',
    partner: 'Южный Прокат',
  },
  {
    id: 'loc-7',
    name: 'АвтоМоре Сочи — Лазаревское',
    address: 'Сочи, Лазаревское, ул. Победы, 120',
    latitude: 43.909,
    longitude: 39.333,
    phone: '+7 (862) 200-10-13',
    has_storage: true,
    has_rental: true,
    destination: 'Сочи',
    partner: 'АвтоМоре Сочи',
  },
  {
    id: 'loc-8',
    name: 'АвтоМоре Сочи — Красная Поляна',
    address: 'Сочи, Красная Поляна, ул. Защитников Кавказа, 75',
    latitude: 43.6789,
    longitude: 40.205,
    phone: '+7 (862) 200-10-14',
    has_storage: false,
    has_rental: true,
    destination: 'Сочи',
    partner: 'АвтоМоре Сочи',
  },
];

// ============================================================================
// Constants
// ============================================================================

const DESTINATION_COLORS: Record<string, string> = {
  Сочи: '#2563eb',
  Анапа: '#059669',
  Геленджик: '#f59e0b',
};

const DEFAULT_COLOR = '#6b7280';

const DESTINATION_FILTERS = [
  { value: '', label: 'Все направления' },
  { value: 'Сочи', label: 'Сочи' },
  { value: 'Анапа', label: 'Анапа' },
  { value: 'Геленджик', label: 'Геленджик' },
];

const MAP_CENTER: [number, number] = [44.5, 39.0];
const MAP_ZOOM = 8;
const TILE_URL =
  'https://core-renderer-tiles.maps.yandex.ru/tiles?l=map&x={x}&y={y}&z={z}&scale=1&lang=ru_RU';

// ============================================================================
// Helper: create marker icon
// ============================================================================

function createOfficeIcon(color: string, isSelected: boolean): L.DivIcon {
  const size = isSelected ? 36 : 28;
  return L.divIcon({
    className: '',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: ${isSelected ? '0 0 0 3px rgba(37,99,235,0.3), 0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.3)'};
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      cursor: pointer;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ============================================================================
// MapFlyTo — programmatically fly to a location
// ============================================================================

function MapFlyTo({
  location,
  onFlyComplete,
}: {
  location: OfficeLocation | null;
  onFlyComplete: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!location) return;
    map.flyTo([location.latitude, location.longitude], 14, { duration: 1 });
    const timer = setTimeout(onFlyComplete, 1200);
    return () => clearTimeout(timer);
  }, [map, location, onFlyComplete]);

  return null;
}

// ============================================================================
// OfficeMarker — single marker on the map
// ============================================================================

function OfficeMarker({
  location,
  isSelected,
  onSelect,
  popupOpen,
  onPopupClose,
}: {
  location: OfficeLocation;
  isSelected: boolean;
  onSelect: (id: string) => void;
  popupOpen: boolean;
  onPopupClose: () => void;
}) {
  const markerRef = useRef<L.Marker>(null);
  const color = DESTINATION_COLORS[location.destination] || DEFAULT_COLOR;

  useEffect(() => {
    if (popupOpen && markerRef.current) {
      markerRef.current.openPopup();
    } else if (!popupOpen && markerRef.current) {
      markerRef.current.closePopup();
    }
  }, [popupOpen]);

  return (
    <Marker
      ref={markerRef}
      position={[location.latitude, location.longitude]}
      icon={createOfficeIcon(color, isSelected)}
      eventHandlers={{
        click: () => {
          onSelect(location.id);
        },
        popupclose: () => {
          onPopupClose();
        },
      }}
    >
      <Popup>
        <div className={styles.popup}>
          <strong className={styles.popupName}>{location.name}</strong>
          <p className={styles.popupAddress}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {location.address}
          </p>
          <p className={styles.popupPhone}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {location.phone}
          </p>
          <p className={styles.popupServices}>
            {location.has_storage && <span title="Хранение">🏠 Хранение</span>}
            {location.has_rental && <span title="Аренда">🚗 Аренда</span>}
          </p>
          <button
            type="button"
            className={styles.popupDetailBtn}
            onClick={() => onSelect(location.id)}
          >
            Подробнее
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

// ============================================================================
// TravelMap — Main Component
// ============================================================================

export function TravelMap() {
  const navigate = useNavigate();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );
  const [destinationFilter, setDestinationFilter] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [popupOpenId, setPopupOpenId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Compute filtered locations
  const filteredLocations = destinationFilter
    ? MOCK_LOCATIONS.filter((loc) => loc.destination === destinationFilter)
    : MOCK_LOCATIONS;

  const selectedLocation =
    MOCK_LOCATIONS.find((loc) => loc.id === selectedLocationId) ?? null;

  // Fly-to target (when user clicks a sidebar item)
  const [flyTarget, setFlyTarget] = useState<OfficeLocation | null>(null);

  const handleSelectLocation = useCallback((id: string) => {
    setSelectedLocationId(id);
    setPopupOpenId(id);
    const loc = MOCK_LOCATIONS.find((l) => l.id === id);
    if (loc) {
      setFlyTarget(loc);
    }
    // Scroll sidebar item into view
    setTimeout(() => {
      if (listRef.current) {
        const el = listRef.current.querySelector(`[data-location-id="${id}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  }, []);

  const handleFlyComplete = useCallback(() => {
    // Popup opened via popupOpenId state in OfficeMarker
  }, []);

  const handlePopupClose = useCallback(() => {
    setPopupOpenId(null);
  }, []);

  // Close sidebar on mobile by default
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setSidebarOpen(!mq.matches);
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(!e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div className={styles.page}>
      {/* Back button */}
      <button
        type="button"
        className={styles.backButton}
        onClick={() => navigate('/travel/search')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Назад к поиску
      </button>

      {/* Mobile sidebar toggle */}
      <button
        type="button"
        className={`${styles.sidebarToggle} ${sidebarOpen ? styles.sidebarToggleActive : ''}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? 'Скрыть панель' : 'Показать панель'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {sidebarOpen ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''} ${selectedLocation && sidebarOpen ? styles.sidebarHasSelection : ''}`}
      >
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Офисы партнёров</h2>
          <p className={styles.sidebarSubtitle}>
            {filteredLocations.length} офис
            {filteredLocations.length === 1
              ? ''
              : filteredLocations.length < 5
                ? 'а'
                : 'ов'}{' '}
            {destinationFilter
              ? `в ${destinationFilter}`
              : 'по всем направлениям'}
          </p>
        </div>

        {/* Destination filter */}
        <div className={styles.filterWrapper}>
          <select
            className={styles.filterSelect}
            value={destinationFilter}
            onChange={(e) => {
              setDestinationFilter(e.target.value);
              setSelectedLocationId(null);
              setPopupOpenId(null);
              setFlyTarget(null);
            }}
          >
            {DESTINATION_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Office list */}
        <div className={styles.officeList} ref={listRef}>
          {filteredLocations.length === 0 ? (
            <div className={styles.officeListEmpty}>
              Нет офисов в выбранном направлении
            </div>
          ) : (
            filteredLocations.map((loc) => {
              const isSelected = selectedLocationId === loc.id;
              const color = DESTINATION_COLORS[loc.destination] || DEFAULT_COLOR;
              return (
                <button
                  key={loc.id}
                  type="button"
                  data-location-id={loc.id}
                  className={`${styles.officeItem} ${isSelected ? styles.officeItemActive : ''}`}
                  onClick={() => handleSelectLocation(loc.id)}
                >
                  <div className={styles.officeItemDot} style={{ background: color }} />
                  <div className={styles.officeItemContent}>
                    <div className={styles.officeItemName}>{loc.name}</div>
                    <div className={styles.officeItemAddress}>{loc.address}</div>
                    <div className={styles.officeItemPhone}>{loc.phone}</div>
                    <div className={styles.officeItemServices}>
                      {loc.has_storage && (
                        <span className={styles.serviceBadge} title="Хранение">
                          🏠
                        </span>
                      )}
                      {loc.has_rental && (
                        <span className={styles.serviceBadge} title="Аренда">
                          🚗
                        </span>
                      )}
                      <span className={styles.officeItemPartner}>{loc.partner}</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Map */}
      <div className={styles.mapContainer}>
        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          className={styles.map}
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <TileLayer attribution="" url={TILE_URL} />

          <MapFlyTo
            location={flyTarget}
            onFlyComplete={handleFlyComplete}
          />

          {MOCK_LOCATIONS.map((loc) => (
            <OfficeMarker
              key={loc.id}
              location={loc}
              isSelected={selectedLocationId === loc.id}
              onSelect={handleSelectLocation}
              popupOpen={popupOpenId === loc.id}
              onPopupClose={handlePopupClose}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default TravelMap;
