import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayout } from './components/AdminLayout';
import styles from './AdminTravel.module.css';
import type { TravelDestination } from '../../lib/travel/types';

const MOCK_DESTINATIONS: TravelDestination[] = [
  {
    id: 'd1', name: 'Сочи', slug: 'sochi', region: 'Краснодарский край',
    description: 'Крупнейший курортный город России на побережье Чёрного моря',
    image: '/images/destinations/sochi.jpg', latitude: 43.5855, longitude: 39.7231,
    is_active: true, sort_order: 1, created_at: '2024-01-15T10:00:00Z', updated_at: '2024-06-01T10:00:00Z',
  },
  {
    id: 'd2', name: 'Анапа', slug: 'anapa', region: 'Краснодарский край',
    description: 'Детский и семейный курорт с песчаными пляжами',
    image: '/images/destinations/anapa.jpg', latitude: 44.8944, longitude: 37.3167,
    is_active: true, sort_order: 2, created_at: '2024-01-15T10:00:00Z', updated_at: '2024-06-01T10:00:00Z',
  },
  {
    id: 'd3', name: 'Геленджик', slug: 'gelendzhik', region: 'Краснодарский край',
    description: 'Курорт на берегу Геленджикской бухты', image: null,
    latitude: 44.5611, longitude: 38.0769, is_active: true, sort_order: 3,
    created_at: '2024-02-01T14:30:00Z', updated_at: '2024-06-01T10:00:00Z',
  },
  {
    id: 'd4', name: 'Новороссийск', slug: 'novorossiysk', region: 'Краснодарский край',
    description: 'Крупный портовый город', image: null,
    latitude: 44.7235, longitude: 37.7687, is_active: true, sort_order: 4,
    created_at: '2024-02-10T09:15:00Z', updated_at: '2024-06-01T10:00:00Z',
  },
  {
    id: 'd5', name: 'Туапсе', slug: 'tuapse', region: 'Краснодарский край',
    description: 'Город-порт на Черноморском побережье', image: null,
    latitude: 44.0937, longitude: 39.0742, is_active: false, sort_order: 5,
    created_at: '2024-03-05T11:00:00Z', updated_at: '2024-06-01T10:00:00Z',
  },
  {
    id: 'd6', name: 'Крым', slug: 'crimea', region: 'Республика Крым',
    description: 'Полуостров с уникальной природой и историей', image: null,
    latitude: 44.9521, longitude: 34.1024, is_active: true, sort_order: 6,
    created_at: '2024-03-15T08:00:00Z', updated_at: '2024-06-01T10:00:00Z',
  },
  {
    id: 'd7', name: 'Адлер', slug: 'adler', region: 'Краснодарский край',
    description: 'Район Сочи с современной инфраструктурой', image: null,
    latitude: 43.4291, longitude: 39.9231, is_active: true, sort_order: 7,
    created_at: '2024-04-01T12:00:00Z', updated_at: '2024-06-01T10:00:00Z',
  },
  {
    id: 'd8', name: 'Дагомыс', slug: 'dagomys', region: 'Краснодарский край',
    description: 'Курортный посёлок в Лазаревском районе Сочи', image: null,
    latitude: 43.6640, longitude: 39.6572, is_active: false, sort_order: 8,
    created_at: '2024-04-10T16:30:00Z', updated_at: '2024-06-01T10:00:00Z',
  },
];

interface DestinationFormData {
  name: string;
  slug: string;
  region: string;
  description: string;
  image: string;
  latitude: string;
  longitude: string;
  sort_order: number;
  is_active: boolean;
}

const initialFormData: DestinationFormData = {
  name: '',
  slug: '',
  region: '',
  description: '',
  image: '',
  latitude: '',
  longitude: '',
  sort_order: 0,
  is_active: true,
};

