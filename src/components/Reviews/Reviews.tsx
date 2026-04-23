import { useState, useCallback, useMemo } from 'react';
import { useReviews, LocalReview } from '../../hooks';
import { ReviewForm } from './ReviewForm';
import styles from './Reviews.module.css';

interface ReviewsProps {
  parkingId: string;
}

const REVIEWS_PER_PAGE = 5;

// Touch-friendly Star rating component
function StarRating({
  rating,
  onRate,
  readonly = false,
  size = 'medium',
}: {
  rating: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  size?: 'small' | 'medium' | 'large';
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const [isTouchActive, setIsTouchActive] = useState(false);

  const handleTouchStart = useCallback(() => {
    setIsTouchActive(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsTouchActive(false);
  }, []);

  const sizeMap = {
    small: '20px',
    medium: '28px',
    large: '36px',
  };

  return (
    <div
      className={`${styles.starRating} ${styles[`starRating${size.charAt(0).toUpperCase() + size.slice(1)}`]}`}
      role="radiogroup"
      aria-label="Выберите оценку"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={(hoverRating || rating) >= star}
          aria-label={`${star} звёзд`}
          className={`
            ${styles.star}
            ${(hoverRating || rating) >= star ? styles.starFilled : ''}
            ${isTouchActive && !readonly ? styles.starActive : ''}
          `}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          disabled={readonly}
          style={{ fontSize: sizeMap[size] }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/**
 * Reviews component for displaying and adding ratings/reviews
 * P2 feature - Рейтинги и отзывы
 * Mobile-optimized with touch-friendly interactions
 */
export function Reviews({ parkingId }: ReviewsProps) {
  const {
    reviews,
    averageRating,
    totalReviews,
  } = useReviews(parkingId);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Calculate pagination
  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const paginatedReviews = useMemo(() => {
    if (showAllReviews) return reviews;
    const start = (currentPage - 1) * REVIEWS_PER_PAGE;
    return reviews.slice(start, start + REVIEWS_PER_PAGE);
  }, [reviews, currentPage, showAllReviews]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to reviews list on mobile
    if (window.innerWidth < 768) {
      const element = document.getElementById('reviews-list');
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleReviewAdded = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return (
    <div className={styles.reviews}>
      {/* Rating summary - mobile optimized */}
      <div className={styles.summary}>
        <div className={styles.summaryContent}>
          <div className={styles.ratingBlock}>
            <span className={styles.ratingNumber}>{averageRating.toFixed(1)}</span>
            <span className={styles.ratingLabel}>из 5</span>
          </div>
          <div className={styles.ratingInfo}>
            <StarRating rating={averageRating} readonly size="medium" />
            <span className={styles.totalCount}>
              {totalReviews === 0 ? 'Нет отзывов' :
               totalReviews === 1 ? '1 отзыв' :
               totalReviews < 5 ? `${totalReviews} отзыва` :
               `${totalReviews} отзывов`}
            </span>
          </div>
        </div>
      </div>

      {/* Add review form - mobile optimized */}
      <ReviewForm onReviewAdded={handleReviewAdded} />

      {/* Reviews list with pagination */}
      <div id="reviews-list" className={styles.list}>
        {reviews.length > 0 ? (
          <>
            <h3 className={styles.listTitle}>
              Все отзывы
              <span className={styles.reviewsCount}>{reviews.length}</span>
            </h3>

            <div className={styles.reviewsList}>
              {paginatedReviews.map((review: LocalReview) => (
                <article key={review.id} className={styles.review}>
                  <header className={styles.reviewHeader}>
                    <StarRating rating={review.rating} readonly size="small" />
                    <time className={styles.reviewDate} dateTime={review.createdAt}>
                      {formatDate(review.createdAt)}
                    </time>
                  </header>
                  {review.comment && (
                    <p className={styles.reviewComment}>{review.comment}</p>
                  )}
                </article>
              ))}
            </div>

            {/* Pagination */}
            {!showAllReviews && totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  className={`${styles.pageBtn} ${currentPage === 1 ? styles.pageBtnDisabled : ''}`}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Предыдущая страница"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <div className={styles.pageNumbers}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={`${styles.pageNumber} ${page === currentPage ? styles.pageNumberActive : ''}`}
                      onClick={() => handlePageChange(page)}
                      aria-label={`Страница ${page}`}
                      aria-current={page === currentPage ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className={`${styles.pageBtn} ${currentPage === totalPages ? styles.pageBtnDisabled : ''}`}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Следующая страница"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}

            {/* Show all / Show less */}
            {totalPages > 2 && (
              <button
                type="button"
                className={styles.showAllBtn}
                onClick={() => {
                  setShowAllReviews(!showAllReviews);
                  setCurrentPage(1);
                }}
              >
                {showAllReviews ? 'Показать меньше' : `Показать все ${totalReviews} отзывов`}
              </button>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.17a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
            <p className={styles.emptyText}>Отзывов пока нет</p>
            <p className={styles.emptySubtext}>Будьте первым, кто оставит отзыв!</p>
          </div>
        )}
      </div>
    </div>
  );
}