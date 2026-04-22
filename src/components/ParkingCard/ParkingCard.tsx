import { Link } from 'react-router-dom';
import { Button } from '../Button/Button';
import styles from './ParkingCard.module.css';

export interface Parking {
  id: string;
  title: string;
  address: string;
  price: number;
  spots: number;
  image?: string;
}

interface ParkingCardProps {
  parking: Parking;
}

// Security: Validate and sanitize image URL
function sanitizeImageUrl(url: string | undefined): string | null {
  if (!url) return null;
  
  // Remove dangerous protocols
  const sanitized = url.trim().toLowerCase();
  if (sanitized.startsWith('javascript:') || 
      sanitized.startsWith('data:') || 
      sanitized.startsWith('vbscript:') ||
      sanitized.startsWith('onerror=') ||
      sanitized.startsWith('onclick=')) {
    return null;
  }
  
  // Only allow http(s) URLs and relative paths
  if (!sanitized.startsWith('http://') && 
      !sanitized.startsWith('https://') && 
      !sanitized.startsWith('/') &&
      !sanitized.startsWith('./') &&
      !sanitized.startsWith('../')) {
    return null;
  }
  
  // Validate URL structure
  try {
    if (sanitized.startsWith('http://') || sanitized.startsWith('https://')) {
      const parsed = new URL(sanitized);
      // Block dangerous file types
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

export function ParkingCard({ parking: rawParking }: ParkingCardProps) {
  // Security: Validate parking data on load
  const validation = validateParking(rawParking);
  if (!validation.valid) {
    return null;
  }
  
  // Security: Sanitize image URL
  const safeImageUrl = sanitizeImageUrl(rawParking.image);
  
  // Security: Sanitize text content
  const safeTitle = sanitizeText(rawParking.title);
  const safeAddress = sanitizeText(rawParking.address);
  
  // Extract badge from first word only (safe)
  const badgeText = safeTitle.split(' ')[0];

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        {safeImageUrl ? (
          <img 
            src={safeImageUrl} 
            alt={safeTitle} 
            className={styles.image}
            onError={(e) => {
              // Fallback if image fails to load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span className={styles.icon}>🅿️</span>
        )}
        <span className={styles.badge}>ЖК {badgeText}</span>
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
        <div className={styles.details}>
          <div className={styles.price}>
            {rawParking.price.toLocaleString('ru-RU')} <span>₽/мес</span>
          </div>
          <div className={styles.spots}>
            <strong>{rawParking.spots}</strong> мест
          </div>
        </div>
        <Link to={`/catalog/${rawParking.id}`} style={{ marginTop: '16px', display: 'block' }}>
          <Button variant="secondary" size="small" fullWidth>
            Арендовать
          </Button>
        </Link>
      </div>
    </div>
  );
}