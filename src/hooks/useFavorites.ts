import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'zaparkyi_favorites';
const MAX_FAVORITES = 50;

export interface FavoriteItem {
  parkingId: string;
  addedAt: string;
}

/**
 * Hook for managing favorites in localStorage
 * P0 feature - Избранное
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  const saveFavorites = useCallback((items: FavoriteItem[]) => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }, []);

  const addFavorite = useCallback((parkingId: string) => {
    setFavorites(prev => {
      // Check if already exists
      if (prev.some(f => f.parkingId === parkingId)) {
        return prev;
      }
      
      // Check max limit
      if (prev.length >= MAX_FAVORITES) {
        console.warn('Maximum favorites limit reached');
        return prev;
      }
      
      const newFavorites = [
        ...prev,
        { parkingId, addedAt: new Date().toISOString() }
      ];
      
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, [saveFavorites]);

  const removeFavorite = useCallback((parkingId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.filter(f => f.parkingId !== parkingId);
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, [saveFavorites]);

  const toggleFavorite = useCallback((parkingId: string) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.parkingId === parkingId);
      
      if (exists) {
        const newFavorites = prev.filter(f => f.parkingId !== parkingId);
        saveFavorites(newFavorites);
        return newFavorites;
      } else {
        // Check max limit
        if (prev.length >= MAX_FAVORITES) {
          console.warn('Maximum favorites limit reached');
          return prev;
        }
        
        const newFavorites = [
          ...prev,
          { parkingId, addedAt: new Date().toISOString() }
        ];
        saveFavorites(newFavorites);
        return newFavorites;
      }
    });
  }, [saveFavorites]);

  const isFavorite = useCallback((parkingId: string) => {
    return favorites.some(f => f.parkingId === parkingId);
  }, [favorites]);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    saveFavorites([]);
  }, [saveFavorites]);

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites,
  };
}