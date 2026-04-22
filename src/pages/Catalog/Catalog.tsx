import { useState } from 'react';
import { ParkingCard } from '../../components';
import { parkings } from '../../data/parkings';
import styles from './Catalog.module.css';

export function Catalog() {
  const [search, setSearch] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');

  const filteredParkings = parkings.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase());
    const matchesPrice = priceFilter === 'all' ||
      (priceFilter === 'low' && p.price < 8000) ||
      (priceFilter === 'medium' && p.price >= 8000 && p.price < 12000) ||
      (priceFilter === 'high' && p.price >= 12000);
    return matchesSearch && matchesPrice;
  });

  return (
    <section className={styles.catalog}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={`title-h1 ${styles.title}`}>Доступные парковки</h1>
          <p className={styles.subtitle}>Найдите идеальное парковочное место в вашем ЖК</p>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className={styles.search}
              placeholder="Поиск по ЖК или адресу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className={styles.filterSelect}
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
          >
            <option value="all">Любая цена</option>
            <option value="low">До 8 000 ₽</option>
            <option value="medium">8 000 - 12 000 ₽</option>
            <option value="high">От 12 000 ₽</option>
          </select>
        </div>

        <div className={styles.grid}>
          {filteredParkings.length > 0 ? (
            filteredParkings.map((parking) => (
              <ParkingCard key={parking.id} parking={parking} />
            ))
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🔍</div>
              <p>Парковки не найдены</p>
              <p>Попробуйте изменить параметры поиска</p>
            </div>
          )}
        </div>

        {filteredParkings.length > 0 && (
          <div className={styles.pagination}>
            <button className={`${styles.pageButton} ${styles.pageButtonActive}`}>1</button>
            <button className={styles.pageButton}>2</button>
            <button className={styles.pageButton}>3</button>
          </div>
        )}
      </div>
    </section>
  );
}