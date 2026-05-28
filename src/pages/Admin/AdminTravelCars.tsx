import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayout } from './components/AdminLayout';
import styles from './AdminTravel.module.css';
import type { PartnerCar, RentalPartner, PartnerLocation } from '../../lib/travel/types';

// Mock partners for partner_id select
const MOCK_PARTNERS: RentalPartner[] = [
  { id: 'p1', name: 'Авангард-Авто', slug: 'avangard-avto', description: null, logo: null, phone: null, email: null, website: null, is_active: true, commission_rate: 15, rating: 4.5, created_at: '', updated_at: '' },
  { id: 'p2', name: 'Юг-Авто', slug: 'yug-avto', description: null, logo: null, phone: null, email: null, website: null, is_active: true, commission_rate: 12, rating: 4.2, created_at: '', updated_at: '' },
  { id: 'p3', name: 'Black Sea Rent', slug: 'black-sea-rent', description: null, logo: null, phone: null, email: null, website: null, is_active: true, commission_rate: 20, rating: 4.8, created_at: '', updated_at: '' },
  { id: 'p4', name: 'Море-Авто', slug: 'more-avto', description: null, logo: null, phone: null, email: null, website: null, is_active: true, commission_rate: 10, rating: 3.9, created_at: '', updated_at: '' },
];

// Mock locations for location_id select
const MOCK_LOCATIONS: PartnerLocation[] = [
  { id: 'l1', partner_id: 'p1', destination_id: 'd1', name: 'Сочи Центр', address: 'ул. Ленина, 1', latitude: null, longitude: null, phone: null, has_storage: true, has_rental: true, created_at: '' },
  { id: 'l2', partner_id: 'p2', destination_id: 'd2', name: 'Анапа Вокзал', address: 'ул. Привокзальная, 5', latitude: null, longitude: null, phone: null, has_storage: true, has_rental: true, created_at: '' },
  { id: 'l3', partner_id: 'p1', destination_id: 'd3', name: 'Геленджик Центр', address: 'ул. Курортная, 10', latitude: null, longitude: null, phone: null, has_storage: false, has_rental: true, created_at: '' },
  { id: 'l4', partner_id: 'p3', destination_id: 'd1', name: 'Сочи Аэропорт', address: 'Аэропорт Сочи, терминал B', latitude: null, longitude: null, phone: null, has_storage: true, has_rental: true, created_at: '' },
];

