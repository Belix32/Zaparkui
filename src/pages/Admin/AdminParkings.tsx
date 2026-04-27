import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from './components/AdminLayout';
import './AdminParkings.css';

interface Parking {
  id: string;
  title: string;
  address: string;
  price_per_hour: number;
  total_spots: number;
  is_active: boolean | 'pending';
  created_at?: string;
  district?: string;
  metro?: string;
  parking_type?: 'ground' | 'underground' | 'roof' | 'covered';
  description?: string;
  amenities?: string[];
  image_url?: string;
  latitude?: number;
  longitude?: number;
  owner_id?: string;
  user_id?: string;
}

interface ParkingFormData {
  title: string;
  address: string;
  price_per_hour: number;
  total_spots: number;
  district: string;
  metro: string;
  parking_type: 'ground' | 'underground' | 'roof' | 'covered';
  description: string;
  amenities: string[];
  image_url: string;
  latitude: string;
  longitude: string;
}

const PARKING_TYPE_ICONS: Record<string, string> = {
  ground: '🏠',
  underground: '🏢',
  roof: '☀️',
  covered: '🅿️',
};

const PARKING_TYPE_LABELS: Record<string, string> = {
  ground: 'Наземная',
  underground: 'Подземная',
  roof: 'Крыша',
  covered: 'Крытая',
};

const AMENITIES_OPTIONS = [
  { id: 'cctv', label: 'Видеонаблюдение', icon: '📹' },
  { id: 'barrier', label: 'Шлагбаум', icon: '🚧' },
  { id: 'roof', label: 'Крыша', icon: '🏠' },
  { id: 'entrance_card', label: 'Пропуск', icon: '🔑' },
];

const initialFormData: ParkingFormData = {
  title: '',
  address: '',
  price_per_hour: 0,
  total_spots: 0,
  district: '',
  metro: '',
  parking_type: 'ground',
  description: '',
  amenities: [],
  image_url: '',
  latitude: '',
  longitude: '',
};

