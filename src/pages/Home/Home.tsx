import { Link } from 'react-router-dom';
import { Button, ParkingCard } from '../../components';
import { parkings } from '../../data/parkings';
import styles from './Home.module.css';

export function Home() {
  const popularParkings = parkings.slice(0, 3);

  return (
    <>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroPattern} />
        <div className="container">
          <div className={styles.heroInner}>
            <div className={styles.heroContent}>
              <span className={styles.badge}>Запаркуй</span>
              <h1 className={styles.title}>
                Парковки в&nbsp;жилых
                <br />
                <span className={styles.titleAccent}>комплексах</span>
              </h1>
              <p className={styles.subtitle}>
                Арендуйте или сдавайте парковочные места напрямую.
                Без посредников, с гарантией безопасности сделки.
              </p>
              <div className={styles.actions}>
                <Link to="/catalog" className={styles.actionLink}>
                  <Button variant="primary" size="large">Найти парковку</Button>
                </Link>
                <Link to="/register" className={styles.actionLink}>
                  <Button variant="secondary" size="large">Сдать место</Button>
                </Link>
              </div>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>500+</span>
                <span className={styles.statLabel}>парковок</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>120</span>
                <span className={styles.statLabel}>ЖК</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>98%</span>
                <span className={styles.statLabel}>довольных</span>
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
                Найдите парковку в своём ЖК за несколько минут. Фильтры по локации, цене и типу.
              </p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Безопасность</h3>
              <p className={styles.featureDesc}>
                Верификация пользователей. Все сделки защищены. Проверка объектов перед размещением.
              </p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Прямые сделки</h3>
              <p className={styles.featureDesc}>
                Работаем без посредников — поэтому цены ниже рыночных на 20-30%.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Section */}
      <section className={styles.popular}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Популярные парковки</h2>
            <p className={styles.sectionSubtitle}>
              Самые востребованные места в жилых комплексах
            </p>
          </div>
          <div className={styles.popularGrid}>
            {popularParkings.map((parking) => (
              <ParkingCard key={parking.id} parking={parking} />
            ))}
          </div>
          <div className={styles.popularAction}>
            <Link to="/catalog">
              <Button variant="secondary">Все парковки</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Как это работает</h2>
          </div>
          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>01</div>
              <h3 className={styles.stepTitle}>Поиск</h3>
              <p className={styles.stepDesc}>Выберите ЖК и тип парковки в каталоге</p>
            </div>
            <div className={styles.stepConnector} />
            <div className={styles.step}>
              <div className={styles.stepNumber}>02</div>
              <h3 className={styles.stepTitle}>Бронирование</h3>
              <p className={styles.stepDesc}>Оставьте заявку на аренду или покупку</p>
            </div>
            <div className={styles.stepConnector} />
            <div className={styles.step}>
              <div className={styles.stepNumber}>03</div>
              <h3 className={styles.stepTitle}>Сделка</h3>
              <p className={styles.stepDesc}>Встретитесь с собственником и оформите договор</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaInner}>
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>Нужна парковка?</h2>
              <p className={styles.ctaText}>
                Присоединяйтесь к 10 000+ пользователей, которые нашли идеальное место через Запаркуй
              </p>
            </div>
            <div className={styles.ctaActions}>
              <Link to="/catalog">
                <Button variant="accent" size="large">Выбрать парковку</Button>
              </Link>
              <span className={styles.ctaNote}>Это бесплатно</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}