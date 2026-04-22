import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerInner}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <img src="/vite.svg" alt="Logo" className={styles.logoIcon} />
              <span>Запаркуй</span>
            </div>
            <p className={styles.description}>
              Найдите идеальное парковочное место в вашем жилом комплексе. 
              Без посредников, быстро и надежно.
            </p>
          </div>

          <div className={styles.column}>
            <h4>Навигация</h4>
            <ul>
              <li><Link to="/">Главная</Link></li>
              <li><Link to="/catalog">Каталог</Link></li>
              <li><Link to="/about">О нас</Link></li>
              <li><Link to="/contacts">Контакты</Link></li>
            </ul>
          </div>

          <div className={styles.column}>
            <h4>Для арендаторов</h4>
            <ul>
              <li><Link to="/catalog">Найти парковку</Link></li>
              <li><Link to="/register">Зарегистрироваться</Link></li>
              <li><Link to="/faq">Вопросы</Link></li>
            </ul>
          </div>

          <div className={styles.column}>
            <h4>Для собственников</h4>
            <ul>
              <li><Link to="/register">Сдать место</Link></li>
              <li><Link to="/how-it-works">Как это работает</Link></li>
              <li><Link to="/support">Поддержка</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>© 2024 Запаркуй. Все права защищены.</p>
          <div className={styles.socials}>
            <a href="#" aria-label="Telegram">📱</a>
            <a href="#" aria-label="WhatsApp">💬</a>
            <a href="#" aria-label="VK">📱</a>
          </div>
        </div>
      </div>
    </footer>
  );
}