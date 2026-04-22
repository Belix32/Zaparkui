import { useState, useEffect, useCallback } from 'react';

const SEARCH_HISTORY_KEY = 'zaparkyi_search_history';
const MAX_HISTORY = 20;

export interface SearchHistoryItem {
  query: string;
  filters: {
    price?: string;
    district?: string;
    metro?: string;
    parkingType?: string;
  };
  timestamp: string;
}

/**
 * Hook for managing search history in localStorage
 * P1 feature - История поиска
 */
export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save history to localStorage whenever it changes
  const saveHistory = useCallback((items: SearchHistoryItem[]) => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }, []);

  const addToHistory = useCallback((
    query: string,
    filters: SearchHistoryItem['filters']
  ) => {
    if (!query.trim() && !Object.values(filters).some(v => v)) {
      return; // Don't save empty searches
    }
    
    setHistory(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(
        item => item.query !== query || JSON.stringify(item.filters) !== JSON.stringify(filters)
      );
      
      const newHistory = [
        {
          query,
          filters,
          timestamp: new Date().toISOString(),
        },
        ...filtered,
      ].slice(0, MAX_HISTORY);
      
      saveHistory(newHistory);
      return newHistory;
    });
  }, [saveHistory]);

  const removeFromHistory = useCallback((index: number) => {
    setHistory(prev => {
      const newHistory = [...prev];
      newHistory.splice(index, 1);
      saveHistory(newHistory);
      return newHistory;
    });
  }, [saveHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, [saveHistory]);

  return {
    history,
    loading,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}