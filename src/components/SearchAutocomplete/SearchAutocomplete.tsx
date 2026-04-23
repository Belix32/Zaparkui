import { useState, useCallback, useEffect, useRef } from 'react';
import { parkings as staticParkings } from '../../data/parkings';
import styles from './SearchAutocomplete.module.css';

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

interface SearchResult {
  id: string;
  title: string;
  address: string;
  price: number;
  parkingType?: string;
  district?: string;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * SearchAutocomplete component with debounced search
 * P0 feature - Поиск и фильтрация
 */
export function SearchAutocomplete({
  value,
  onChange,
  placeholder = 'Поиск по ЖК или адресу...',
  autoFocus = false,
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce query by 300ms
  const debouncedQuery = useDebounce(query, 300);

  // Search through parkings
  const searchParkings = useCallback((searchQuery: string): SearchResult[] => {
    if (!searchQuery.trim()) return [];

    const lowerQuery = searchQuery.toLowerCase();

    return staticParkings
      .filter(
        (p) =>
          p.title.toLowerCase().includes(lowerQuery) ||
          p.address.toLowerCase().includes(lowerQuery) ||
          p.district?.toLowerCase().includes(lowerQuery) ||
          p.metro?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 8)
      .map((p) => ({
        id: p.id,
        title: p.title,
        address: p.address,
        price: p.price,
        parkingType: p.parkingType,
        district: p.district || '',
      }));
  }, []);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      setIsLoading(true);
      // Simulate async search (in real app, this would call Supabase)
      const searchResults = searchParkings(debouncedQuery);
      setResults(searchResults);
      setIsOpen(true);
      setIsLoading(false);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [debouncedQuery, searchParkings]);

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setQuery(newValue);
      onChange(newValue);
      setActiveIndex(-1);
    },
    [onChange]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || results.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < results.length) {
            const selected = results[activeIndex];
            setQuery(selected.title);
            onChange(selected.title);
            setIsOpen(false);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setActiveIndex(-1);
          break;
      }
    },
    [isOpen, results, activeIndex, onChange]
  );

  // Handle result selection
  const handleSelect = useCallback(
    (result: SearchResult) => {
      setQuery(result.title);
      onChange(result.title);
      setIsOpen(false);
      setActiveIndex(-1);
    },
    [onChange]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Highlight matching text
  const highlightMatch = (text: string, searchQuery: string): React.ReactNode => {
    if (!searchQuery.trim()) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return text;

    return (
      <>
        {text.slice(0, index)}
        <span className={styles.highlight}>
          {text.slice(index, index + searchQuery.length)}
        </span>
        {text.slice(index + searchQuery.length)}
      </>
    );
  };

  // Get parking type label
  const getParkingTypeLabel = (type: string): string => {
    const typeLabels: Record<string, string> = {
      ground: 'Открытая',
      underground: 'Подземная',
      roof: 'Крышная',
      covered: 'Крытая',
    };
    return typeLabels[type] || type;
  };

  return (
    <div className={styles.searchWrapper}>
      <svg
        className={styles.searchIcon}
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (results.length > 0) {
            setIsOpen(true);
          }
        }}
        autoFocus={autoFocus}
        autoComplete="off"
        aria-expanded={isOpen}
        aria-controls="search-results"
        role="combobox"
      />

      {isOpen && (
        <div
          ref={dropdownRef}
          className={styles.dropdown}
          id="search-results"
          role="listbox"
        >
          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
            </div>
          ) : results.length > 0 ? (
            results.map((result, index) => (
              <div
                key={result.id}
                className={`${styles.dropdownItem} ${
                  index === activeIndex ? styles.active : ''
                }`}
                onClick={() => handleSelect(result)}
                role="option"
                aria-selected={index === activeIndex}
              >
                <div className={styles.dropdownIcon}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className={styles.dropdownContent}>
                  <div className={styles.dropdownTitle}>
                    {highlightMatch(result.title, query)}
                  </div>
                  <div className={styles.dropdownAddress}>
                    {highlightMatch(result.address, query)}
                  </div>
                  <div className={styles.dropdownMeta}>
                    <span className={styles.dropdownBadge}>
                      {getParkingTypeLabel(result.parkingType || '')}
                    </span>
                    {result.district && (
                      <span className={styles.dropdownBadge}>
                        {result.district}
                      </span>
                    )}
                    <span className={styles.dropdownPrice}>
                      {result.price.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : query.trim() ? (
            <div className={styles.empty}>Ничего не найдено</div>
          ) : null}
        </div>
      )}
    </div>
  );
}