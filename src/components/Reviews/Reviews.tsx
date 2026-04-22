import { useState, useCallback } from 'react';
import { useReviews, LocalReview } from '../../hooks';
import { Button } from '../Button/Button';
import styles from './Reviews.module.css';

interface ReviewsProps {
  parkingId: string;
}

// Star rating display component
function StarRating({
  rating,
  onRate,
  readonly = false,
}: {
  rating: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
}) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className={styles.starRating}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`${styles.star} ${(hoverRating || rating) >= star ? styles.starFilled : ''}`}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          disabled={readonly}
          aria-label={`Оценить на ${star} звёзд`}
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
 */
export function Reviews({ parkingId }: ReviewsProps) {
  const {
    reviews,
    averageRating,
    totalReviews,
    addReview,
  } = useReviews(parkingId);
  
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userRating < 1 || userRating > 5) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      addReview(userRating, comment);
      setUserRating(0);
      setComment('');
    } finally {
      setIsSubmitting(false);
    }
  }, [userRating, comment, addReview]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className={styles.reviews}>
      {/* Rating summary */}
      <div className={styles.summary}>
        <div className={styles.averageRating}>
          <span className={styles.ratingNumber}>{averageRating.toFixed(1)}</span>
          <StarRating rating={averageRating} readonly />
          <span className={styles.totalCount}>{totalReviews} отзывов</span>
        </div>
      </div>

      {/* Add review form */}
      <form className={styles.form} onSubmit={handleSubmit}>
        <h3 className={styles.formTitle}>Оставить отзыв</h3>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Оценка</label>
          <StarRating rating={userRating} onRate={setUserRating} />
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Отзыв</label>
          <textarea
            className={styles.textarea}
            placeholder="Поделитесь впечатлениями о парковке..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={4}
          />
          <span className={styles.charCount}>{comment.length}/500</span>
        </div>
        
        <Button
          type="submit"
          variant="primary"
          disabled={userRating === 0 || isSubmitting}
        >
          {isSubmitting ? 'Отправка...' : 'Отправить отзыв'}
        </Button>
      </form>

      {/* Reviews list */}
      <div className={styles.list}>
        {reviews.length > 0 ? (
          <>
            <h3 className={styles.listTitle}>Все отзывы ({reviews.length})</h3>
            {reviews.map((review: LocalReview) => (
              <div key={review.id} className={styles.review}>
                <div className={styles.reviewHeader}>
                  <StarRating rating={review.rating} readonly />
                  <span className={styles.reviewDate}>
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                {review.comment && (
                  <p className={styles.reviewComment}>{review.comment}</p>
                )}
              </div>
            ))}
          </>
        ) : (
          <p className={styles.noReviews}>Отзывов пока нет. Будьте первым!</p>
        )}
      </div>
    </div>
  );
}