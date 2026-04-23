import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites, useSearchHistory } from '../../hooks';
import { Button } from '../../components/Button/Button';
import { BookingsHistory } from './BookingsHistory';
import styles from './Profile.module.css';

/**
 * User profile page with favorites, booking history, and search history
 * P1 feature - История поиска, Избранное, Бронирования
 */
export function Profile() {
  const { favorites, loading: favoritesLoading, clearFavorites, removeFavorite } = useFavorites();
  const { history, loading: historyLoading, clearHistory, removeFromHistory } = useSearchHistory();
  const [activeTab, setActiveTab] = useState<'favorites' | 'bookings' | 'history'>('bookings');

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
            className={`${styles.tab} ${activeTab === 'bookings' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Бронирования
          </button>
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

        {/* Bookings tab */}
        {activeTab === 'bookings' && (
          <BookingsHistory />
        )}

        {/* Favorites tab */}
        {activeTab === 'favorites' && (
          <div className={styles.content}>
            {favoritesLoading ? (
              <div className={styles.loading}>
                <span className={styles.spinner} />
                Загрузка...
              </div>
            ) : favorites.length > 0 ? (
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
                  {favorites.map((fav) => (
                    <div key={fav.parkingId} className={styles.item}>
                      <div className={styles.itemInfo}>
                        <h3 className={styles.itemTitle}>{fav.parkingId}</h3>
                        <p className={styles.itemAddress}>ID: {fav.parkingId}</p>
                      </div>
                      <div className={styles.itemActions}>
                        <Link to={`/catalog/${fav.parkingId}`}>
                          <Button variant="primary" size="small">
                            Арендовать
                          </Button>
                        </Link>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => handleRemoveFavorite(fav.parkingId)}
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