const MOCK_CARS: PartnerCar[] = [
  { id: 'c1', partner_id: 'p1', location_id: 'l1', brand: 'Hyundai', model: 'Solaris', year: 2023, color: 'Белый', license_plate: 'А123ВВ', transmission: 'automatic', fuel_type: 'gasoline', seats: 5, price_per_day: 2500, deposit: 10000, image: null, images: [], description: null, is_available: true, is_active: true, created_at: '2024-01-20T10:00:00Z', updated_at: '' },
  { id: 'c2', partner_id: 'p1', location_id: 'l1', brand: 'Kia', model: 'Rio', year: 2024, color: 'Синий', license_plate: 'А456ВВ', transmission: 'automatic', fuel_type: 'gasoline', seats: 5, price_per_day: 2800, deposit: 12000, image: null, images: [], description: null, is_available: true, is_active: true, created_at: '2024-02-01T14:30:00Z', updated_at: '' },
  { id: 'c3', partner_id: 'p2', location_id: 'l2', brand: 'Lada', model: 'Vesta', year: 2023, color: 'Чёрный', license_plate: 'В789СС', transmission: 'manual', fuel_type: 'gasoline', seats: 5, price_per_day: 1800, deposit: 8000, image: null, images: [], description: null, is_available: true, is_active: true, created_at: '2024-02-15T09:00:00Z', updated_at: '' },
  { id: 'c4', partner_id: 'p2', location_id: 'l2', brand: 'Renault', model: 'Logan', year: 2022, color: 'Серебристый', license_plate: 'В012СС', transmission: 'manual', fuel_type: 'gasoline', seats: 5, price_per_day: 1500, deposit: 7000, image: null, images: [], description: null, is_available: false, is_active: true, created_at: '2024-03-01T11:00:00Z', updated_at: '' },
  { id: 'c5', partner_id: 'p3', location_id: 'l4', brand: 'Toyota', model: 'Camry', year: 2024, color: 'Белый', license_plate: 'С345НН', transmission: 'automatic', fuel_type: 'gasoline', seats: 5, price_per_day: 4500, deposit: 20000, image: null, images: [], description: 'Премиум седан бизнес-класса', is_available: true, is_active: true, created_at: '2024-03-15T08:00:00Z', updated_at: '' },
  { id: 'c6', partner_id: 'p3', location_id: 'l4', brand: 'BMW', model: 'X5', year: 2024, color: 'Чёрный', license_plate: 'С678НН', transmission: 'automatic', fuel_type: 'diesel', seats: 5, price_per_day: 7000, deposit: 30000, image: null, images: [], description: 'Внедорожник премиум-класса', is_available: true, is_active: true, created_at: '2024-04-01T12:00:00Z', updated_at: '' },
  { id: 'c7', partner_id: 'p1', location_id: 'l3', brand: 'Volkswagen', model: 'Polo', year: 2023, color: 'Красный', license_plate: 'С901НН', transmission: 'automatic', fuel_type: 'gasoline', seats: 5, price_per_day: 2200, deposit: 10000, image: null, images: [], description: null, is_available: true, is_active: true, created_at: '2024-04-10T16:30:00Z', updated_at: '' },
  { id: 'c8', partner_id: 'p2', location_id: 'l2', brand: 'Nissan', model: 'Qashqai', year: 2023, color: 'Серый', license_plate: 'Д234РР', transmission: 'automatic', fuel_type: 'gasoline', seats: 5, price_per_day: 3500, deposit: 15000, image: null, images: [], description: 'Компактный кроссовер', is_available: false, is_active: false, created_at: '2024-04-20T11:00:00Z', updated_at: '' },
  { id: 'c9', partner_id: 'p4', location_id: null, brand: 'Skoda', model: 'Octavia', year: 2022, color: 'Синий', license_plate: 'Д567РР', transmission: 'manual', fuel_type: 'gasoline', seats: 5, price_per_day: 2000, deposit: 9000, image: null, images: [], description: null, is_available: true, is_active: true, created_at: '2024-05-01T09:00:00Z', updated_at: '' },
  { id: 'c10', partner_id: 'p1', location_id: 'l1', brand: 'Mercedes-Benz', model: 'E-Class', year: 2024, color: 'Чёрный', license_plate: 'Д890РР', transmission: 'automatic', fuel_type: 'diesel', seats: 5, price_per_day: 8000, deposit: 35000, image: null, images: [], description: 'Бизнес-седан представительского класса', is_available: true, is_active: true, created_at: '2024-05-10T14:00:00Z', updated_at: '' },
];

interface CarFormData {
  partner_id: string;
  location_id: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  license_plate: string;
  transmission: 'manual' | 'automatic';
  fuel_type: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  seats: number;
  price_per_day: number;
  deposit: number;
  image: string;
  description: string;
  is_available: boolean;
  is_active: boolean;
}

const initialFormData: CarFormData = {
  partner_id: '',
  location_id: '',
  brand: '',
  model: '',
  year: '',
  color: '',
  license_plate: '',
  transmission: 'manual',
  fuel_type: 'gasoline',
  seats: 5,
  price_per_day: 0,
  deposit: 0,
  image: '',
  description: '',
  is_available: true,
  is_active: true,
};

const TRANSMISSION_LABELS: Record<string, string> = {
  manual: 'Механика',
  automatic: 'Автомат',
};

const FUEL_LABELS: Record<string, string> = {
  gasoline: 'Бензин',
  diesel: 'Дизель',
  electric: 'Электро',
  hybrid: 'Гибрид',
};

