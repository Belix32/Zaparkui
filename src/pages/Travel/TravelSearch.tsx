import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import styles from './TravelSearch.module.css';
import sharedStyles from './Travel.module.css';

interface TravelDestination {
  id: string;
  name: string;
  slug: string;
  image: string;
  region: string;
  is_active: boolean;
  sort_order: number;
}

interface PartnerInfo {
  id: string;
  name: string;
  rating: number;
}

interface PartnerCar {
  id: string;
  partner_id: string;
  brand: string;
  model: string;
  year: number;
  transmission: string;
  seats: number;
  price_per_day: number;
  deposit: number;
  image: string;
  partner: PartnerInfo;
}

const MOCK_DESTINATIONS: TravelDestination[] = [
  { id: 'dest-1', name: 'Сочи', slug: 'sochi', image: '', region: 'Краснодарский край', is_active: true, sort_order: 1 },
  { id: 'dest-2', name: 'Анапа', slug: 'anapa', image: '', region: 'Краснодарский край', is_active: true, sort_order: 2 },
  { id: 'dest-3', name: 'Геленджик', slug: 'gelendzhik', image: '', region: 'Краснодарский край', is_active: true, sort_order: 3 },
];

const MOCK_CARS: PartnerCar[] = [
  { id: 'car-1', partner_id: 'partner-1', brand: 'Hyundai', model: 'Solaris', year: 2023, transmission: 'automatic', seats: 5, price_per_day: 2500, deposit: 10000, image: '', partner: { id: 'partner-1', name: 'АвтоМоре Сочи', rating: 4.5 } },
  { id: 'car-2', partner_id: 'partner-1', brand: 'Kia', model: 'Rio', year: 2023, transmission: 'automatic', seats: 5, price_per_day: 2800, deposit: 10000, image: '', partner: { id: 'partner-1', name: 'АвтоМоре Сочи', rating: 4.5 } },
  { id: 'car-3', partner_id: 'partner-1', brand: 'Toyota', model: 'Camry', year: 2024, transmission: 'automatic', seats: 5, price_per_day: 4500, deposit: 20000, image: '', partner: { id: 'partner-1', name: 'АвтоМоре Сочи', rating: 4.5 } },
  { id: 'car-4', partner_id: 'partner-2', brand: 'Renault', model: 'Duster', year: 2023, transmission: 'manual', seats: 5, price_per_day: 3200, deposit: 15000, image: '', partner: { id: 'partner-2', name: 'Южный Прокат', rating: 4.2 } },
  { id: 'car-5', partner_id: 'partner-2', brand: 'Lada', model: 'Vesta', year: 2024, transmission: 'manual', seats: 5, price_per_day: 2000, deposit: 8000, image: '', partner: { id: 'partner-2', name: 'Южный Прокат', rating: 4.2 } },
  { id: 'car-6', partner_id: 'partner-2', brand: 'Nissan', model: 'Qashqai', year: 2023, transmission: 'automatic', seats: 5, price_per_day: 3800, deposit: 18000, image: '', partner: { id: 'partner-2', name: 'Южный Прокат', rating: 4.2 } },
];

