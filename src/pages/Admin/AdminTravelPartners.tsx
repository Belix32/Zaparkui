import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayout } from './components/AdminLayout';
import styles from './AdminTravel.module.css';
import type { RentalPartner } from '../../lib/travel/types';

const MOCK_PARTNERS: RentalPartner[] = [
  {
    id: 'p1', name: 'Авангард-Авто', slug: 'avangard-avto',
    description: 'Надёжный партнёр с большим автопарком в Сочи',
    logo: null, phone: '+7 (862) 255-55-55', email: 'info@avangard-avto.ru',
    website: 'https://avangard-avto.ru', is_active: true, commission_rate: 15, rating: 4.5,
    created_at: '2024-01-15T10:00:00Z', updated_at: '2024-06-01T10:00:00Z',
  },
  {
    id: 'p2', name: 'Юг-Авто', slug: 'yug-avto',
    description: 'Прокат автомобилей в Анапе и Геленджике',
    logo: null, phone: '+7 (861) 333-33-33', email: 'info@yug-avto.ru',
    website: 'https://yug-avto.ru', is_active: true, commission_rate: 12, rating: 4.2,
    created_at: '2024-02-01T14:30:00Z', updated_at: '2024-06-01T10:00:00Z',
  },
  {
    id: 'p3', name: 'Black Sea Rent', slug: 'black-sea-rent',
    description: 'Премиальный автопрокат на побережье',
    logo: null, phone: '+7 (988) 777-77-77', email: 'rent@blacksea.ru',
    website: 'https://blacksea-rent.ru', is_active: true, commission_rate: 20, rating: 4.8,
    created_at: '2024-02-15T09:00:00Z', updated_at: '2024-06-01T10:00:00Z',
  },
  {
    id: 'p4', name: 'Море-Авто', slug: 'more-avto',
    description: 'Доступные цены на аренду авто в Крыму',
    logo: null, phone: '+7 (365) 222-22-22', email: 'info@more-avto.ru',
    website: 'https://more-avto.ru', is_active: true, commission_rate: 10, rating: 3.9,
    created_at: '2024-03-01T11:00:00Z', updated_at: '2024-06-01T10:00:00Z',
  },
  {
    id: 'p5', name: 'Кавказ-Тур', slug: 'kavkaz-tur',
    description: 'Прокат автомобилей для путешествий по Кавказу',
    logo: null, phone: '+7 (879) 344-44-44', email: 'info@kavkaz-tur.ru',
    website: 'https://kavkaz-tur.ru', is_active: false, commission_rate: 18, rating: 4.0,
    created_at: '2024-03-15T08:00:00Z', updated_at: '2024-06-01T10:00:00Z',
  },
  {
    id: 'p6', name: 'Эконом-Авто', slug: 'ekonom-avto',
    description: 'Бюджетный прокат автомобилей',
    logo: null, phone: '+7 (861) 444-44-44', email: 'info@ekonom-avto.ru',
    website: null, is_active: false, commission_rate: 8, rating: 3.5,
    created_at: '2024-04-01T12:00:00Z', updated_at: '2024-06-01T10:00:00Z',
  },
];

interface PartnerFormData {
  name: string;
  slug: string;
  description: string;
  logo: string;
  phone: string;
  email: string;
  website: string;
  commission_rate: number;
  is_active: boolean;
}

const initialFormData: PartnerFormData = {
  name: '',
  slug: '',
  description: '',
  logo: '',
  phone: '',
  email: '',
  website: '',
  commission_rate: 10,
  is_active: true,
};

