import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayout } from './components/AdminLayout';
import { TravelModal, ModalButtons } from './components/TravelModal';
import modalStyles from './components/TravelModal.module.css';
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
        <TravelModal
          isOpen={!!viewItem}
          onClose={() => setViewItem(null)}
          title={viewItem?.name || 'Информация о направлении'}
          subtitle="Детальная информация о направлении"
          icon="📍"
          size="wide"
          footer={
            <div style={{ display: 'flex', gap: 12 }}>
              {ModalButtons.close(() => setViewItem(null))}
            </div>
          }
        >
          {viewItem && (
            <>
              {viewItem.image && (
                <div className={modalStyles.imagePreview}>
                  <img src={viewItem.image} alt={viewItem.name} />
                </div>
              )}
              <div className={modalStyles.detailGrid}>
                <div className={modalStyles.detailItem}>
                  <span className={modalStyles.detailLabel}>ID</span>
                  <span className={modalStyles.detailValue}>{viewItem.id}</span>
                </div>
                <div className={modalStyles.detailItem}>
                  <span className={modalStyles.detailLabel}>Название</span>
                  <span className={modalStyles.detailValue}>{viewItem.name}</span>
                </div>
                <div className={modalStyles.detailItem}>
                  <span className={modalStyles.detailLabel}>Slug</span>
                  <span className={modalStyles.detailValue}>{viewItem.slug}</span>
                </div>
                <div className={modalStyles.detailItem}>
                  <span className={modalStyles.detailLabel}>Регион</span>
                  <span className={modalStyles.detailValue}>{viewItem.region || '-'}</span>
                </div>
                <div className={`${modalStyles.detailItem} ${modalStyles.detailItemFull}`}>
                  <span className={modalStyles.detailLabel}>Описание</span>
                  <span className={modalStyles.detailValue}>{viewItem.description || '-'}</span>
                </div>
                <div className={modalStyles.detailItem}>
                  <span className={modalStyles.detailLabel}>Координаты</span>
                  <span className={modalStyles.detailValue}>
                    {viewItem.latitude && viewItem.longitude
                      ? `${viewItem.latitude}, ${viewItem.longitude}`
                      : '-'}
                  </span>
                </div>
                <div className={modalStyles.detailItem}>
                  <span className={modalStyles.detailLabel}>Порядок сортировки</span>
                  <span className={modalStyles.detailValue}>{viewItem.sort_order}</span>
                </div>
                <div className={modalStyles.detailItem}>
                  <span className={modalStyles.detailLabel}>Статус</span>
                  <span className={`${modalStyles.badge} ${viewItem.is_active ? modalStyles.badgeActive : modalStyles.badgeCancelled}`}>
                    {viewItem.is_active ? 'Активно' : 'Неактивно'}
                  </span>
                </div>
                <div className={modalStyles.detailItem}>
                  <span className={modalStyles.detailLabel}>Дата создания</span>
                  <span className={modalStyles.detailValue}>{formatDate(viewItem.created_at)}</span>
                </div>
              </div>
            </>
          )}
        </TravelModal>

        {/* Edit Modal */}
        <TravelModal
          isOpen={!!editItem}
          onClose={() => setEditItem(null)}
          title="Редактирование направления"
          subtitle="Измените данные направления"
          icon="✏️"
          size="wide"
          footer={
            <div style={{ display: 'flex', gap: 12 }}>
              {ModalButtons.cancel(() => setEditItem(null))}
              {ModalButtons.save(handleUpdateItem)}
            </div>
          }
        >
          {editItem && (
            <div className={modalStyles.formGrid}>
              <div className={modalStyles.formGroup}>
                <label className={modalStyles.formLabel}>Название <span className={modalStyles.formRequired}>*</span></label>
                <input
                  className={modalStyles.formInput}
                  type="text"
                  value={editItem.name}
                  onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                />
              </div>
              <div className={modalStyles.formGroup}>
                <label className={modalStyles.formLabel}>Slug <span className={modalStyles.formRequired}>*</span></label>
                <input
                  className={modalStyles.formInput}
                  type="text"
                  value={editItem.slug}
                  onChange={(e) => setEditItem({ ...editItem, slug: e.target.value })}
                />
              </div>
              <div className={modalStyles.formGroup}>
                <label className={modalStyles.formLabel}>Регион</label>
                <input
                  className={modalStyles.formInput}
                  type="text"
                  value={editItem.region || ''}
                  onChange={(e) => setEditItem({ ...editItem, region: e.target.value })}
                />
              </div>
              <div className={modalStyles.formGroup}>
                <label className={modalStyles.formLabel}>Порядок сортировки</label>
                <input
                  className={modalStyles.formInput}
                  type="number"
                  value={editItem.sort_order}
                  onChange={(e) => setEditItem({ ...editItem, sort_order: Number(e.target.value) })}
                />
              </div>
              <div className={modalStyles.formGroup}>
                <label className={modalStyles.formLabel}>URL изображения</label>
                <input
                  className={modalStyles.formInput}
                  type="text"
                  value={editItem.image || ''}
                  onChange={(e) => setEditItem({ ...editItem, image: e.target.value })}
                />
              </div>
              <div className={modalStyles.formGroup}>
                <label className={modalStyles.formLabel}>Статус</label>
                <select
                  className={modalStyles.formSelect}
                  value={editItem.is_active ? 'active' : 'inactive'}
                  onChange={(e) => setEditItem({ ...editItem, is_active: e.target.value === 'active' })}
                >
                  <option value="active">Активно</option>
                  <option value="inactive">Неактивно</option>
                </select>
              </div>
              <div className={modalStyles.formGroup}>
                <label className={modalStyles.formLabel}>Широта</label>
                <input
                  className={modalStyles.formInput}
                  type="text"
                  value={editItem.latitude || ''}
                  onChange={(e) => setEditItem({ ...editItem, latitude: Number(e.target.value) || null })}
                />
              </div>
              <div className={modalStyles.formGroup}>
                <label className={modalStyles.formLabel}>Долгота</label>
                <input
                  className={modalStyles.formInput}
                  type="text"
                  value={editItem.longitude || ''}
                  onChange={(e) => setEditItem({ ...editItem, longitude: Number(e.target.value) || null })}
                />
              </div>
              <div className={`${modalStyles.formGroup} ${modalStyles.formGroupFull}`}>
                <label className={modalStyles.formLabel}>Описание</label>
                <textarea
                  className={modalStyles.formTextarea}
                  value={editItem.description || ''}
                  onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
        </TravelModal>

        {/* Delete Confirmation */}
        <TravelModal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          title="Подтверждение удаления"
          subtitle="Это действие нельзя отменить"
          icon="🗑️"
          size="default"
          footer={
            <div style={{ display: 'flex', gap: 12 }}>
              {ModalButtons.cancel(() => setDeleteConfirmId(null))}
              {ModalButtons.delete(handleDeleteItem)}
            </div>
          }
        >
          <div className={modalStyles.confirmIcon}>🗑️</div>
          <p className={modalStyles.confirmText}>
            Вы уверены, что хотите удалить направление <strong>{destinations.find((d) => d.id === deleteConfirmId)?.name}</strong>?
          </p>
          <p className={modalStyles.confirmWarning}>Это действие нельзя отменить!</p>
        </TravelModal>

        {/* Add Modal */}
        <TravelModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          title="Добавить направление"
          subtitle="Создайте новое направление для поездок"
          icon="➕"
          size="wide"
          footer={
            <div style={{ display: 'flex', gap: 12 }}>
              {ModalButtons.cancel(() => setAddModalOpen(false))}
              {ModalButtons.add(handleAddItem, !formData.name || !formData.slug)}
            </div>
          }
        >
          <div className={modalStyles.formGrid}>
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.formLabel}>Название <span className={modalStyles.formRequired}>*</span></label>
              <input
                className={modalStyles.formInput}
                type="text"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Например: Сочи"
              />
            </div>
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.formLabel}>Slug <span className={modalStyles.formRequired}>*</span></label>
              <input
                className={modalStyles.formInput}
                type="text"
                value={formData.slug}
                onChange={(e) => handleFormChange('slug', e.target.value)}
                placeholder="sochi"
              />
            </div>
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.formLabel}>Регион</label>
              <input
                className={modalStyles.formInput}
                type="text"
                value={formData.region}
                onChange={(e) => handleFormChange('region', e.target.value)}
                placeholder="Краснодарский край"
              />
            </div>
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.formLabel}>Порядок сортировки</label>
              <input
                className={modalStyles.formInput}
                type="number"
                value={formData.sort_order}
                onChange={(e) => handleFormChange('sort_order', Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.formLabel}>URL изображения</label>
              <input
                className={modalStyles.formInput}
                type="text"
                value={formData.image}
                onChange={(e) => handleFormChange('image', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.formLabel}>Статус</label>
              <label className={modalStyles.formCheckbox}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleFormChange('is_active', e.target.checked)}
                />
                <span className={modalStyles.formCheckboxLabel}>Активно</span>
              </label>
            </div>
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.formLabel}>Широта</label>
              <input
                className={modalStyles.formInput}
                type="text"
                value={formData.latitude}
                onChange={(e) => handleFormChange('latitude', e.target.value)}
                placeholder="43.5855"
              />
            </div>
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.formLabel}>Долгота</label>
              <input
                className={modalStyles.formInput}
                type="text"
                value={formData.longitude}
                onChange={(e) => handleFormChange('longitude', e.target.value)}
                placeholder="39.7231"
              />
            </div>
            <div className={`${modalStyles.formGroup} ${modalStyles.formGroupFull}`}>
              <label className={modalStyles.formLabel}>Описание</label>
              <textarea
                className={modalStyles.formTextarea}
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                rows={3}
                placeholder="Описание направления..."
              />
            </div>
          </div>
        </TravelModal>
      </div>
    </AdminLayout>
  );
}
