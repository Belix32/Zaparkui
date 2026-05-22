import { useState, useEffect, useCallback } from 'react';
import { ParkingCard, FilterPanel, FilterValues, ParkingMap } from '../../components';
import { parkings as staticParkings } from '../../data/parkings';
import { searchParkings, Parking, ParkingFilters } from '../../lib/supabase';
import { useGeolocation, useSearchHistory, sortByDistance } from '../../hooks';
import styles from './Catalog.module.css';

const defaultFilters: FilterValues = {
  price: 'all',
  district: '',
  metro: '',
  parkingType: '',
  sortBy: 'newest',
};

function isSupabaseConfigured(): boolean {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export function Catalog() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [useStaticData, setUseStaticData] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedParking, setSelectedParking] = useState<Parking | null>(null);
  
  // Geolocation hook
  const {
    latitude: userLatitude,
    longitude: userLongitude,
    loading: locationLoading,
    error: locationError,
    requestLocation,
  } = useGeolocation();
  
  // Search history hook
  const { addToHistory } = useSearchHistory();

  const loadParkings = useCallback(async () => {
    setLoading(true);
    setError('');
    setUseStaticData(false);
    
    // Always try Supabase first (required for shared parkings)
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, using demo data');
      setUseStaticData(true);
      setLoading(false);
      return;
    }
    
    try {
      let filterParams: ParkingFilters = {};
      
      if (search.trim()) {
        filterParams.search = search.trim();
      }
      
      // Price filter
      if (filters.price === 'low') {
        filterParams.maxPrice = 7999;
      } else if (filters.price === 'medium') {
        filterParams.minPrice = 8000;
        filterParams.maxPrice = 11999;
      } else if (filters.price === 'high') {
        filterParams.minPrice = 12000;
      }
      
      // Extended filters
      if (filters.district) {
        filterParams.district = filters.district;
      }
      if (filters.metro) {
        filterParams.metro = filters.metro;
      }
      if (filters.parkingType) {
        filterParams.parkingType = filters.parkingType as 'ground' | 'underground' | 'roof' | 'covered';
      }
      
      // User location for distance filter
      if (userLatitude && userLongitude) {
        filterParams.userLatitude = userLatitude;
        filterParams.userLongitude = userLongitude;
        filterParams.maxDistance = 50; // within 50km
      }
      
      const data = await searchParkings(filterParams);
      setParkings(data);
      setUseStaticData(data.length === 0);
    } catch (err) {
      console.error('Error loading parkings:', err);
      setError('Не удалось загрузить парковки. Используем демо-данные.');
      setUseStaticData(true);
    } finally {
      setLoading(false);
    }
  }, [search, filters, userLatitude, userLongitude]);

  // Filter static data with extended filters
  const filteredStaticParkings = useCallback(() => {
    let filtered = staticParkings.filter((p) => {
      const matchesSearch = !search || 
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.address.toLowerCase().includes(search.toLowerCase());
      
      const matchesPrice = filters.price === 'all' ||
        (filters.price === 'low' && p.price < 8000) ||
        (filters.price === 'medium' && p.price >= 8000 && p.price < 12000) ||
        (filters.price === 'high' && p.price >= 12000);
      
      const matchesDistrict = !filters.district || p.district === filters.district;
      const matchesMetro = !filters.metro || p.metro === filters.metro;
      const matchesType = !filters.parkingType || p.parkingType === filters.parkingType;
      
      return matchesSearch && matchesPrice && matchesDistrict && matchesMetro && matchesType;
    });
    
    // Sort results
    if (filters.sortBy === 'price_asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'price_desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (filters.sortBy === 'spots') {
      filtered.sort((a, b) => b.spots - a.spots);
    }
    
    // If user location available, sort by distance
    if (userLatitude && userLongitude && filtered.some(p => p.latitude)) {
      filtered = sortByDistance(filtered, userLatitude, userLongitude);
    }
    
    return filtered;
  }, [search, filters, userLatitude, userLongitude]);

  useEffect(() => {
    loadParkings();
  }, [loadParkings]);

  // Save search to history when search changes
  useEffect(() => {
    if (search || Object.values(filters).some(v => v && v !== 'all' && v !== 'newest')) {
      addToHistory(search, {
        price: filters.price,
        district: filters.district,
        metro: filters.metro,
        parkingType: filters.parkingType,
      });
    }
  }, [search, filters, addToHistory]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  const handleFilterReset = () => {
    setFilters(defaultFilters);
  };

  const handleFilterSearch = () => {
    loadParkings();
  };

  const handleSelectParking = (parking: Parking) => {
    setSelectedParking(parking);
  };

  const displayParkings = useStaticData ? filteredStaticParkings() : parkings;

  return (
    <section className={styles.catalog}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={`title-h1 ${styles.title}`}>Доступные парковки</h1>
          <p className={styles.subtitle}>
            {useStaticData 
              ? 'Демо-режим. Подключите Supabase для работы с базой данных.' 
              : 'Найдите идеальное парковочное место в вашем ЖК'}
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className={styles.search}
              placeholder="Поиск по ЖК или адресу..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className={styles.actions}>
            {/* Geolocation button */}
            <button
              type="button"
              className={`${styles.actionButton} ${userLatitude ? styles.active : ''}`}
              onClick={requestLocation}
              disabled={locationLoading}
              title="Показать парковки рядом со мной"
            >
              {locationLoading ? (
                <span className={styles.spinner} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
                </svg>
              )}
              {userLatitude ? 'Рядом' : 'Найти'}
            </button>
            
            {/* Map toggle button */}
            <button
              type="button"
              className={`${styles.actionButton} ${showMap ? styles.active : ''}`}
              onClick={() => setShowMap(!showMap)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {showMap ? 'Список' : 'Карта'}
            </button>
          </div>
        </div>

        {/* Geolocation status */}
        {locationError && (
          <div className={styles.locationError}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {locationError}
          </div>
        )}

        {/* Advanced filters */}
        <div className={styles.filtersWrapper}>
          <FilterPanel
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleFilterReset}
            onSearch={handleFilterSearch}
          />
        </div>

        {/* Map view */}
        {showMap && (
          <div className={styles.mapWrapper}>
            <ParkingMap
              parkings={displayParkings}
              userLatitude={userLatitude || undefined}
              userLongitude={userLongitude || undefined}
              selectedParking={selectedParking}
              onSelectParking={handleSelectParking}
              className={styles.map}
            />
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>⏳</div>
            <p>Загрузка парковок...</p>
          </div>
        ) : error && useStaticData ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>⚠️</div>
            <p>{error}</p>
          </div>
        ) : displayParkings.length > 0 ? (
          <>
            <div className={styles.meta}>
              <span>Найдено: {displayParkings.length}</span>
              {userLatitude && userLongitude && (
                <span className={styles.sortedByDistance}>Отсортировано по расстоянию</span>
              )}
            </div>
            
            <div className={styles.grid}>
              {displayParkings.map((parking) => (
                <ParkingCard
                  key={parking.id}
                  parking={parking}
                  onSelect={handleSelectParking}
                />
              ))}
            </div>

            {displayParkings.length >= 10 && (
              <div className={styles.pagination}>
                <button className={`${styles.pageButton} ${styles.pageButtonActive}`}>1</button>
                <button className={styles.pageButton}>2</button>
                <button className={styles.pageButton}>3</button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔍</div>
            <p>Парковки не найдены</p>
            <p>Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>
    </section>
  );
}