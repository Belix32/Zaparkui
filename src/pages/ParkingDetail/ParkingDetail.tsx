import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Parking, getParkingById, getParkingReviews, Review, isSupabaseConfigured } from '../../lib/supabase';
import { parkings as staticParkings } from '../../data/parkings';
import { useFavorites } from '../../hooks';
import { Button } from '../../components/Button/Button';
import { Reviews } from '../../components/Reviews/Reviews';
import styles from './ParkingDetail.module.css';

// Security: Validate image URL
function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Placeholder image for missing images
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800&h=400&fit=crop';

/**
 * Parking detail page - shows full parking information
 * P0 feature - Просмотр карточки парковки
 */
export function ParkingDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const parkingId = params.id || searchParams.get('id') || searchParams.get('parkingId');
  
  const [parking, setParking] = useState<Parking | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const { isFavorite: checkIsFavorite, toggleFavorite: toggleFav, addFavorite, removeFavorite } = useFavorites();
  const [addedToFavorites, setAddedToFavorites] = useState(false);
  
  // Check if using static/fallback data
  const [useStaticData, setUseStaticData] = useState(false);

  const loadParking = useCallback(async () => {
    if (!parkingId) {
      setError('ID парковки не указан');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    
    // Try Supabase first
    if (isSupabaseConfigured()) {
      try {
        const data = await getParkingById(parkingId);
        if (data) {
          setParking(data);
          setUseStaticData(false);
          
          // Load reviews from Supabase
          try {
            const parkingReviews = await getParkingReviews(parkingId);
            setReviews(parkingReviews);
          } catch (reviewErr) {
            console.error('Error loading reviews:', reviewErr);
          }
        } else {
          // Try static data
          const staticParking = staticParkings.find(p => p.id === parkingId);
          if (staticParking) {
            setParking(staticParking);
            setUseStaticData(true);
          } else {
            setError('Парковка не найдена');
          }
        }
      } catch (err) {
        console.error('Error loading parking:', err);
        // Fall back to static data
        const staticParking = staticParkings.find(p => p.id === parkingId);
        if (staticParking) {
          setParking(staticParking);
          setUseStaticData(true);
        } else {
          setError('Парковка не найдена');
        }
      }
    } else {
      // Use static data directly
      const staticParking = staticParkings.find(p => p.id === parkingId);
      if (staticParking) {
        setParking(staticParking);
        setUseStaticData(true);
      } else {
        setError('Парковка не найдена');
      }
    }
    
    setLoading(false);
  }, [parkingId]);

  useEffect(() => {
    loadParking();
  }, [loadParking]);

  // Check if this parking is in favorites
  useEffect(() => {
    if (parkingId) {
      setAddedToFavorites(checkIsFavorite(parkingId));
    }
  }, [parkingId, checkIsFavorite]);

  const handleBookNow = () => {
    if (parkingId) {
      navigate(`/booking?parkingId=${parkingId}`);
    }
  };

  const handleToggleFavorite = () => {
    if (!parkingId) return;
    
    if (addedToFavorites) {
      removeFavorite(parkingId);
    } else {
      addFavorite(parkingId);
    }
    setAddedToFavorites(!addedToFavorites);
  };

  const formatParkingType = (type?: string) => {
    const types: Record<string, string> = {
      ground: 'Открытая',
      underground: 'Подземная',
      roof: 'Крышная',
      covered: 'Крытая',
    };
    return type ? types[type] || type : '';
  };

  // Get all images for gallery
  const getAllImages = (): string[] => {
    const images: string[] = [];
    
    // Add main image first if exists
    if (parking?.image && isValidImageUrl(parking.image)) {
      images.push(parking.image);
    }
    
    // Add additional images from images array
    if (parking?.images && parking.images.length > 0) {
      parking.images.forEach(img => {
        if (isValidImageUrl(img) && !images.includes(img)) {
          images.push(img);
        }
      });
    }
    
    // Return placeholder if no images
    if (images.length === 0) {
      images.push(PLACEHOLDER_IMAGE);
    }
    
    return images;
  };

  const allImages = getAllImages();
  const currentImage = allImages[selectedImageIndex] || PLACEHOLDER_IMAGE;

  // Loading state
  if (loading) {
    return (
      <section className={styles.detail}>
        <div className="container">
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Загрузка информации о парковке...</p>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error || !parking) {
    return (
      <section className={styles.detail}>
        <div className="container">
          <div className={styles.error}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h2>Ошибка</h2>
            <p>{error || 'Парковка не найдена'}</p>
            <Link to="/catalog">
              <Button variant="primary">Вернуться к каталогу</Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.detail}>
      <div className="container">
        {/* Demo mode banner */}
        {useStaticData && (
          <div className={styles.demoBanner}>
            Парковка загружена в демо-режиме
          </div>
        )}

        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/catalog">Каталог</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span>{parking.title}</span>
        </div>

        {/* Main content grid */}
        <div className={styles.grid}>
          {/* Left column - Images */}
          <div className={styles.gallery}>
            <div className={styles.mainImage}>
              <img src={currentImage} alt={parking.title} loading="lazy" />
            </div>
            {/* Thumbnail grid */}
            {allImages.length > 1 && (
              <div className={styles.thumbnails}>
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`${styles.thumbnail} ${index === selectedImageIndex ? styles.thumbnailActive : ''}`}
                    onClick={() => setSelectedImageIndex(index)}
                    aria-label={`Показать изображение ${index + 1}`}
                  >
                    <img src={img} alt={`Миниатюра ${index + 1}`} loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right column - Info */}
          <div className={styles.info}>
            <h1 className={styles.title}>{parking.title}</h1>
            <p className={styles.address}>{parking.address}</p>

            {/* Rating */}
            {parking.rating && (
              <div className={styles.rating}>
                <span className={styles.ratingStars}>
                  {'★'.repeat(Math.round(parking.rating))}
                </span>
                <span className={styles.ratingValue}>{parking.rating.toFixed(1)}</span>
                {parking.reviewCount && (
                  <span className={styles.reviewCount}>
                    ({parking.reviewCount} отзывов)
                  </span>
                )}
              </div>
            )}

            {/* Price */}
            <div className={styles.price}>
              <span className={styles.priceValue}>
                {parking.price.toLocaleString('ru-RU')} ₽
              </span>
              <span className={styles.pricePeriod}>/месяц</span>
            </div>

            {/* Key features */}
            <div className={styles.features}>
              <div className={styles.feature}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M9 16h6M9 8h6M9 12h6"/>
                </svg>
                <span>{parking.spots} мест</span>
              </div>
              {parking.parkingType && (
                <div className={styles.feature}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  <span>{formatParkingType(parking.parkingType)}</span>
                </div>
              )}
              {parking.district && (
                <div className={styles.feature}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>{parking.district}</span>
                </div>
              )}
              {parking.metro && (
                <div className={styles.feature}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                  </svg>
                  <span>м. {parking.metro}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className={styles.actions}>
              <Button
                variant="primary"
                size="large"
                onClick={handleBookNow}
              >
                Забронировать
              </Button>
              <Button
                variant={addedToFavorites ? 'accent' : 'secondary'}
                size="large"
                onClick={handleToggleFavorite}
              >
                {addedToFavorites ? 'В избранном' : 'В избранное'}
              </Button>
            </div>
          </div>
        </div>

        {/* Description and amenities */}
        <div className={styles.details}>
          {parking.description && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Описание</h2>
              <p className={styles.description}>{parking.description}</p>
            </div>
          )}

          {parking.amenities && parking.amenities.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Удобства</h2>
              <div className={styles.amenities}>
                {parking.amenities.map((amenity, index) => (
                  <div key={index} className={styles.amenity}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reviews section */}
        <div className={styles.reviewsSection}>
          <h2 className={styles.sectionTitle}>Отзывы</h2>
          <Reviews parkingId={parkingId || parking.id} />
        </div>
      </div>
    </section>
  );
}

export default ParkingDetail;