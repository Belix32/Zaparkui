import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { parkings as staticParkings } from '../../data/parkings';
import { Parking } from '../../lib/supabase';
import { useFavorites, useSearchHistory } from '../../hooks';
import { Button } from '../../components/Button/Button';
import styles from './Profile.module.css';

/**
 * User profile page with favorites and booking history
 * P1 feature - История поиска, Избранное
 */
export function Profile() {
  const { favorites, loading: favoritesLoading, clearFavorites, removeFavorite } = useFavorites();
  const { history, loading: historyLoading, clearHistory, removeFromHistory } = useSearchHistory();
  const [activeTab, setActiveTab] = useState<'favorites' | 'history'>('favorites');
  
  // Get favorite parkings data
  const [favoriteParkings, setFavoriteParkings] = useState<Parking[]>([]);
  
  useEffect(() => {
    if (favorites.length > 0) {
      const parkingData = favorites
        .map(f => {
          // Check static data first
          const staticParking = staticParkings.find(p => p.id === f.parkingId);
          if (staticParking) return staticParking;
          
          // Check if it's in database (would require Supabase)
          return null;
        })
        .filter(Boolean) as Parking[];
      
      setFavoriteParkings(parkingData);
    } else {
      setFavoriteParkings([]);
    }
  }, [favorites]);

  const handleRemoveFavorite = useCallback((parkingId: string) => {
    removeFavorite(parkingId);
  }, [removeFavorite]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <section className={styles.profile}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={`title-h1 ${styles.title}`}>Личный кабинет</h1>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'favorites' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Избранное
            {favorites.length > 0 && (
              <span className={styles.badge}>{favorites.length}</span>
            )}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'history' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            История поиска
            {history.length > 0 && (
              <span className={styles.badge}>{history.length}</span>
            )}
          </button>
        </div>

        {/* Favorites tab */}
        {activeTab === 'favorites' && (
          <div className={styles.content}>
            {favoritesLoading ? (
              <div className={styles.loading}>
                <span className={styles.spinner} />
                Загрузка...
              </div>
            ) : favoriteParkings.length > 0 ? (
              <>
                <div className={styles.actions}>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={clearFavorites}
                  >
                    Очистить всё
                  </Button>
                </div>
                
                <div className={styles.list}>
                  {favoriteParkings.map((parking) => (
                    <div key={parking.id} className={styles.item}>
                      <div className={styles.itemInfo}>
                        <h3 className={styles.itemTitle}>{parking.title}</h3>
                        <p className={styles.itemAddress}>{parking.address}</p>
                        <div className={styles.itemDetails}>
                          <span className={styles.itemPrice}>
                            {parking.price.toLocaleString('ru-RU')} ₽/мес
                          </span>
                          <span className={styles.itemSpots}>
                            {parking.spots} мест
                          </span>
                          {parking.rating && (
                            <span className={styles.itemRating}>
                              ★ {parking.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={styles.itemActions}>
                        <Link to={`/catalog/${parking.id}`}>
                          <Button variant="primary" size="small">
                            Арендовать
                          </Button>
                        </Link>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => handleRemoveFavorite(parking.id)}
                          aria-label="Удалить из избранного"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.empty}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <p>У вас пока нет избранных парковок</p>
                <Link to="/catalog">
                  <Button variant="primary">Найти парковки</Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* History tab */}
        {activeTab === 'history' && (
          <div className={styles.content}>
            {historyLoading ? (
              <div className={styles.loading}>
                <span className={styles.spinner} />
                Загрузка...
              </div>
            ) : history.length > 0 ? (
              <>
                <div className={styles.actions}>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={clearHistory}
                  >
                    Очистить историю
                  </Button>
                </div>
                
                <div className={styles.historyList}>
                  {history.map((item, index) => (
                    <div key={index} className={styles.historyItem}>
                      <div className={styles.historyMain}>
                        <span className={styles.historyQuery}>
                          {item.query || 'Все парковки'}
                        </span>
                        <span className={styles.historyDate}>
                          {formatDate(item.timestamp)}
                        </span>
                      </div>
                      {item.filters && (
                        <div className={styles.historyFilters}>
                          {item.filters.price && item.filters.price !== 'all' && (
                            <span className={styles.filterTag}>
                              Цена: {item.filters.price}
                            </span>
                          )}
                          {item.filters.district && (
                            <span className={styles.filterTag}>
                              {item.filters.district}
                            </span>
                          )}
                          {item.filters.metro && (
                            <span className={styles.filterTag}>
                              {item.filters.metro}
                            </span>
                          )}
                          {item.filters.parkingType && (
                            <span className={styles.filterTag}>
                              {item.filters.parkingType}
                            </span>
                          )}
                        </div>
                      )}
                      <button
                        type="button"
                        className={styles.removeHistory}
                        onClick={() => removeFromHistory(index)}
                        aria-label="Удалить из истории"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.empty}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <p>История поиска пуста</p>
                <Link to="/catalog">
                  <Button variant="primary">Начать поиск</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}