export function TravelSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialDestination = searchParams.get('destination') || '';

  const [destinations] = useState<TravelDestination[]>(MOCK_DESTINATIONS);
  const [selectedDestination, setSelectedDestination] = useState(initialDestination);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transmission, setTransmission] = useState('');
  const [seats, setSeats] = useState('');
  const [results, setResults] = useState<PartnerCar[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Set default dates on mount
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const handleSearch = () => {
    if (!selectedDestination) return;
    setLoading(true);
    setHasSearched(true);

    // Simulate API call with a brief delay
    setTimeout(() => {
      let filtered = [...MOCK_CARS];

      if (transmission) {
        filtered = filtered.filter(c => c.transmission === transmission);
      }
      if (seats) {
        filtered = filtered.filter(c => c.seats >= parseInt(seats, 10));
      }

      setResults(filtered);
      setLoading(false);
    }, 400);
  };

  // Auto-search if destination is in URL params
  useEffect(() => {
    if (initialDestination) {
      setSelectedDestination(initialDestination);
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDestination]);

  const getDestinationName = (slug: string): string => {
    const dest = destinations.find(d => d.slug === slug);
    return dest?.name || slug;
  };

  const transmissionLabel = (t: string): string => {
    return t === 'automatic' ? 'Автомат' : 'Механика';
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderContent}>
          <h1 className={styles.pageTitle}>Поиск автомобиля</h1>
          <p className={styles.pageSubtitle}>
            Найдите подходящий автомобиль на курорте
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filtersInner}>
          {/* Destination selector */}
          <div className={styles.destinationSelector}>
            {destinations.map((dest) => (
              <button
                key={dest.id}
                className={`${styles.destinationOption} ${
                  selectedDestination === dest.slug ? styles.destinationOptionActive : ''
                }`}
                onClick={() => setSelectedDestination(dest.slug)}
                type="button"
              >
                <span className={styles.destinationIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                {dest.name}
              </button>
            ))}
          </div>

          <div className={styles.filterGrid}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Дата заезда</label>
              <input
                type="date"
                className={styles.filterInput}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Дата выезда</label>
              <input
                type="date"
                className={styles.filterInput}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Коробка передач</label>
              <select
                className={styles.filterSelect}
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
              >
                <option value="">Все</option>
                <option value="automatic">Автомат</option>
                <option value="manual">Механика</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Кол-во мест</label>
              <select
                className={styles.filterSelect}
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
              >
                <option value="">Любое</option>
                <option value="4">от 4</option>
                <option value="5">от 5</option>
                <option value="7">от 7</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>&nbsp;</label>
              <Button
                variant="primary"
                className={styles.searchBtn}
                onClick={handleSearch}
                disabled={!selectedDestination}
              >
                Найти
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className={styles.results}>
        {loading ? (
          <div className={sharedStyles.loading}>
            <div className={sharedStyles.spinner} />
            <p>Поиск автомобилей...</p>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className={sharedStyles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <h2 className={styles.emptyTitle}>Нет подходящих автомобилей</h2>
            <p className={styles.emptyText}>
              Попробуйте изменить параметры поиска или выберите другое направление
            </p>
            <Button variant="primary" onClick={() => { setTransmission(''); setSeats(''); }}>
              Сбросить фильтры
            </Button>
          </div>
        ) : hasSearched ? (
          <>
            <div className={styles.resultsHeader}>
              <div className={styles.resultsCount}>
                Найдено {results.length} автомобил{results.length === 1 ? 'ь' : results.length < 5 ? 'я' : 'ей'} в {getDestinationName(selectedDestination)}
              </div>
              <button
                type="button"
                className={styles.showMapBtn}
                onClick={() => navigate('/travel/map')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                Показать на карте
              </button>
            </div>
            <div className={styles.resultsGrid}>
              {results.map((car) => (
                <div key={car.id} className={styles.carCard}>
                  <div className={styles.carImage}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="1" y="3" width="15" height="13" rx="2" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </div>
                  <div className={styles.carInfo}>
                    <div className={styles.carHeader}>
                      <h3 className={styles.carName}>{car.brand} {car.model}</h3>
                      <span className={styles.carYear}>{car.year}</span>
                    </div>
                    <div className={styles.carSpecs}>
                      <span className={styles.carSpec}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                        {transmissionLabel(car.transmission)}
                      </span>
                      <span className={styles.carSpec}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        {car.seats} мест
                      </span>
                    </div>
                    <div className={styles.carPartner}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      {car.partner.name}
                      <span className={styles.partnerRating}>
                        ★ {car.partner.rating}
                      </span>
                    </div>
                    <div className={styles.carFooter}>
                      <div className={styles.carPrice}>
                        <span className={styles.carPriceValue}>
                          {car.price_per_day.toLocaleString('ru-RU')} ₽
                        </span>
                        <span className={styles.carPriceLabel}>в сутки</span>
                        <span className={styles.carDeposit}>
                          Залог: {car.deposit.toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => {
                          const params = new URLSearchParams({
                            start: startDate,
                            end: endDate,
                            destination: selectedDestination,
                          });
                          navigate(`/travel/booking/${car.id}?${params.toString()}`);
                        }}
                      >
                        Забронировать
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={sharedStyles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h2 className={styles.emptyTitle}>Выберите направление</h2>
            <p className={styles.emptyText}>
              Укажите курорт, даты поездки и нажмите «Найти»
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TravelSearch;