export function AdminTravelPartners() {
  const { hasAdminAccess } = useAuth();
  const navigate = useNavigate();

  const [partners, setPartners] = useState<RentalPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [viewItem, setViewItem] = useState<RentalPartner | null>(null);
  const [editItem, setEditItem] = useState<RentalPartner | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formData, setFormData] = useState<PartnerFormData>(initialFormData);

  if (!hasAdminAccess) {
    return <Navigate to="/admin-login" />;
  }

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setPartners(MOCK_PARTNERS);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filteredData = useMemo(() => {
    let filtered = [...partners];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.phone || '').includes(q)
      );
    }
    return filtered;
  }, [partners, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const total = partners.length;
  const activeCount = partners.filter((p) => p.is_active).length;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const handleFormChange = (field: keyof PartnerFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    const newItem: RentalPartner = {
      id: 'p' + Date.now(),
      name: formData.name,
      slug: formData.slug,
      description: formData.description || null,
      logo: formData.logo || null,
      phone: formData.phone || null,
      email: formData.email || null,
      website: formData.website || null,
      commission_rate: formData.commission_rate,
      is_active: formData.is_active,
      rating: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setPartners((prev) => [newItem, ...prev]);
    setAddModalOpen(false);
    setFormData(initialFormData);
  };

  const handleUpdateItem = () => {
    if (!editItem) return;
    setPartners((prev) => prev.map((p) => (p.id === editItem.id ? editItem : p)));
    setEditItem(null);
  };

  const handleToggleStatus = (item: RentalPartner) => {
    setPartners((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, is_active: !p.is_active } : p))
    );
  };

  const handleDeleteItem = () => {
    if (!deleteConfirmId) return;
    setPartners((prev) => prev.filter((p) => p.id !== deleteConfirmId));
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
          <h2>Управление партнёрами</h2>
          <button className="admin-add-btn" onClick={() => { setFormData(initialFormData); setAddModalOpen(true); }}>
            + Добавить партнёра
          </button>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
          <div className="admin-stat-card">
            <div className="admin-stat-content">
              <span className="admin-stat-value">{total}</span>
              <span className="admin-stat-label">Всего партнёров</span>
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
              placeholder="Поиск по названию, slug или телефону..."
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
                    <th>Телефон</th>
                    <th>Рейтинг</th>
                    <th>Комиссия</th>
                    <th>Статус</th>
                    <th>Дата создания</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id}>
                      <td className="parking-title">{item.name}</td>
                      <td className="parking-id">{item.slug}</td>
                      <td>{item.phone || '-'}</td>
                      <td>
                        <span className={styles.travelRating}>
                          {item.rating > 0 ? '★'.repeat(Math.round(item.rating)) + ' ' + item.rating.toFixed(1) : 'Нет'}
                        </span>
                      </td>
                      <td>{item.commission_rate}%</td>
                      <td>
                        <span className={`status-badge ${item.is_active ? 'status-active' : 'status-inactive'}`}>
                          {item.is_active ? 'Активен' : 'Неактивен'}
                        </span>
                      </td>
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
                <h2>Информация о партнёре</h2>
                <button className="modal-close" onClick={() => setViewItem(null)}>×</button>
              </div>
              <div className="modal-body">
                {viewItem.logo && (
                  <div className="parking-image-preview">
                    <img src={viewItem.logo} alt={viewItem.name} />
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
                  <span className="detail-label">Телефон:</span>
                  <span className="detail-value">{viewItem.phone || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{viewItem.email || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Вебсайт:</span>
                  <span className="detail-value">{viewItem.website || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Рейтинг:</span>
                  <span className="detail-value">
                    <span className={styles.travelRating}>
                      {viewItem.rating > 0 ? '★'.repeat(Math.round(viewItem.rating)) + ' ' + viewItem.rating.toFixed(1) : 'Нет'}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Комиссия:</span>
                  <span className="detail-value">{viewItem.commission_rate}%</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Статус:</span>
                  <span className={`status-badge ${viewItem.is_active ? 'status-active' : 'status-inactive'}`}>
                    {viewItem.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Описание:</span>
                  <span className="detail-value">{viewItem.description || '-'}</span>
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
                <h2>Редактирование партнёра</h2>
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
                    <label>Телефон</label>
                    <input
                      type="text"
                      value={editItem.phone || ''}
                      onChange={(e) => setEditItem({ ...editItem, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="text"
                      value={editItem.email || ''}
                      onChange={(e) => setEditItem({ ...editItem, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Вебсайт</label>
                    <input
                      type="text"
                      value={editItem.website || ''}
                      onChange={(e) => setEditItem({ ...editItem, website: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>URL логотипа</label>
                    <input
                      type="text"
                      value={editItem.logo || ''}
                      onChange={(e) => setEditItem({ ...editItem, logo: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Комиссия (%)</label>
                    <input
                      type="number"
                      value={editItem.commission_rate}
                      onChange={(e) => setEditItem({ ...editItem, commission_rate: Number(e.target.value) })}
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
                  Вы уверены, что хотите удалить партнёра <strong>{partners.find((p) => p.id === deleteConfirmId)?.name}</strong>?
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
                <h2>Добавить партнёра</h2>
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
                      placeholder="Название компании"
                    />
                  </div>
                  <div className="form-group">
                    <label>Slug *</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => handleFormChange('slug', e.target.value)}
                      placeholder="company-name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Телефон</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                      placeholder="+7 (XXX) XXX-XX-XX"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="text"
                      value={formData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      placeholder="info@example.ru"
                    />
                  </div>
                  <div className="form-group">
                    <label>Вебсайт</label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => handleFormChange('website', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="form-group">
                    <label>URL логотипа</label>
                    <input
                      type="text"
                      value={formData.logo}
                      onChange={(e) => handleFormChange('logo', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Комиссия (%) *</label>
                    <input
                      type="number"
                      value={formData.commission_rate}
                      onChange={(e) => handleFormChange('commission_rate', Number(e.target.value))}
                      placeholder="10"
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
                        Активен
                      </label>
                    </label>
                  </div>
                  <div className="form-group form-group-full">
                    <label>Описание</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      rows={3}
                      placeholder="Описание партнёра..."
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
