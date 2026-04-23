import { useState, useCallback, useEffect } from 'react';
import { districts, metroStations, parkingTypes } from '../../data/parkings';
import { Button } from '../Button/Button';
import styles from './FilterPanel.module.css';

export interface FilterValues {
  price: string;
  district: string;
  metro: string;
  parkingType: string;
  sortBy: string;
}

interface FilterPanelProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
  onReset: () => void;
  onSearch: () => void;
}

// Local initial state for reset
const defaultFilters: FilterValues = {
  price: 'all',
  district: '',
  metro: '',
  parkingType: '',
  sortBy: 'newest',
};

/**
 * Advanced filter panel component
 * P0 feature - Расширенные фильтры
 * Mobile: bottom sheet / Desktop: expanded panel
 */
export function FilterPanel({
  filters,
  onChange,
  onReset,
  onSearch,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterValues>(filters);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync with external filters
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = useCallback((field: keyof FilterValues, value: string) => {
    const updated = { ...localFilters, [field]: value };
    setLocalFilters(updated);
    onChange(updated);
  }, [localFilters, onChange]);

  const handleReset = useCallback(() => {
    setLocalFilters(defaultFilters);
    onReset();
  }, [onReset]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
    if (isMobile) {
      setIsExpanded(false);
    }
  }, [onSearch, isMobile]);

  const handleExpand = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  // Close on overlay click for mobile
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsExpanded(false);
    }
  }, []);

  // Check if any filters are active
  const hasActiveFilters =
    localFilters.price !== 'all' ||
    localFilters.district !== '' ||
    localFilters.metro !== '' ||
    localFilters.parkingType !== '';

  // Mobile bottom sheet render
  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        {isExpanded && (
          <div
            className={styles.overlay}
            onClick={handleOverlayClick}
          />
        )}
        <div className={`${styles.filterPanel} ${isExpanded ? styles.open : ''}`}>
          <button
            type="button"
            className={styles.expandButton}
            onClick={handleExpand}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={isExpanded ? styles.rotated : ''}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            Фильтры
            {hasActiveFilters && (
              <span className={styles.activeCount}>•</span>
            )}
          </button>

          {isExpanded && (
            <form className={styles.filters} onSubmit={handleSubmit}>
              {/* Price filter */}
              <div className={styles.field}>
                <label className={styles.label}>Цена</label>
                <select
                  className={styles.select}
                  value={localFilters.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                >
                  <option value="all">Любая цена</option>
                  <option value="low">До 8 000 ₽</option>
                  <option value="medium">8 000 - 12 000 ₽</option>
                  <option value="high">От 12 000 ₽</option>
                </select>
              </div>

              {/* District filter */}
              <div className={styles.field}>
                <label className={styles.label}>Район</label>
                <select
                  className={styles.select}
                  value={localFilters.district}
                  onChange={(e) => handleChange('district', e.target.value)}
                >
                  <option value="">Все районы</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>

              {/* Metro filter */}
              <div className={styles.field}>
                <label className={styles.label}>Метро</label>
                <select
                  className={styles.select}
                  value={localFilters.metro}
                  onChange={(e) => handleChange('metro', e.target.value)}
                >
                  <option value="">Все станции</option>
                  {metroStations.map((metro) => (
                    <option key={metro} value={metro}>
                      {metro}
                    </option>
                  ))}
                </select>
              </div>

              {/* Parking type filter */}
              <div className={styles.field}>
                <label className={styles.label}>Тип парковки</label>
                <select
                  className={styles.select}
                  value={localFilters.parkingType}
                  onChange={(e) => handleChange('parkingType', e.target.value)}
                >
                  <option value="">Все типы</option>
                  {parkingTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort by */}
              <div className={styles.field}>
                <label className={styles.label}>Сортировка</label>
                <select
                  className={styles.select}
                  value={localFilters.sortBy}
                  onChange={(e) => handleChange('sortBy', e.target.value)}
                >
                  <option value="newest">Сначала новые</option>
                  <option value="price_asc">Сначала дешевые</option>
                  <option value="price_desc">Сначала дорогие</option>
                  <option value="rating">По рейтингу</option>
                  <option value="spots">По количеству мест</option>
                </select>
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                <Button
                  type="button"
                  variant="ghost"
                  size="small"
                  onClick={handleReset}
                >
                  Сбросить
                </Button>
                <Button type="submit" variant="primary" size="small">
                  Применить
                </Button>
              </div>
            </form>
          )}
        </div>
      </>
    );
  }

  // Desktop render - original panel behavior
  return (
    <div className={styles.filterPanel}>
      <button
        type="button"
        className={styles.expandButton}
        onClick={handleExpand}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={isExpanded ? styles.rotated : ''}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        Фильтры
        {hasActiveFilters && (
          <span className={styles.activeCount}>•</span>
        )}
      </button>

      {isExpanded && (
        <form className={styles.filters} onSubmit={handleSubmit}>
          {/* Price filter */}
          <div className={styles.field}>
            <label className={styles.label}>Цена</label>
            <select
              className={styles.select}
              value={localFilters.price}
              onChange={(e) => handleChange('price', e.target.value)}
            >
              <option value="all">Любая цена</option>
              <option value="low">До 8 000 ₽</option>
              <option value="medium">8 000 - 12 000 ₽</option>
              <option value="high">От 12 000 ₽</option>
            </select>
          </div>

          {/* District filter */}
          <div className={styles.field}>
            <label className={styles.label}>Район</label>
            <select
              className={styles.select}
              value={localFilters.district}
              onChange={(e) => handleChange('district', e.target.value)}
            >
              <option value="">Все районы</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>

          {/* Metro filter */}
          <div className={styles.field}>
            <label className={styles.label}>Метро</label>
            <select
              className={styles.select}
              value={localFilters.metro}
              onChange={(e) => handleChange('metro', e.target.value)}
            >
              <option value="">Все станции</option>
              {metroStations.map((metro) => (
                <option key={metro} value={metro}>
                  {metro}
                </option>
              ))}
            </select>
          </div>

          {/* Parking type filter */}
          <div className={styles.field}>
            <label className={styles.label}>Тип парковки</label>
            <select
              className={styles.select}
              value={localFilters.parkingType}
              onChange={(e) => handleChange('parkingType', e.target.value)}
            >
              <option value="">Все типы</option>
              {parkingTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort by */}
          <div className={styles.field}>
            <label className={styles.label}>Сортировка</label>
            <select
              className={styles.select}
              value={localFilters.sortBy}
              onChange={(e) => handleChange('sortBy', e.target.value)}
            >
              <option value="newest">Сн��ча��а новые</option>
              <option value="price_asc">Сначала дешевые</option>
              <option value="price_desc">Сначала дорогие</option>
              <option value="rating">По рейтингу</option>
              <option value="spots">По количеству мест</option>
            </select>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <Button
              type="button"
              variant="ghost"
              size="small"
              onClick={handleReset}
            >
              Сбросить
            </Button>
            <Button type="submit" variant="primary" size="small">
              Применить
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}