export function AdminParkings() {
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [parkingTypeFilter, setParkingTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modal state
  const [viewParking, setViewParking] = useState<Parking | null>(null);
  const [editParking, setEditParking] = useState<Parking | null>(null);
  const [deleteConfirmParking, setDeleteConfirmParking] = useState<Parking | null>(null);
  const [addParkingModal, setAddParkingModal] = useState(false);
  const [formData, setFormData] = useState<ParkingFormData>(initialFormData);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    const storedParkings = JSON.parse(localStorage.getItem('zaparkyi_parkings') || '[]');
    const storedUsers = JSON.parse(localStorage.getItem('zaparkyi_admin_users') || '[]');

    // If no data exists, create some demo data
    if (storedParkings.length === 0) {
      const demoParkings: Parking[] = [
        {
          id: 'p1',
          title: 'Парковка на Ленина',
          address: 'ул. Ленина, 10',
          price_per_hour: 150,
          total_spots: 50,
          is_active: true,
          created_at: '2024-01-15T10:00:00Z',
          district: 'Центральный',
          metro: 'Площадь Революции',
          parking_type: 'ground',
          description: 'Открытая парковка в центре города',
          amenities: ['cctv', 'barrier'],
          image_url: '',
          latitude: 55.7558,
          longitude: 37.6173,
          owner_id: 'u1',
        },
        {
          id: 'p2',
          title: 'Подземный паркинг ТЦ',
          address: 'пр. Мира, 25',
          price_per_hour: 200,
          total_spots: 200,
          is_active: true,
          created_at: '2024-02-01T14:30:00Z',
          district: 'Пресненский',
          metro: 'Выставочная',
          parking_type: 'underground',
          description: 'Просторный подземный паркинг торгового центра',
          amenities: ['cctv', 'barrier', 'entrance_card', 'roof'],
          image_url: '',
          latitude: 55.7619,
          longitude: 37.6193,
          owner_id: 'u2',
        },
        {
          id: 'p3',
          title: 'Крытая парковка ЖК',
          address: 'ул. Гагарина, 5',
          price_per_hour: 120,
          total_spots: 30,
          is_active: false,
          created_at: '2024-02-10T09:15:00Z',
          district: 'Ленинский',
          metro: 'Университет',
          parking_type: 'covered',
          description: 'Крытая парковка в жилом комплексе',
          amenities: ['cctv'],
          image_url: '',
          latitude: 55.6922,
          longitude: 37.5314,
          owner_id: 'u1',
        },
      ];
      setParkings(demoParkings);
      localStorage.setItem('zaparkyi_parkings', JSON.stringify(demoParkings));
    } else {
      setParkings(storedParkings);
    }

    setUsers(storedUsers);
    setLoading(false);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getUniqueDistricts = () => {
    const districts = new Set(parkings.map(p => p.district).filter(Boolean));
    return Array.from(districts);
  };

  const getOwnerEmail = (ownerId?: string) => {
    if (!ownerId) return '-';
    const user = users.find(u => u.id === ownerId);
    return user?.email || '-';
  };

  const getStatusBadgeClass = (isActive: boolean, pending?: boolean) => {
    if (pending) return 'status-pending';
    return isActive ? 'status-active' : 'status-inactive';
  };

  const getStatusLabel = (isActive: boolean, pending?: boolean) => {
    if (pending) return 'На модерации';
    return isActive ? 'Активна' : 'Неактивна';
  };

  // Filter and paginate parkings
  const filteredParkings = useMemo(() => {
    let filtered = [...parkings];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.address.toLowerCase().includes(query)
      );
    }

    // District filter
    if (districtFilter !== 'all') {
      filtered = filtered.filter(p => p.district === districtFilter);
    }

    // Parking type filter
    if (parkingTypeFilter !== 'all') {
      filtered = filtered.filter(p => p.parking_type === parkingTypeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => {
        if (statusFilter === 'active') return p.is_active === true;
        if (statusFilter === 'inactive') return p.is_active === false;
        if (statusFilter === 'pending') return p.is_active === 'pending';
        return true;
      });
    }

    return filtered;
  }, [parkings, searchQuery, districtFilter, parkingTypeFilter, statusFilter]);

  const totalPages = Math.ceil(filteredParkings.length / itemsPerPage);
  const paginatedParkings = filteredParkings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, districtFilter, parkingTypeFilter, statusFilter]);

  // Actions
  const handleDeleteParking = (parkingId: string) => {
    const updatedParkings = parkings.filter(p => p.id !== parkingId);
    setParkings(updatedParkings);
    localStorage.setItem('zaparkyi_parkings', JSON.stringify(updatedParkings));
    setDeleteConfirmParking(null);
  };

  const handleUpdateParking = (parking: Parking) => {
    const updatedParkings = parkings.map(p =>
      p.id === parking.id ? parking : p
    );
    setParkings(updatedParkings);
    localStorage.setItem('zaparkyi_parkings', JSON.stringify(updatedParkings));
    setEditParking(null);
  };

  const handleToggleStatus = (parking: Parking) => {
    const updatedParking = { ...parking, is_active: !parking.is_active };
    handleUpdateParking(updatedParking);
  };

  const handleAddParking = () => {
    const newParking: Parking = {
      id: 'p' + Date.now(),
      ...formData,
      price_per_hour: Number(formData.price_per_hour),
      total_spots: Number(formData.total_spots),
      latitude: formData.latitude ? Number(formData.latitude) : undefined,
      longitude: formData.longitude ? Number(formData.longitude) : undefined,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const updatedParkings = [...parkings, newParking];
    setParkings(updatedParkings);
    localStorage.setItem('zaparkyi_parkings', JSON.stringify(updatedParkings));
    setAddParkingModal(false);
    setFormData(initialFormData);
  };

  const handleFormChange = (field: keyof ParkingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAmenityToggle = (amenityId: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId],
    }));
  };

  const districts = getUniqueDistricts();

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
          <h2>🅿️ Управление парковками</h2>
          <button className="admin-add-btn" onClick={() => setAddParkingModal(true)}>
            + Добавить парковку
          </button>
        </div>

        {/* Filters */}
        <div className="admin-filters">
          <div className="admin-search">
            <span className="admin-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Поиск по названию или адресу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
          </div>

          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="admin-filter-select"
          >
            <option value="all">Все районы</option>
            {districts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={parkingTypeFilter}
            onChange={(e) => setParkingTypeFilter(e.target.value)}
            className="admin-filter-select"
          >
            <option value="all">Все типы</option>
            <option value="ground">🏠 Наземная</option>
            <option value="underground">🏢 Подземная</option>
            <option value="roof">☀️ Крыша</option>
            <option value="covered">🅿️ Крытая</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-filter-select"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
            <option value="pending">На модерации</option>
          </select>
        </div>

        {/* Table */}
        {parkings.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">🅿️</div>
            <h3>Нет парковок</h3>
            <p>В системе пока нет добавленных парковок</p>
            <button className="admin-add-btn" onClick={() => setAddParkingModal(true)}>
              + Добавить парковку
            </button>
          </div>
        ) : filteredParkings.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">🔍</div>
            <h3>Ничего не найдено</h3>
            <p>Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Адрес</th>
                    <th>Владелец</th>
                    <th>Цена/час</th>
                    <th>Мест</th>
                    <th>Тип</th>
                    <th>Статус</th>
                    <th>Дата</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedParkings.map(parking => (
                    <tr key={parking.id}>
                      <td className="parking-id">{parking.id.slice(0, 8)}</td>
                      <td className="parking-title">{parking.title}</td>
                      <td className="parking-address">{parking.address}</td>
                      <td className="parking-owner">{getOwnerEmail(parking.owner_id || parking.user_id)}</td>
                      <td className="parking-price">{formatCurrency(parking.price_per_hour)}</td>
                      <td className="parking-spots">{parking.total_spots}</td>
                      <td className="parking-type">
                        {parking.parking_type && PARKING_TYPE_ICONS[parking.parking_type]}
                        <span className="parking-type-label">{parking.parking_type ? PARKING_TYPE_LABELS[parking.parking_type] : '-'}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(parking.is_active !== false)}`}>
                          {getStatusLabel(parking.is_active !== false)}
                        </span>
                      </td>
                      <td className="parking-date">{formatDate(parking.created_at)}</td>
                      <td className="parking-actions">
                        <button
                          className="action-btn view-btn"
                          onClick={() => setViewParking(parking)}
                          title="Просмотр"
                        >
                          👁️
                        </button>
                        <button
                          className="action-btn edit-btn"
                          onClick={() => setEditParking(parking)}
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        <button
                          className={`action-btn ${parking.is_active !== false ? 'deactivate-btn' : 'activate-btn'}`}
                          onClick={() => handleToggleStatus(parking)}
                          title={parking.is_active !== false ? 'Деактивировать' : 'Активировать'}
                        >
                          {parking.is_active !== false ? '⏸️' : '▶️'}
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => setDeleteConfirmParking(parking)}
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="admin-pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ← Назад
                </button>
                <span className="pagination-info">
                  Страница {currentPage} из {totalPages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Вперёд →
                </button>
              </div>
            )}
          </>
        )}

        {/* View Details Modal */}
        {viewParking && (
          <div className="modal-overlay" onClick={() => setViewParking(null)}>
            <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🅿️ Информация о парковке</h2>
                <button className="modal-close" onClick={() => setViewParking(null)}>×</button>
              </div>
              <div className="modal-body">
                {viewParking.image_url && (
                  <div className="parking-image-preview">
                    <img src={viewParking.image_url} alt={viewParking.title} />
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">ID:</span>
                  <span className="detail-value">{viewParking.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Название:</span>
                  <span className="detail-value">{viewParking.title}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Адрес:</span>
                  <span className="detail-value">{viewParking.address}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Район:</span>
                  <span className="detail-value">{viewParking.district || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Метро:</span>
                  <span className="detail-value">{viewParking.metro || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Тип:</span>
                  <span className="detail-value">
                    {viewParking.parking_type && PARKING_TYPE_ICONS[viewParking.parking_type]}{' '}
                    {viewParking.parking_type ? PARKING_TYPE_LABELS[viewParking.parking_type] : '-'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Цена/час:</span>
                  <span className="detail-value">{formatCurrency(viewParking.price_per_hour)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Всего мест:</span>
                  <span className="detail-value">{viewParking.total_spots}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Владелец:</span>
                  <span className="detail-value">{getOwnerEmail(viewParking.owner_id || viewParking.user_id)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Статус:</span>
                  <span className={`status-badge ${getStatusBadgeClass(viewParking.is_active !== false)}`}>
                    {getStatusLabel(viewParking.is_active !== false)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Удобства:</span>
                  <span className="detail-value">
                    {viewParking.amenities?.length ? viewParking.amenities.map(a => {
                      const amenity = AMENITIES_OPTIONS.find(opt => opt.id === a);
                      return amenity ? `${amenity.icon} ${amenity.label}` : a;
                    }).join(', ') : '-'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Описание:</span>
                  <span className="detail-value">{viewParking.description || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Координаты:</span>
                  <span className="detail-value">
                    {viewParking.latitude && viewParking.longitude
                      ? `${viewParking.latitude}, ${viewParking.longitude}`
                      : '-'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Дата создания:</span>
                  <span className="detail-value">{formatDate(viewParking.created_at)}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="modal-btn" onClick={() => setViewParking(null)}>Закрыть</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editParking && (
          <div className="modal-overlay" onClick={() => setEditParking(null)}>
            <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>✏️ Редактирование парковки</h2>
                <button className="modal-close" onClick={() => setEditParking(null)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Название</label>
                    <input
                      type="text"
                      value={editParking.title}
                      onChange={(e) => setEditParking({ ...editParking, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Адрес</label>
                    <input
                      type="text"
                      value={editParking.address}
                      onChange={(e) => setEditParking({ ...editParking, address: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Район</label>
                    <input
                      type="text"
                      value={editParking.district || ''}
                      onChange={(e) => setEditParking({ ...editParking, district: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Метро</label>
                    <input
                      type="text"
                      value={editParking.metro || ''}
                      onChange={(e) => setEditParking({ ...editParking, metro: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Тип парковки</label>
                    <select
                      value={editParking.parking_type || 'ground'}
                      onChange={(e) => setEditParking({ ...editParking, parking_type: e.target.value as any })}
                    >
                      <option value="ground">🏠 Наземная</option>
                      <option value="underground">🏢 Подземная</option>
                      <option value="roof">☀️ Крыша</option>
                      <option value="covered">🅿️ Крытая</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Цена за час (₽)</label>
                    <input
                      type="number"
                      value={editParking.price_per_hour}
                      onChange={(e) => setEditParking({ ...editParking, price_per_hour: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Количество мест</label>
                    <input
                      type="number"
                      value={editParking.total_spots}
                      onChange={(e) => setEditParking({ ...editParking, total_spots: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Статус</label>
                    <select
                      value={editParking.is_active !== false ? 'active' : 'inactive'}
                      onChange={(e) => setEditParking({ ...editParking, is_active: e.target.value === 'active' })}
                    >
                      <option value="active">Активная</option>
                      <option value="inactive">Неактивная</option>
                    </select>
                  </div>
                  <div className="form-group form-group-full">
                    <label>Описание</label>
                    <textarea
                      value={editParking.description || ''}
                      onChange={(e) => setEditParking({ ...editParking, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>URL изображения</label>
                    <input
                      type="text"
                      value={editParking.image_url || ''}
                      onChange={(e) => setEditParking({ ...editParking, image_url: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Широта</label>
                    <input
                      type="text"
                      value={editParking.latitude || ''}
                      onChange={(e) => setEditParking({ ...editParking, latitude: Number(e.target.value) || undefined })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Долгота</label>
                    <input
                      type="text"
                      value={editParking.longitude || ''}
                      onChange={(e) => setEditParking({ ...editParking, longitude: Number(e.target.value) || undefined })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Удобства</label>
                    <div className="amenities-checkbox-group">
                      {AMENITIES_OPTIONS.map(amenity => (
                        <label key={amenity.id} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={editParking.amenities?.includes(amenity.id) || false}
                            onChange={(e) => {
                              const newAmenities = e.target.checked
                                ? [...(editParking.amenities || []), amenity.id]
                                : (editParking.amenities || []).filter(a => a !== amenity.id);
                              setEditParking({ ...editParking, amenities: newAmenities });
                            }}
                          />
                          {amenity.icon} {amenity.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="modal-btn cancel-btn" onClick={() => setEditParking(null)}>Отмена</button>
                <button className="modal-btn save-btn" onClick={() => handleUpdateParking(editParking)}>Сохранить</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmParking && (
          <div className="modal-overlay" onClick={() => setDeleteConfirmParking(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🗑️ Подтверждение удаления</h2>
                <button className="modal-close" onClick={() => setDeleteConfirmParking(null)}>×</button>
              </div>
              <div className="modal-body">
                <p className="confirm-text">
                  Вы уверены, что хотите удалить парковку <strong>{deleteConfirmParking.title}</strong>?
                </p>
                <p className="confirm-warning">Это действие нельзя отменить!</p>
              </div>
              <div className="modal-footer">
                <button className="modal-btn cancel-btn" onClick={() => setDeleteConfirmParking(null)}>
                  Отмена
                </button>
                <button className="modal-btn delete-confirm-btn" onClick={() => handleDeleteParking(deleteConfirmParking.id)}>
                  Удалить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Parking Modal */}
        {addParkingModal && (
          <div className="modal-overlay" onClick={() => setAddParkingModal(false)}>
            <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>➕ Добавить парковку</h2>
                <button className="modal-close" onClick={() => setAddParkingModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Название *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleFormChange('title', e.target.value)}
                      placeholder="Введите название парковки"
                    />
                  </div>
                  <div className="form-group">
                    <label>Адрес *</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleFormChange('address', e.target.value)}
                      placeholder="Введите адрес"
                    />
                  </div>
                  <div className="form-group">
                    <label>Район</label>
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => handleFormChange('district', e.target.value)}
                      placeholder="Введите район"
                    />
                  </div>
                  <div className="form-group">
                    <label>Метро</label>
                    <input
                      type="text"
                      value={formData.metro}
                      onChange={(e) => handleFormChange('metro', e.target.value)}
                      placeholder="Ближайшее метро"
                    />
                  </div>
                  <div className="form-group">
                    <label>Тип парковки</label>
                    <select
                      value={formData.parking_type}
                      onChange={(e) => handleFormChange('parking_type', e.target.value)}
                    >
                      <option value="ground">🏠 Наземная</option>
                      <option value="underground">🏢 Подземная</option>
                      <option value="roof">☀️ Крыша</option>
                      <option value="covered">🅿️ Крытая</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Цена за час (₽) *</label>
                    <input
                      type="number"
                      value={formData.price_per_hour}
                      onChange={(e) => handleFormChange('price_per_hour', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Количество мест *</label>
                    <input
                      type="number"
                      value={formData.total_spots}
                      onChange={(e) => handleFormChange('total_spots', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>URL изображения</label>
                    <input
                      type="text"
                      value={formData.image_url}
                      onChange={(e) => handleFormChange('image_url', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Широта</label>
                    <input
                      type="text"
                      value={formData.latitude}
                      onChange={(e) => handleFormChange('latitude', e.target.value)}
                      placeholder="55.7558"
                    />
                  </div>
                  <div className="form-group">
                    <label>Долгота</label>
                    <input
                      type="text"
                      value={formData.longitude}
                      onChange={(e) => handleFormChange('longitude', e.target.value)}
                      placeholder="37.6173"
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Описание</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      rows={3}
                      placeholder="Опишите парковку..."
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Удобства</label>
                    <div className="amenities-checkbox-group">
                      {AMENITIES_OPTIONS.map(amenity => (
                        <label key={amenity.id} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.amenities.includes(amenity.id)}
                            onChange={() => handleAmenityToggle(amenity.id)}
                          />
                          {amenity.icon} {amenity.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="modal-btn cancel-btn" onClick={() => setAddParkingModal(false)}>Отмена</button>
                <button
                  className="modal-btn save-btn"
                  onClick={handleAddParking}
                  disabled={!formData.title || !formData.address || !formData.price_per_hour || !formData.total_spots}
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