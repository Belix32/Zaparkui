import { useState, useEffect, useCallback } from 'react';
import { getActivePromotions, Promotion } from '../../lib/supabase';
import styles from './PromotionsBanner.module.css';

const AUTO_ROTATE_INTERVAL = 6000; // 6 seconds

export function PromotionsBanner() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadPromotions = async () => {
      try {
        const data = await getActivePromotions();
        setPromotions(data || []);
      } catch (err) {
        console.error('Error loading promotions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPromotions();
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    if (promotions.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, AUTO_ROTATE_INTERVAL);

    return () => clearInterval(timer);
  }, [promotions.length]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % promotions.length);
  }, [promotions.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
  }, [promotions.length]);

  const dismissBanner = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  // Filter out dismissed and loading state
  const visiblePromotions = promotions.filter((p) => !dismissedIds.has(p.id));

  if (loading || visiblePromotions.length === 0) return null;

  // Clamp currentIndex
  const safeIndex = Math.min(currentIndex, visiblePromotions.length - 1);
  const currentPromotion = visiblePromotions[safeIndex];

  if (!currentPromotion) return null;

  // If only one promotion, show it simply
  if (visiblePromotions.length === 1) {
    return (
      <div className={styles.wrapper}>
        <SingleBanner
          promotion={visiblePromotions[0]}
          onDismiss={dismissBanner}
        />
      </div>
    );
  }

  // Multiple promotions - carousel with dots
  return (
    <div className={styles.wrapper}>
      <div className={styles.carousel}>
        <button
          className={styles.arrow}
          onClick={goPrev}
          aria-label="Предыдущая акция"
        >
          ‹
        </button>

        <div className={styles.slideContainer}>
          <BannerCard
            promotion={currentPromotion}
            onDismiss={dismissBanner}
          />
        </div>

        <button
          className={styles.arrow}
          onClick={goNext}
          aria-label="Следующая акция"
        >
          ›
        </button>
      </div>

      <div className={styles.dots}>
        {visiblePromotions.map((_, idx) => (
          <button
            key={idx}
            className={`${styles.dot} ${idx === safeIndex ? styles.dotActive : ''}`}
            onClick={() => goTo(idx)}
            aria-label={`Перейти к акции ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function SingleBanner({
  promotion,
  onDismiss,
}: {
  promotion: Promotion;
  onDismiss: (id: string) => void;
}) {
  return (
    <div className={styles.slideContainer}>
      <BannerCard promotion={promotion} onDismiss={onDismiss} />
    </div>
  );
}

function BannerCard({
  promotion,
  onDismiss,
}: {
  promotion: Promotion;
  onDismiss: (id: string) => void;
}) {
  const bgColor = promotion.bg_color || '#2563eb';
  const textColor = promotion.text_color || '#ffffff';

  const content = (
    <div
      className={styles.banner}
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      <div className={styles.bannerContent}>
        {promotion.image_url && (
          <img
            src={promotion.image_url}
            alt=""
            className={styles.bannerImage}
          />
        )}
        <div className={styles.bannerText}>
          {promotion.title && (
            <span className={styles.bannerTitle}>{promotion.title}</span>
          )}
          {promotion.description && (
            <span className={styles.bannerDesc}>{promotion.description}</span>
          )}
        </div>
        {promotion.link_url && (
          <a
            href={promotion.link_url}
            className={styles.bannerLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: textColor, borderColor: textColor }}
          >
            {promotion.link_text || 'Подробнее'}
          </a>
        )}
      </div>
      <button
        className={styles.closeBtn}
        onClick={() => onDismiss(promotion.id)}
        aria-label="Закрыть"
        style={{ color: textColor }}
      >
        ✕
      </button>
    </div>
  );

  // If there's a link, wrap the whole banner
  if (promotion.link_url) {
    return (
      <a
        href={promotion.link_url}
        className={styles.bannerLinkWrap}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }

  return content;
}
