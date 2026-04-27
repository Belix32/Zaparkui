import { useState, useEffect } from 'react';
import { AdminLayout } from './components/AdminLayout';
import './AdminSettings.css';

interface Settings {
  // Общие настройки
  siteName: string;
  contactEmail: string;
  supportPhone: string;

  // Настройки бронирований
  minBookingDuration: number;
  maxBookingDurationDays: number;
  allowInstantBooking: boolean;
  requireApprovalForBookings: boolean;

  // Настройки цен
  platformCommission: number;
  minPricePerHour: number;
  currency: 'RUB' | 'USD' | 'EUR';

  // Модерация
  requireReviewApproval: boolean;
  blockedWords: string;
  autoRejectReviews: boolean;
}

const defaultSettings: Settings = {
  siteName: 'Zaparkyi',
  contactEmail: '',
  supportPhone: '',
  minBookingDuration: 1,
  maxBookingDurationDays: 30,
  allowInstantBooking: true,
  requireApprovalForBookings: false,
  platformCommission: 10,
  minPricePerHour: 50,
  currency: 'RUB',
  requireReviewApproval: true,
  blockedWords: '',
  autoRejectReviews: true,
};

export function AdminSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const stored = localStorage.getItem('zaparkyi_settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
  };

  const saveSettings = (newSettings: Settings) => {
    localStorage.setItem('zaparkyi_settings', JSON.stringify(newSettings));
    localStorage.setItem('zaparkyi_site_name', newSettings.siteName);
    setSettings(newSettings);
    showToastMessage('Настройки сохранены');
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleChange = (field: keyof Settings, value: Settings[keyof Settings]) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleClearData = async (type: 'parkings' | 'bookings' | 'reviews' | 'all') => {
    const confirmText = prompt(`Для подтверждения введите "DELETE":`);
    if (confirmText !== 'DELETE') {
      showToastMessage('Подтверждение отменено');
      return;
    }

    const storageKeys: Record<string, string> = {
      parkings: 'zaparkyi_parkings',
      bookings: 'zaparkyi_bookings',
      reviews: 'zaparkyi_reviews',
      all: 'zaparkyi_all_data',
    };

    if (type === 'all') {
      localStorage.removeItem('zaparkyi_parkings');
      localStorage.removeItem('zaparkyi_bookings');
      localStorage.removeItem('zaparkyi_reviews');
      localStorage.removeItem('zaparkyi_users');
      localStorage.removeItem('zaparkyi_admin_users');
    } else {
      localStorage.removeItem(storageKeys[type]);
    }

    showToastMessage(`Все ${type === 'all' ? 'данные очищены' : type === 'parkings' ? 'парковки' : type === 'bookings' ? 'бронирования' : 'отзывы'} удалены`);
  };

  return (
    <AdminLayout>
      <div className="admin-settings">
        {/* Общие настройки */}
        <div className="admin-card">
          <h3>⚙️ Общие настройки</h3>
          <div className="admin-settings-grid">
            <div className="admin-settings-field">
              <label>Название сайта</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => handleChange('siteName', e.target.value)}
                placeholder="Zaparkyi"
              />
            </div>
            <div className="admin-settings-field">
              <label>Контактный email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                placeholder="contact@example.com"
              />
            </div>
            <div className="admin-settings-field">
              <label>Телефон поддержки</label>
              <input
                type="tel"
                value={settings.supportPhone}
                onChange={(e) => handleChange('supportPhone', e.target.value)}
                placeholder="+7 (999) 123-45-67"
              />
            </div>
          </div>
        </div>

        {/* Настройки бронирований */}
        <div className="admin-card">
          <h3>📅 Настройки бронирований</h3>
          <div className="admin-settings-grid">
            <div className="admin-settings-field">
              <label>Минимальная длительность (часы)</label>
              <input
                type="number"
                min="1"
                max="24"
                value={settings.minBookingDuration}
                onChange={(e) => handleChange('minBookingDuration', parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="admin-settings-field">
              <label>Максимальная длительность (дни)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={settings.maxBookingDurationDays}
                onChange={(e) => handleChange('maxBookingDurationDays', parseInt(e.target.value) || 30)}
              />
            </div>
            <div className="admin-settings-field admin-settings-field-inline">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.allowInstantBooking}
                  onChange={(e) => handleChange('allowInstantBooking', e.target.checked)}
                />
                <span>Мгновенное бронирование</span>
              </label>
            </div>
            <div className="admin-settings-field admin-settings-field-inline">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.requireApprovalForBookings}
                  onChange={(e) => handleChange('requireApprovalForBookings', e.target.checked)}
                />
                <span>Требовать одобрение бронирований</span>
              </label>
            </div>
          </div>
        </div>

        {/* Настройки цен */}
        <div className="admin-card">
          <h3>💰 Настройки цен</h3>
          <div className="admin-settings-grid">
            <div className="admin-settings-field">
              <label>Комиссия платформы (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.platformCommission}
                onChange={(e) => handleChange('platformCommission', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="admin-settings-field">
              <label>Минимальная цена за час</label>
              <input
                type="number"
                min="0"
                value={settings.minPricePerHour}
                onChange={(e) => handleChange('minPricePerHour', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="admin-settings-field">
              <label>Валюта</label>
              <select
                value={settings.currency}
                onChange={(e) => handleChange('currency', e.target.value as 'RUB' | 'USD' | 'EUR')}
              >
                <option value="RUB">RUB (Рубль)</option>
                <option value="USD">USD (Доллар)</option>
                <option value="EUR">EUR (Евро)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Модерация */}
        <div className="admin-card">
          <h3>🛡️ Модерация</h3>
          <div className="admin-settings-grid">
            <div className="admin-settings-field admin-settings-field-inline">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.requireReviewApproval}
                  onChange={(e) => handleChange('requireReviewApproval', e.target.checked)}
                />
                <span>Требовать одобрение отзывов</span>
              </label>
            </div>
            <div className="admin-settings-field admin-settings-field-inline">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.autoRejectReviews}
                  onChange={(e) => handleChange('autoRejectReviews', e.target.checked)}
                />
                <span>Авто-отклонение отзывов с запрещёнными словами</span>
              </label>
            </div>
            <div className="admin-settings-field admin-settings-field-full">
              <label>Запрещённые слова (через запятую)</label>
              <textarea
                value={settings.blockedWords}
                onChange={(e) => handleChange('blockedWords', e.target.value)}
                placeholder="спам, реклама, мошенничество"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Опасная зона */}
        <div className="admin-card admin-card-danger">
          <h3>⚠️ Опасная зона</h3>
          <p className="admin-danger-warning">
            Внимание! Эти действия необратимы. Все данные будут удалены безвозвратно.
          </p>
          <div className="admin-danger-buttons">
            <button
              className="admin-danger-btn"
              onClick={() => handleClearData('parkings')}
            >
              🗑️ Очистить все парковки
            </button>
            <button
              className="admin-danger-btn"
              onClick={() => handleClearData('bookings')}
            >
              🗑️ Очистить все бронирования
            </button>
            <button
              className="admin-danger-btn"
              onClick={() => handleClearData('reviews')}
            >
              🗑️ Очистить все отзывы
            </button>
            <button
              className="admin-danger-btn admin-danger-btn-all"
              onClick={() => handleClearData('all')}
            >
              💀 Очистить все данные
            </button>
          </div>
        </div>

        {/* Toast */}
        {showToast && (
          <div className="admin-toast">
            {toastMessage}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}