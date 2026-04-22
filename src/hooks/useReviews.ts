import { useState, useEffect, useCallback } from 'react';

const REVIEWS_KEY = 'zaparkyi_reviews';
const MAX_REVIEWS = 100;

export interface LocalReview {
  id: string;
  parkingId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

/**
 * Hook for managing reviews/ratings in localStorage
 * P2 feature - Рейтинги и отзывы
 */
export function useReviews(parkingId: string) {
  const [reviews, setReviews] = useState<LocalReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);

  // Load reviews from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(REVIEWS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const parkingReviews = parsed.filter(
            (r: LocalReview) => r.parkingId === parkingId
          );
          setReviews(parkingReviews);
          
          // Calculate average
          if (parkingReviews.length > 0) {
            const sum = parkingReviews.reduce(
              (acc: number, r: LocalReview) => acc + r.rating, 0
            );
            setAverageRating(sum / parkingReviews.length);
            setTotalReviews(parkingReviews.length);
          }
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [parkingId]);

  // Save reviews to localStorage
  const saveReviews = useCallback((items: LocalReview[]) => {
    try {
      const stored = localStorage.getItem(REVIEWS_KEY);
      let allReviews: LocalReview[] = [];
      
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Remove reviews for this parking
          allReviews = parsed.filter(
            (r: LocalReview) => r.parkingId !== parkingId
          );
        }
      }
      
      // Add new reviews
      const newReviews = [...allReviews, ...items];
      
      // Check max limit
      if (newReviews.length > MAX_REVIEWS) {
        newReviews.splice(0, newReviews.length - MAX_REVIEWS);
      }
      
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(newReviews));
    } catch (error) {
      console.error('Error saving reviews:', error);
    }
  }, [parkingId]);

  const addReview = useCallback((rating: number, comment: string) => {
    if (rating < 1 || rating > 5) {
      console.error('Invalid rating');
      return;
    }
    
    const newReview: LocalReview = {
      id: `review-${Date.now()}`,
      parkingId,
      rating,
      comment: comment.trim().substring(0, 500),
      createdAt: new Date().toISOString(),
    };
    
    const newReviews = [...reviews, newReview];
    setReviews(newReviews);
    saveReviews(newReviews);
    
    // Update average
    const sum = newReviews.reduce((acc, r) => acc + r.rating, 0);
    setAverageRating(sum / newReviews.length);
    setTotalReviews(newReviews.length);
  }, [parkingId, reviews, saveReviews]);

  const removeReview = useCallback((reviewId: string) => {
    const newReviews = reviews.filter(r => r.id !== reviewId);
    setReviews(newReviews);
    saveReviews(newReviews);
    
    // Update average
    if (newReviews.length > 0) {
      const sum = newReviews.reduce((acc, r) => acc + r.rating, 0);
      setAverageRating(sum / newReviews.length);
      setTotalReviews(newReviews.length);
    } else {
      setAverageRating(0);
      setTotalReviews(0);
    }
  }, [reviews, saveReviews]);

  const getUserReview = useCallback(() => {
    // For demo, return latest review or null
    return reviews[reviews.length - 1] || null;
  }, [reviews]);

  return {
    reviews,
    loading,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    addReview,
    removeReview,
    getUserReview,
  };
}