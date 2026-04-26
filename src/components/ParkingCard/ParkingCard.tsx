import { Link } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { Button } from '../Button/Button';
import { Parking } from '../../lib/supabase';
import { useFavorites } from '../../hooks';
import styles from './ParkingCard.module.css';

interface ParkingCardProps {
  parking: Parking;
  onSelect?: (parking: Parking) => void;
}

// Security: Validate and sanitize image URL
function sanitizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  const sanitized = url.trim().toLowerCase();
  if (sanitized.startsWith('javascript:') || 
      sanitized.startsWith('data:') || 
      sanitized.startsWith('vbscript:') ||
      sanitized.startsWith('onerror=') ||
      sanitized.startsWith('onclick=')) {
    return null;
  }
  
  if (!sanitized.startsWith('http://') && 
      !sanitized.startsWith('https://') && 
      !sanitized.startsWith('/') &&
      !sanitized.startsWith('./') &&
      !sanitized.startsWith('../')) {
    return null;
  }
  
  try {
    if (sanitized.startsWith('http://') || sanitized.startsWith('https://')) {
      const parsed = new URL(sanitized);
      const dangerousExtensions = ['.js', '.html', '.htm', '.svg', '.xml'];
      if (dangerousExtensions.some(ext => parsed.pathname.toLowerCase().endsWith(ext))) {
        return null;
      }
    }
  } catch {
    return null;
  }
  
  return url;
}

// Security: Sanitize text content
function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .substring(0, 200);
}

// Security: Validate parking data structure
function validateParking(parking: Parking): { valid: boolean; error?: string } {
  if (!parking.id || typeof parking.id !== 'string') {
    return { valid: false, error: 'Invalid parking ID' };
  }
  if (!parking.title || parking.title.trim().length < 1) {
    return { valid: false, error: 'Invalid title' };
  }
  if (!parking.address || parking.address.trim().length < 1) {
    return { valid: false, error: 'Invalid address' };
  }
  if (typeof parking.price !== 'number' || parking.price < 0 || parking.price > 10000000) {
    return { valid: false, error: 'Invalid price' };
  }
  if (typeof parking.spots !== 'number' || parking.spots < 0 || parking.spots > 10000) {
    return { valid: false, error: 'Invalid spots' };
  }
  return { valid: true };
}

export function ParkingCard({ parking: rawParking, onSelect }: ParkingCardProps) {
  const validation = validateParking(rawParking);
  if (!validation.valid) {
    return null;
  }
  
  const safeImageUrl = sanitizeImageUrl(rawParking.image);
  const safeTitle = sanitizeText(rawParking.title);
  const safeAddress = sanitizeText(rawParking.address);
  const badgeText = safeTitle.split(' ')[0];
  
  // Favorites functionality
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const favorited = isFavorite(rawParking.id);

  const handleFavoriteClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsFavoriteLoading(true);
    try {
      toggleFavorite(rawParking.id);
    } finally {
      setIsFavoriteLoading(false);
    }
  }, [rawParking.id, toggleFavorite]);

  const handleCardClick = useCallback(() => {
    onSelect?.(rawParking);
  }, [rawParking, onSelect]);

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        {safeImageUrl ? (
          <img 
            src={safeImageUrl} 
            alt={safeTitle} 
            className={styles.image}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span className={styles.icon}>🅿️</span>
        )}
        <span className={styles.badge}>ЖК {badgeText}</span>
        
        {/* Favorite button */}
        <button
          type="button"
          className={`${styles.favoriteButton} ${favorited ? styles.favorited : ''}`}
          onClick={handleFavoriteClick}
          disabled={isFavoriteLoading}
          aria-label={favorited ? 'Удалить из избранного' : 'Добавить в избранное'}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={favorited ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        
        {/* Map indicator */}
        {rawParking.latitude && rawParking.longitude && (
          <span className={styles.mapIndicator}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </span>
        )}
      </div>
      
      <div className={styles.content}>
        <h3 className={styles.title}>{safeTitle}</h3>
        <p className={styles.address}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {safeAddress}
        </p>
        
        {rawParking.metro && (
          <p className={styles.metro}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {rawParking.metro}
          </p>
        )}
        
        <div className={styles.details}>
          <div className={styles.price}>
            {rawParking.price.toLocaleString('ru-RU')} <span>₽/мес</span>
          </div>
          <div className={styles.spots}>
            <strong>{rawParking.spots}</strong> мест
          </div>
        </div>
        
        {/* Rating display */}
        {rawParking.rating && rawParking.reviewCount !== undefined && (
          <div className={styles.rating}>
            <span className={styles.stars}>★</span>
            <span className={styles.ratingValue}>{rawParking.rating.toFixed(1)}</span>
            <span className={styles.reviewCount}>({rawParking.reviewCount})</span>
          </div>
        )}
        
        <Link 
          to={`/parking/${rawParking.id}`} 
          style={{ marginTop: '16px', display: 'block' }}
          onClick={handleCardClick}
        >
          <Button variant="secondary" size="small" fullWidth>
            Арендовать
          </Button>
        </Link>
      </div>
    </div>
  );
}