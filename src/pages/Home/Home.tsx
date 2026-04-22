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
        <div className={styles.heroBg} />
        <div className={styles.heroGrid} />
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              ✨ Запаркуй — парковки в каждом ЖК
            </div>
            <h1 className={styles.title}>
              Найдите идеальное<br />
              <span className={styles.titleAccent}>парковочное место</span>
            </h1>
            <p className={styles.subtitle}>
              Арендуйте или сдавайте парковочные места в жилых комплексах. 
              Без посредников, быстро и с гарантией безопасности сделки.
            </p>
            <div className={styles.actions}>
              <Link to="/catalog">
                <Button variant="primary" size="large">Найти парковку</Button>
              </Link>
              <Link to="/register">
                <Button variant="secondary" size="large">Сдать место</Button>
              </Link>
            </div>
          </div>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>500+</div>
            <div className={styles.statLabel}>Парковок</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>120</div>
            <div className={styles.statLabel}>ЖК</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>98%</div>
            <div className={styles.statLabel}>Довольных</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`section ${styles.features}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={`title-h2 ${styles.sectionTitle}`}>Почему выбирают нас</h2>
            <p className={styles.sectionSubtitle}>
              Мы делаем поиск и аренду парковок простым и безопасным
            </p>
          </div>
          <div className={styles.featuresGrid}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🔍</div>
              <h3 className={styles.featureTitle}>Быстрый поиск</h3>
              <p className={styles.featureDesc}>
                Найдите парковку в своём ЖК за несколько минут с помощью умного поиска
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🛡️</div>
              <h3 className={styles.featureTitle}>Безопасность</h3>
              <p className={styles.featureDesc}>
                Все сделки защищены. Верификация пользователей и проверка объектов
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>💰</div>
              <h3 className={styles.featureTitle}>Выгодные цены</h3>
              <p className={styles.featureDesc}>
                Работаем напрямую без посредников — поэтому цены ниже рыночных
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Section */}
      <section className="section">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={`title-h2 ${styles.sectionTitle}`}>Популярные парковки</h2>
            <p className={styles.sectionSubtitle}>
              Самые востребованные парковочные места в жилых комплексах
            </p>
          </div>
          <div className={styles.popularGrid}>
            {popularParkings.map((parking) => (
              <ParkingCard key={parking.id} parking={parking} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Link to="/catalog">
              <Button variant="secondary">Смотреть все</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`section ${styles.cta}`}>
        <div className="container">
          <div className={styles.ctaContent}>
            <h2 className={`title-h2 ${styles.sectionTitle}`}>Готовы найти парковку?</h2>
            <p className={styles.ctaText}>
              Присоединяйтесь к тысячам пользователей, которые уже нашли 
              идеальное парковочное место через Запаркуй
            </p>
            <Link to="/catalog">
              <Button variant="accent" size="large">Выбрать парковку</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}