import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayout } from './components/AdminLayout';
import { TravelModal, ModalButtons } from './components/TravelModal';
import modalStyles from './components/TravelModal.module.css';
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
        <TravelModal
          isOpen={!!viewItem}
          onClose={() => setViewItem(null)}
          title={viewItem?.name || 'Информация о партнёре'}
          subtitle="Детальная информация о партнёре"
          icon="🏢"
          size="wide"
          footer={
            <div style={{ display: 'flex', gap: 12 }}>
              {ModalButtons.close(() => setViewItem(null))}
            </div>
          }
        >
          {viewItem && (
            <>
              {viewItem.logo && (
                <div className={modalStyles.imagePreview}>
                  <img src={viewItem.logo} alt={viewItem.name} />
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
                  <span className={modalStyles.detailLabel}>Телефон</span>
                  <span className={modalStyles.detailValue}>{viewItem.phone || '-'}</span>
                </div>
                <div className={modalStyles.detailItem}>
                  <span className={modalStyles.detailLabel}>Email</span>
                  <span className={modalStyles.detailValue}>{viewItem.email || '-'}</span>
                </div>
                <div className={modalStyles.detailItem}>
                  <span className={modalStyles.detailLabel}>Вебсайт</span>
                  <span className={modalStyles.detailValue}>{viewItem.website || '-'}</span>
                </div>
                <div className={modalStyles.detailItem}>
                  <span className={modalStyles.detailLabel}>Рейтинг</span>
                  <span className={modalStyles.detailValue}>
                    <span className={styles.travelRating}>
                      {viewItem.rating > 0 ? '★'.repeat(Math.round(viewItem.rating)) + ' ' + viewItem.rating.toFixed(1) : 'Нет'}
                    </span>
                  </span>
                </div>
                <div className={modalStyles.detailItem}>
                  <span className={modalStyles.detailLabel}>Комиссия</span>
                  <span className={modalStyles.detailValue}>{viewItem.commission_rate}%</span>
                </div>
                <div className={modalStyles.detailItem}>
                  <span className={modalStyles.detailLabel}>Статус</span>
                  <span className={`${modalStyles.badge} ${viewItem.is_active ? modalStyles.badgeActive : modalStyles.badgeCancelled}`}>
                    {viewItem.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
                <div className={`${modalStyles.detailItem} ${modalStyles.detailItemFull}`}>
                  <span className={modalStyles.detailLabel}>Описание</span>
                  <span className={modalStyles.detailValue}>{viewItem.description || '-'}</span>
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
          title="Редактирование партнёра"
          subtitle="Измените данные партнёра"
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
                <label className={modalStyles.formLabel}>Телефон</label>
                <input
                  className={modalStyles.formInput}
                  type="text"
                  value={editItem.phone || ''}
                  onChange={(e) => setEditItem({ ...editItem, phone: e.target.value })}
                />
              </div>
              <div className={modalStyles.formGroup}>
                <label className={modalStyles.formLabel}>Email</label>
                <input
                  className={modalStyles.formInput}
                  type="text"
                  value={editItem.email || ''}
                  onChange={(e) => setEditItem({ ...editItem, email: e.target.value })}
                />
              </div>
              <div className={modalStyles.formGroup}>
                <label className={modalStyles.formLabel}>Вебсайт</label>
                <input
                  className={modalStyles.formInput}
                  type="text"
                  value={editItem.website || ''}
                  onChange={(e) => setEditItem({ ...editItem, website: e.target.value })}
                />
              </div>
              <div className={modalStyles.formGroup}>
                <label className={modalStyles.formLabel}>URL логотипа</label>
                <input
                  className={modalStyles.formInput}
                  type="text"
                  value={editItem.logo || ''}
                  onChange={(e) => setEditItem({ ...editItem, logo: e.target.value })}
                />
              </div>
              <div className={modalStyles.formGroup}>
                <label className={modalStyles.formLabel}>Комиссия (%)</label>
                <input
                  className={modalStyles.formInput}
                  type="number"
                  value={editItem.commission_rate}
                  onChange={(e) => setEditItem({ ...editItem, commission_rate: Number(e.target.value) })}
                />
              </div>
              <div className={modalStyles.formGroup}>
                <label className={modalStyles.formLabel}>Статус</label>
                <select
                  className={modalStyles.formSelect}
                  value={editItem.is_active ? 'active' : 'inactive'}
                  onChange={(e) => setEditItem({ ...editItem, is_active: e.target.value === 'active' })}
                >
                  <option value="active">Активен</option>
                  <option value="inactive">Неактивен</option>
                </select>
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
            Вы уверены, что хотите удалить партнёра <strong>{partners.find((p) => p.id === deleteConfirmId)?.name}</strong>?
          </p>
          <p className={modalStyles.confirmWarning}>Это действие нельзя отменить!</p>
        </TravelModal>

        {/* Add Modal */}
        <TravelModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          title="Добавить партнёра"
          subtitle="Зарегистрируйте нового партнёра"
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
                placeholder="Название компании"
              />
            </div>
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.formLabel}>Slug <span className={modalStyles.formRequired}>*</span></label>
              <input
                className={modalStyles.formInput}
                type="text"
                value={formData.slug}
                onChange={(e) => handleFormChange('slug', e.target.value)}
                placeholder="company-name"
              />
            </div>
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.formLabel}>Телефон</label>
              <input
                className={modalStyles.formInput}
                type="text"
                value={formData.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
                placeholder="+7 (XXX) XXX-XX-XX"
              />
            </div>
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.formLabel}>Email</label>
              <input
                className={modalStyles.formInput}
                type="text"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                placeholder="info@example.ru"
              />
            </div>
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.formLabel}>Вебсайт</label>
              <input
                className={modalStyles.formInput}
                type="text"
                value={formData.website}
                onChange={(e) => handleFormChange('website', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.formLabel}>URL логотипа</label>
              <input
                className={modalStyles.formInput}
                type="text"
                value={formData.logo}
                onChange={(e) => handleFormChange('logo', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className={modalStyles.formGroup}>
              <label className={modalStyles.formLabel}>Комиссия (%) <span className={modalStyles.formRequired}>*</span></label>
              <input
                className={modalStyles.formInput}
                type="number"
                value={formData.commission_rate}
                onChange={(e) => handleFormChange('commission_rate', Number(e.target.value))}
                placeholder="10"
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
                <span className={modalStyles.formCheckboxLabel}>Активен</span>
              </label>
            </div>
            <div className={`${modalStyles.formGroup} ${modalStyles.formGroupFull}`}>
              <label className={modalStyles.formLabel}>Описание</label>
              <textarea
                className={modalStyles.formTextarea}
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                rows={3}
                placeholder="Описание партнёра..."
              />
            </div>
          </div>
        </TravelModal>
      </div>
    </AdminLayout>
  );
}
