import { useState, useCallback, useRef } from 'react';
import { Button } from '../Button/Button';
import styles from './ReviewForm.module.css';

interface ReviewFormProps {
  onReviewAdded?: () => void;
}

// Touch-friendly Star rating for form
function StarRatingInput({
  rating,
  onRate,
}: {
  rating: number;
  onRate: (rating: number) => void;
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(() => {
    setIsTouchDevice(true);
  }, []);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setHoverRating(0);
    }
  }, []);

  // Close hover state on scroll for mobile
  const handleScroll = useCallback(() => {
    if (isTouchDevice) {
      setHoverRating(0);
    }
  }, [isTouchDevice]);

  return (
    <div ref={containerRef} className={styles.starRating}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={(hoverRating || rating) >= star}
          aria-label={`Оценить на ${star} звёзд`}
          className={`
            ${styles.starBtn}
            ${(hoverRating || rating) >= star ? styles.starBtnFilled : ''}
          `}
          onClick={() => {
            onRate(star);
            setHoverRating(0);
          }}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          onTouchStart={handleTouchStart}
        >
          <span className={styles.starIcon}>★</span>
          <span className={styles.starLabel}>
            {star === 1 && 'Плохо'}
            {star === 2 && 'Не очень'}
            {star === 3 && 'Нормально'}
            {star === 4 && 'Хорошо'}
            {star === 5 && 'Отлично'}
          </span>
        </button>
      ))}
    </div>
  );
}

/**
 * ReviewForm component for adding new reviews
 * Mobile-optimized with touch-friendly star rating
 */
export function ReviewForm({ onReviewAdded }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 800));

      // Dispatch custom event for parent to handle
      window.dispatchEvent(new CustomEvent('review:add', {
        detail: { rating, comment: comment.trim() }
      }));

      setRating(0);
      setComment('');
      setIsExpanded(false);
      onReviewAdded?.();
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [rating, comment, onReviewAdded]);

  const handlePhotoUpload = useCallback(() => {
    // Placeholder for photo upload functionality
    // In production, this would open file picker or camera
    alert('Загрузка фото будет доступна в следующей версии');
  }, []);

  return (
    <div className={styles.formContainer}>
      {!isExpanded ? (
        <button
          type="button"
          className={styles.expandBtn}
          onClick={() => setIsExpanded(true)}
          aria-expanded="false"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.17a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
          <span>Оставить отзыв</span>
        </button>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <header className={styles.formHeader}>
            <h3 className={styles.formTitle}>Ваш отзыв</h3>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => {
                setIsExpanded(false);
                setRating(0);
                setComment('');
              }}
              aria-label="Закрыть форму"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </header>

          {/* Star Rating */}
          <div className={styles.ratingSection}>
            <label className={styles.label}>Оценка</label>
            <StarRatingInput rating={rating} onRate={setRating} />
            {rating > 0 && (
              <p className={styles.ratingHint}>
                Выбрано: {rating} {rating === 1 ? 'звезда' : rating < 5 ? 'звезды' : 'звёзд'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className={styles.commentSection}>
            <label className={styles.label} htmlFor="review-comment">
              Комментарий
              <span className={styles.optional}>(необязательно)</span>
            </label>
            <textarea
              ref={textareaRef}
              id="review-comment"
              className={styles.textarea}
              placeholder="Поделитесь впечатлениями о парковке: удобство, чистота, безопасность..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
            />
            <div className={styles.charCounter}>
              <span className={comment.length > 450 ? styles.charCountWarning : styles.charCount}>
                {comment.length}
              </span>
              <span className={styles.charTotal}>/500</span>
            </div>
          </div>

          {/* Photo Upload (Placeholder) */}
          <div className={styles.photoSection}>
            <label className={styles.label}>Фото
              <span className={styles.optional}>(необязательно)</span>
            </label>
            <button
              type="button"
              className={styles.photoBtn}
              onClick={handlePhotoUpload}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>Добавить фото</span>
            </button>
          </div>

          {/* Submit Button */}
          <div className={styles.submitSection}>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={rating === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner} />
                  Отправка...
                </>
              ) : (
                'Отправить отзыв'
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}