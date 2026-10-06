import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, ParkingCard } from '../../components';
import { parkings } from '../../data/parkings';
import styles from './Home.module.css';

export function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const popularParkings = parkings.slice(0, 3);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/catalog');
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroPattern} />
        <div className="container">
          <div className={styles.heroInner}>
            <div className={styles.heroContent}>
              <span className={styles.badge}>
                ✨ Надежная аренда машиномест
              </span>
              <h1 className={styles.title}>
                Парковки в&nbsp;жилых
                <br />
                <span className={styles.titleAccent}>комплексах</span>
              </h1>
              <p className={styles.subtitle}>
                Арендуйте или сдавайте парковочные места напрямую у собственников. 
                Без скрытых комиссий и с гарантией безопасности сделки.
              </p>

              {/* Interactive Search Bar */}
              <form onSubmit={handleSearch} className={styles.searchBox}>
                <div className={styles.searchInputWrapper}>
                  <svg 
                    className={styles.searchIcon} 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Введите ЖК, улицу или метро..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button type="submit" className={styles.searchButton}>
                  Найти место
                </button>
              </form>
            </div>

            {/* Stats Bar */}
            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>500+</span>
                <span className={styles.statLabel}>парковок в базе</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>120</span>
                <span className={styles.statLabel}>жилых комплексов</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>98%</span>
                <span className={styles.statLabel}>довольных клиентов</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className="container">
          <div className={styles.featuresGrid}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Умный поиск</h3>
              <p className={styles.featureDesc}>
                Мгновенно находите парковку в своем или соседнем ЖК. Удобные фильтры по типу, этажу и наличию зарядки для электромобилей.
              </p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Безопасные сделки</h3>
              <p className={styles.featureDesc}>
                Проверенные собственники и подтвержденные документы на машиноместа. Полная прозрачность на каждом этапе аренды.
              </p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Без переплат</h3>
              <p className={styles.featureDesc}>
                Аренда напрямую от владельцев по справедливой рыночной цене без скрытых агентских комиссий и наценок.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Section */}
      <section className={styles.popular}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Популярные предложения</h2>
            <p className={styles.sectionSubtitle}>
              Самые востребованные и выгодные места в жилых комплексах
            </p>
          </div>
          <div className={styles.popularGrid}>
            {popularParkings.map((parking) => (
              <ParkingCard key={parking.id} parking={parking} />
            ))}
          </div>
          <div className={styles.popularAction}>
            <Link to="/catalog">
              <Button variant="secondary" size="large">Посмотреть все парковки</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Как это работает</h2>
            <p className={styles.sectionSubtitle}>Всего три простых шага для аренды нужного места</p>
          </div>
          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>01</div>
              <h3 className={styles.stepTitle}>Поиск</h3>
              <p className={styles.stepDesc}>Найдите подходящий ЖК, тип парковки и удобную цену в каталоге или на интерактивной карте.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>02</div>
              <h3 className={styles.stepTitle}>Бронирование</h3>
              <p className={styles.stepDesc}>Выберите даты или помесячную аренду и отправьте заявку на бронирование в пару кликов.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>03</div>
              <h3 className={styles.stepTitle}>Заезд</h3>
              <p className={styles.stepDesc}>Получите пропуск/ключи и начните парковать автомобиль комфортно и безопасно.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaInner}>
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>Есть свободное машиноместо?</h2>
              <p className={styles.ctaText}>
                Сдавайте его жителям вашего дома и получайте пассивный доход каждый месяц без лишних хлопот.
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Link to="/register">
                <Button variant="accent" size="large">Сдать парковку</Button>
              </Link>
              <span className={styles.ctaNote}>Бесплатное размещение</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