export function AdminTravelDestinations() {
  const { hasAdminAccess } = useAuth();
  const navigate = useNavigate();

  const [destinations, setDestinations] = useState<TravelDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modal state
  const [viewItem, setViewItem] = useState<TravelDestination | null>(null);
  const [editItem, setEditItem] = useState<TravelDestination | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formData, setFormData] = useState<DestinationFormData>(initialFormData);

  if (!hasAdminAccess) {
    return <Navigate to="/admin-login" />;
  }

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setDestinations(MOCK_DESTINATIONS);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filteredData = useMemo(() => {
    let filtered = [...destinations];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.slug.toLowerCase().includes(q) ||
          (d.region || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [destinations, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const total = destinations.length;
  const activeCount = destinations.filter((d) => d.is_active).length;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const handleFormChange = (field: keyof DestinationFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Auto-generate slug from name
    if (field === 'name') {
      setFormData((prev) => ({
        ...prev,
        name: value,
        slug: (value as string)
          .toLowerCase()
          .replace(/[^a-zа-яё0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      }));
    }
  };

  const handleAddItem = () => {
    const newItem: TravelDestination = {
      id: 'd' + Date.now(),
      name: formData.name,
      slug: formData.slug,
      region: formData.region || null,
      description: formData.description || null,
      image: formData.image || null,
      latitude: formData.latitude ? Number(formData.latitude) : null,
      longitude: formData.longitude ? Number(formData.longitude) : null,
      sort_order: formData.sort_order,
      is_active: formData.is_active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setDestinations((prev) => [newItem, ...prev]);
    setAddModalOpen(false);
    setFormData(initialFormData);
  };

  const handleUpdateItem = () => {
    if (!editItem) return;
    setDestinations((prev) =>
      prev.map((d) => (d.id === editItem.id ? editItem : d))
    );
    setEditItem(null);
  };

  const handleToggleStatus = (item: TravelDestination) => {
    setDestinations((prev) =>
      prev.map((d) =>
        d.id === item.id ? { ...d, is_active: !d.is_active } : d
      )
    );
  };

  const handleDeleteItem = () => {
    if (!deleteConfirmId) return;
    setDestinations((prev) => prev.filter((d) => d.id !== deleteConfirmId));
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
          <h2>Управление направлениями</h2>
          <button className="admin-add-btn" onClick={() => { setFormData(initialFormData); setAddModalOpen(true); }}>
            + Добавить направление
          </button>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
          <div className="admin-stat-card">
            <div className="admin-stat-content">
              <span className="admin-stat-value">{total}</span>
              <span className="admin-stat-label">Всего направлений</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-content">
              <span className="admin-stat-value">{activeCount}</span>
              <span className="admin-stat-label">Активных</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="admin-filters">
          <div className="admin-search">
            <span className="admin-search-icon"></span>
            <input
              type="text"
              placeholder="Поиск по названию, slug или региону..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
          </div>
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
                    <th>Название</th>
                    <th>Slug</th>
                    <th>Регион</th>
                    <th>Статус</th>
                    <th>Порядок</th>
                    <th>Дата создания</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id}>
                      <td className="parking-title">{item.name}</td>
                      <td className="parking-id">{item.slug}</td>
                      <td>{item.region || '-'}</td>
                      <td>
                        <span className={`status-badge ${item.is_active ? 'status-active' : 'status-inactive'}`}>
                          {item.is_active ? 'Активно' : 'Неактивно'}
                        </span>
                      </td>
                      <td>{item.sort_order}</td>
                      <td className="parking-date">{formatDate(item.created_at)}</td>
                      <td className="parking-actions">
                        <button className="action-btn view-btn" onClick={() => setViewItem(item)} title="Просмотр">Просмотр</button>
                        <button className="action-btn edit-btn" onClick={() => setEditItem(item)} title="Редактировать">Ред.</button>
                        <button
                          className={`action-btn ${item.is_active ? 'deactivate-btn' : 'activate-btn'}`}
                          onClick={() => handleToggleStatus(item)}
                          title={item.is_active ? 'Деактивировать' : 'Активировать'}
                        >
                          {item.is_active ? 'Выкл.' : 'Вкл.'}
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
                <h2>Информация о направлении</h2>
                <button className="modal-close" onClick={() => setViewItem(null)}>×</button>
              </div>
              <div className="modal-body">
                {viewItem.image && (
                  <div className="parking-image-preview">
                    <img src={viewItem.image} alt={viewItem.name} />
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">ID:</span>
                  <span className="detail-value">{viewItem.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Название:</span>
                  <span className="detail-value">{viewItem.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Slug:</span>
                  <span className="detail-value">{viewItem.slug}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Регион:</span>
                  <span className="detail-value">{viewItem.region || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Описание:</span>
                  <span className="detail-value">{viewItem.description || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Координаты:</span>
                  <span className="detail-value">
                    {viewItem.latitude && viewItem.longitude
                      ? `${viewItem.latitude}, ${viewItem.longitude}`
                      : '-'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Порядок сортировки:</span>
                  <span className="detail-value">{viewItem.sort_order}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Статус:</span>
                  <span className={`status-badge ${viewItem.is_active ? 'status-active' : 'status-inactive'}`}>
                    {viewItem.is_active ? 'Активно' : 'Неактивно'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Дата создания:</span>
                  <span className="detail-value">{formatDate(viewItem.created_at)}</span>
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
                <h2>Редактирование направления</h2>
                <button className="modal-close" onClick={() => setEditItem(null)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Название *</label>
                    <input
                      type="text"
                      value={editItem.name}
                      onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Slug *</label>
                    <input
                      type="text"
                      value={editItem.slug}
                      onChange={(e) => setEditItem({ ...editItem, slug: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Регион</label>
                    <input
                      type="text"
                      value={editItem.region || ''}
                      onChange={(e) => setEditItem({ ...editItem, region: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Порядок сортировки</label>
                    <input
                      type="number"
                      value={editItem.sort_order}
                      onChange={(e) => setEditItem({ ...editItem, sort_order: Number(e.target.value) })}
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
                      <option value="active">Активно</option>
                      <option value="inactive">Неактивно</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Широта</label>
                    <input
                      type="text"
                      value={editItem.latitude || ''}
                      onChange={(e) => setEditItem({ ...editItem, latitude: Number(e.target.value) || null })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Долгота</label>
                    <input
                      type="text"
                      value={editItem.longitude || ''}
                      onChange={(e) => setEditItem({ ...editItem, longitude: Number(e.target.value) || null })}
                    />
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
                  Вы уверены, что хотите удалить направление <strong>{destinations.find((d) => d.id === deleteConfirmId)?.name}</strong>?
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
                <h2>Добавить направление</h2>
                <button className="modal-close" onClick={() => setAddModalOpen(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Название *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder="Например: Сочи"
                    />
                  </div>
                  <div className="form-group">
                    <label>Slug *</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => handleFormChange('slug', e.target.value)}
                      placeholder="sochi"
                    />
                  </div>
                  <div className="form-group">
                    <label>Регион</label>
                    <input
                      type="text"
                      value={formData.region}
                      onChange={(e) => handleFormChange('region', e.target.value)}
                      placeholder="Краснодарский край"
                    />
                  </div>
                  <div className="form-group">
                    <label>Порядок сортировки</label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => handleFormChange('sort_order', Number(e.target.value))}
                      placeholder="0"
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
                    <label>
                      <label className="checkbox-label" style={{ marginTop: 24 }}>
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => handleFormChange('is_active', e.target.checked)}
                        />
                        Активно
                      </label>
                    </label>
                  </div>
                  <div className="form-group">
                    <label>Широта</label>
                    <input
                      type="text"
                      value={formData.latitude}
                      onChange={(e) => handleFormChange('latitude', e.target.value)}
                      placeholder="43.5855"
                    />
                  </div>
                  <div className="form-group">
                    <label>Долгота</label>
                    <input
                      type="text"
                      value={formData.longitude}
                      onChange={(e) => handleFormChange('longitude', e.target.value)}
                      placeholder="39.7231"
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Описание</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      rows={3}
                      placeholder="Описание направления..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="modal-btn cancel-btn" onClick={() => setAddModalOpen(false)}>Отмена</button>
                <button className="modal-btn save-btn" onClick={handleAddItem} disabled={!formData.name || !formData.slug}>
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