export function AdminTravelCars() {
  const { hasAdminAccess } = useAuth();
  const navigate = useNavigate();

  const [cars, setCars] = useState<PartnerCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [transmissionFilter, setTransmissionFilter] = useState<string>('all');
  const [fuelFilter, setFuelFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [viewItem, setViewItem] = useState<PartnerCar | null>(null);
  const [editItem, setEditItem] = useState<PartnerCar | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formData, setFormData] = useState<CarFormData>(initialFormData);

  const partners = MOCK_PARTNERS;
  const locations = MOCK_LOCATIONS;

  if (!hasAdminAccess) {
    return <Navigate to="/admin-login" />;
  }

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setCars(MOCK_CARS);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filteredData = useMemo(() => {
    let filtered = [...cars];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.brand.toLowerCase().includes(q) ||
          c.model.toLowerCase().includes(q) ||
          (c.license_plate || '').toLowerCase().includes(q) ||
          (partners.find((p) => p.id === c.partner_id)?.name || '').toLowerCase().includes(q)
      );
    }
    if (transmissionFilter !== 'all') {
      filtered = filtered.filter((c) => c.transmission === transmissionFilter);
    }
    if (fuelFilter !== 'all') {
      filtered = filtered.filter((c) => c.fuel_type === fuelFilter);
    }
    return filtered;
  }, [cars, searchQuery, transmissionFilter, fuelFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, transmissionFilter, fuelFilter]);

  const total = cars.length;
  const availableCount = cars.filter((c) => c.is_available).length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPartnerName = (partnerId: string) => {
    return partners.find((p) => p.id === partnerId)?.name || partnerId;
  };

  const getLocationName = (locationId: string | null) => {
    if (!locationId) return '-';
    return locations.find((l) => l.id === locationId)?.name || locationId;
  };

  const handleFormChange = (field: keyof CarFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddItem = () => {
    const newItem: PartnerCar = {
      id: 'c' + Date.now(),
      partner_id: formData.partner_id,
      location_id: formData.location_id || null,
      brand: formData.brand,
      model: formData.model,
      year: formData.year ? Number(formData.year) : null,
      color: formData.color || null,
      license_plate: formData.license_plate || null,
      transmission: formData.transmission,
      fuel_type: formData.fuel_type,
      seats: formData.seats,
      price_per_day: formData.price_per_day,
      deposit: formData.deposit,
      image: formData.image || null,
      images: [],
      description: formData.description || null,
      is_available: formData.is_available,
      is_active: formData.is_active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCars((prev) => [newItem, ...prev]);
    setAddModalOpen(false);
    setFormData(initialFormData);
  };

  const handleUpdateItem = () => {
    if (!editItem) return;
    setCars((prev) => prev.map((c) => (c.id === editItem.id ? editItem : c)));
    setEditItem(null);
  };

  const handleToggleAvailable = (item: PartnerCar) => {
    setCars((prev) =>
      prev.map((c) =>
        c.id === item.id ? { ...c, is_available: !c.is_available } : c
      )
    );
  };

  const handleToggleActive = (item: PartnerCar) => {
    setCars((prev) =>
      prev.map((c) =>
        c.id === item.id ? { ...c, is_active: !c.is_active } : c
      )
    );
  };

  const handleDeleteItem = () => {
    if (!deleteConfirmId) return;
    setCars((prev) => prev.filter((c) => c.id !== deleteConfirmId));
    setDeleteConfirmId(null);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-loading">Загрузка...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-parkings">
        <div className="admin-page-header">
          <h2>Управление автомобилями</h2>
          <button className="admin-add-btn" onClick={() => { setFormData(initialFormData); setAddModalOpen(true); }}>
            + Добавить автомобиль
          </button>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
          <div className="admin-stat-card">
            <div className="admin-stat-content">
              <span className="admin-stat-value">{total}</span>
              <span className="admin-stat-label">Всего автомобилей</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-content">
              <span className="admin-stat-value">{availableCount}</span>
              <span className="admin-stat-label">Доступно</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-filters">
          <div className="admin-search">
            <span className="admin-search-icon"></span>
            <input
              type="text"
              placeholder="Поиск по марке, модели, партнёру..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
          </div>
          <select
            value={transmissionFilter}
            onChange={(e) => setTransmissionFilter(e.target.value)}
            className="admin-filter-select"
          >
            <option value="all">Все коробки</option>
            <option value="manual">Механика</option>
            <option value="automatic">Автомат</option>
          </select>
          <select
            value={fuelFilter}
            onChange={(e) => setFuelFilter(e.target.value)}
            className="admin-filter-select"
          >
            <option value="all">Всё топливо</option>
            <option value="gasoline">Бензин</option>
            <option value="diesel">Дизель</option>
            <option value="electric">Электро</option>
            <option value="hybrid">Гибрид</option>
          </select>
        </div>

        {/* Table */}
        {filteredData.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon"></div>
            <h3>Ничего не найдено</h3>
            <p>Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Марка</th>
                    <th>Модель</th>
                    <th>Год</th>
                    <th>КПП</th>
                    <th>Мест</th>
                    <th>Цена/день</th>
                    <th>Партнёр</th>
                    <th>Статус</th>
                    <th>Доступен</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id}>
                      <td className="parking-title">{item.brand}</td>
                      <td>{item.model}</td>
                      <td>{item.year || '-'}</td>
                      <td>{TRANSMISSION_LABELS[item.transmission]}</td>
                      <td>{item.seats}</td>
                      <td className="parking-price">{formatCurrency(item.price_per_day)}</td>
                      <td>{getPartnerName(item.partner_id)}</td>
                      <td>
                        <span className={`status-badge ${item.is_active ? 'status-active' : 'status-inactive'}`}>
                          {item.is_active ? 'Активен' : 'Неактивен'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${item.is_available ? 'status-active' : 'status-inactive'}`}>
                          {item.is_available ? 'Да' : 'Нет'}
                        </span>
                      </td>
                      <td className="parking-actions">
                        <button className="action-btn view-btn" onClick={() => setViewItem(item)} title="Просмотр">Просмотр</button>
                        <button className="action-btn edit-btn" onClick={() => setEditItem(item)} title="Редактировать">Ред.</button>
                        <button
                          className={`action-btn ${item.is_active ? 'deactivate-btn' : 'activate-btn'}`}
                          onClick={() => handleToggleActive(item)}
                          title={item.is_active ? 'Деактивировать' : 'Активировать'}
                        >
                          {item.is_active ? 'Выкл.' : 'Вкл.'}
                        </button>
                        <button
                          className={`action-btn ${item.is_available ? 'deactivate-btn' : 'activate-btn'}`}
                          onClick={() => handleToggleAvailable(item)}
                          title={item.is_available ? 'Забронирован' : 'Доступен'}
                        >
                          {item.is_available ? 'Занят' : 'Свободен'}
                        </button>
                        <button className="action-btn delete-btn" onClick={() => setDeleteConfirmId(item.id)} title="Удалить">Удалить</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="admin-pagination">
                <button className="pagination-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  ← Назад
                </button>
                <span className="pagination-info">Страница {currentPage} из {totalPages}</span>
                <button className="pagination-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  Вперёд →
                </button>
              </div>
            )}
          </>
        )}

        {/* View Modal */}
        {viewItem && (
          <div className="modal-overlay" onClick={() => setViewItem(null)}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Информация об автомобиле</h2>
                <button className="modal-close" onClick={() => setViewItem(null)}>×</button>
              </div>
              <div className="modal-body">
                {viewItem.image && (
                  <div className="parking-image-preview">
                    <img src={viewItem.image} alt={`${viewItem.brand} ${viewItem.model}`} />
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">ID:</span>
                  <span className="detail-value">{viewItem.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Марка:</span>
                  <span className="detail-value">{viewItem.brand}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Модель:</span>
                  <span className="detail-value">{viewItem.model}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Год выпуска:</span>
                  <span className="detail-value">{viewItem.year || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Цвет:</span>
                  <span className="detail-value">{viewItem.color || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Госномер:</span>
                  <span className="detail-value">{viewItem.license_plate || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Коробка передач:</span>
                  <span className="detail-value">{TRANSMISSION_LABELS[viewItem.transmission]}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Топливо:</span>
                  <span className="detail-value">{FUEL_LABELS[viewItem.fuel_type]}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Кол-во мест:</span>
                  <span className="detail-value">{viewItem.seats}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Цена за день:</span>
                  <span className="detail-value">{formatCurrency(viewItem.price_per_day)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Депозит:</span>
                  <span className="detail-value">{formatCurrency(viewItem.deposit)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Партнёр:</span>
                  <span className="detail-value">{getPartnerName(viewItem.partner_id)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Локация:</span>
                  <span className="detail-value">{getLocationName(viewItem.location_id)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Статус:</span>
                  <span className={`status-badge ${viewItem.is_active ? 'status-active' : 'status-inactive'}`}>
                    {viewItem.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Доступен:</span>
                  <span className={`status-badge ${viewItem.is_available ? 'status-active' : 'status-inactive'}`}>
                    {viewItem.is_available ? 'Да' : 'Нет'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Описание:</span>
                  <span className="detail-value">{viewItem.description || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Дата создания:</span>
                  <span className="detail-value">{new Date(viewItem.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="modal-btn" onClick={() => setViewItem(null)}>Закрыть</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editItem && (
          <div className="modal-overlay" onClick={() => setEditItem(null)}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Редактирование автомобиля</h2>
                <button className="modal-close" onClick={() => setEditItem(null)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Партнёр *</label>
                    <select
                      value={editItem.partner_id}
                      onChange={(e) => setEditItem({ ...editItem, partner_id: e.target.value })}
                    >
                      <option value="">Выберите партнёра</option>
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Локация</label>
                    <select
                      value={editItem.location_id || ''}
                      onChange={(e) => setEditItem({ ...editItem, location_id: e.target.value || null })}
                    >
                      <option value="">Без локации</option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Марка *</label>
                    <input
                      type="text"
                      value={editItem.brand}
                      onChange={(e) => setEditItem({ ...editItem, brand: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Модель *</label>
                    <input
                      type="text"
                      value={editItem.model}
                      onChange={(e) => setEditItem({ ...editItem, model: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Год выпуска</label>
                    <input
                      type="number"
                      value={editItem.year || ''}
                      onChange={(e) => setEditItem({ ...editItem, year: Number(e.target.value) || null })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Цвет</label>
                    <input
                      type="text"
                      value={editItem.color || ''}
                      onChange={(e) => setEditItem({ ...editItem, color: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Госномер</label>
                    <input
                      type="text"
                      value={editItem.license_plate || ''}
                      onChange={(e) => setEditItem({ ...editItem, license_plate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Коробка передач</label>
                    <select
                      value={editItem.transmission}
                      onChange={(e) => setEditItem({ ...editItem, transmission: e.target.value as 'manual' | 'automatic' })}
                    >
                      <option value="manual">Механика</option>
                      <option value="automatic">Автомат</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Тип топлива</label>
                    <select
                      value={editItem.fuel_type}
                      onChange={(e) => setEditItem({ ...editItem, fuel_type: e.target.value as any })}
                    >
                      <option value="gasoline">Бензин</option>
                      <option value="diesel">Дизель</option>
                      <option value="electric">Электро</option>
                      <option value="hybrid">Гибрид</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Кол-во мест</label>
                    <input
                      type="number"
                      value={editItem.seats}
                      onChange={(e) => setEditItem({ ...editItem, seats: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Цена за день (₽)</label>
                    <input
                      type="number"
                      value={editItem.price_per_day}
                      onChange={(e) => setEditItem({ ...editItem, price_per_day: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Депозит (₽)</label>
                    <input
                      type="number"
                      value={editItem.deposit}
                      onChange={(e) => setEditItem({ ...editItem, deposit: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>URL изображения</label>
                    <input
                      type="text"
                      value={editItem.image || ''}
                      onChange={(e) => setEditItem({ ...editItem, image: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Статус</label>
                    <select
                      value={editItem.is_active ? 'active' : 'inactive'}
                      onChange={(e) => setEditItem({ ...editItem, is_active: e.target.value === 'active' })}
                    >
                      <option value="active">Активен</option>
                      <option value="inactive">Неактивен</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editItem.is_available}
                        onChange={(e) => setEditItem({ ...editItem, is_available: e.target.checked })}
                      />
                      Доступен для бронирования
                    </label>
                  </div>
                  <div className="form-group form-group-full">
                    <label>Описание</label>
                    <textarea
                      value={editItem.description || ''}
                      onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="modal-btn cancel-btn" onClick={() => setEditItem(null)}>Отмена</button>
                <button className="modal-btn save-btn" onClick={handleUpdateItem}>Сохранить</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteConfirmId && (
          <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Подтверждение удаления</h2>
                <button className="modal-close" onClick={() => setDeleteConfirmId(null)}>×</button>
              </div>
              <div className="modal-body">
                <p className="confirm-text">
                  Вы уверены, что хотите удалить автомобиль <strong>{cars.find((c) => c.id === deleteConfirmId)?.brand} {cars.find((c) => c.id === deleteConfirmId)?.model}</strong>?
                </p>
                <p className="confirm-warning">Это действие нельзя отменить!</p>
              </div>
              <div className="modal-footer">
                <button className="modal-btn cancel-btn" onClick={() => setDeleteConfirmId(null)}>Отмена</button>
                <button className="modal-btn delete-confirm-btn" onClick={handleDeleteItem}>Удалить</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {addModalOpen && (
          <div className="modal-overlay" onClick={() => setAddModalOpen(false)}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Добавить автомобиль</h2>
                <button className="modal-close" onClick={() => setAddModalOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Партнёр *</label>
                    <select
                      value={formData.partner_id}
                      onChange={(e) => handleFormChange('partner_id', e.target.value)}
                    >
                      <option value="">Выберите партнёра</option>
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Локация</label>
                    <select
                      value={formData.location_id}
                      onChange={(e) => handleFormChange('location_id', e.target.value)}
                    >
                      <option value="">Без локации</option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Марка *</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => handleFormChange('brand', e.target.value)}
                      placeholder="Например: Toyota"
                    />
                  </div>
                  <div className="form-group">
                    <label>Модель *</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => handleFormChange('model', e.target.value)}
                      placeholder="Например: Camry"
                    />
                  </div>
                  <div className="form-group">
                    <label>Год выпуска</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => handleFormChange('year', e.target.value)}
                      placeholder="2024"
                    />
                  </div>
                  <div className="form-group">
                    <label>Цвет</label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => handleFormChange('color', e.target.value)}
                      placeholder="Белый"
                    />
                  </div>
                  <div className="form-group">
                    <label>Госномер</label>
                    <input
                      type="text"
                      value={formData.license_plate}
                      onChange={(e) => handleFormChange('license_plate', e.target.value)}
                      placeholder="А123ВВ"
                    />
                  </div>
                  <div className="form-group">
                    <label>Коробка передач</label>
                    <select
                      value={formData.transmission}
                      onChange={(e) => handleFormChange('transmission', e.target.value)}
                    >
                      <option value="manual">Механика</option>
                      <option value="automatic">Автомат</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Тип топлива</label>
                    <select
                      value={formData.fuel_type}
                      onChange={(e) => handleFormChange('fuel_type', e.target.value)}
                    >
                      <option value="gasoline">Бензин</option>
                      <option value="diesel">Дизель</option>
                      <option value="electric">Электро</option>
                      <option value="hybrid">Гибрид</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Кол-во мест</label>
                    <input
                      type="number"
                      value={formData.seats}
                      onChange={(e) => handleFormChange('seats', Number(e.target.value))}
                      placeholder="5"
                    />
                  </div>
                  <div className="form-group">
                    <label>Цена за день (₽) *</label>
                    <input
                      type="number"
                      value={formData.price_per_day}
                      onChange={(e) => handleFormChange('price_per_day', Number(e.target.value))}
                      placeholder="2500"
                    />
                  </div>
                  <div className="form-group">
                    <label>Депозит (₽)</label>
                    <input
                      type="number"
                      value={formData.deposit}
                      onChange={(e) => handleFormChange('deposit', Number(e.target.value))}
                      placeholder="10000"
                    />
                  </div>
                  <div className="form-group">
                    <label>URL изображения</label>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => handleFormChange('image', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Статус</label>
                    <select
                      value={formData.is_active ? 'active' : 'inactive'}
                      onChange={(e) => handleFormChange('is_active', e.target.value === 'active')}
                    >
                      <option value="active">Активен</option>
                      <option value="inactive">Неактивен</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label" style={{ marginTop: 24 }}>
                      <input
                        type="checkbox"
                        checked={formData.is_available}
                        onChange={(e) => handleFormChange('is_available', e.target.checked)}
                      />
                      Доступен для бронирования
                    </label>
                  </div>
                  <div className="form-group form-group-full">
                    <label>Описание</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      rows={3}
                      placeholder="Описание автомобиля..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="modal-btn cancel-btn" onClick={() => setAddModalOpen(false)}>Отмена</button>
                <button
                  className="modal-btn save-btn"
                  onClick={handleAddItem}
                  disabled={!formData.partner_id || !formData.brand || !formData.model || !formData.price_per_day}
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
