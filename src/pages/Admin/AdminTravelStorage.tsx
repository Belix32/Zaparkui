import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayout } from './components/AdminLayout';
import { TravelModal, ModalButtons } from './components/TravelModal';
import modalStyles from './components/TravelModal.module.css';
import styles from './AdminTravel.module.css';
import type { CarStorage, RentalPartner } from '../../lib/travel/types';

const MOCK_PARTNERS: RentalPartner[] = [
  { id: 'p1', name: 'Авангард-Авто', slug: 'avangard-avto', description: null, logo: null, phone: null, email: null, website: null, is_active: true, commission_rate: 15, rating: 4.5, created_at: '', updated_at: '' },
  { id: 'p2', name: 'Юг-Авто', slug: 'yug-avto', description: null, logo: null, phone: null, email: null, website: null, is_active: true, commission_rate: 12, rating: 4.2, created_at: '', updated_at: '' },
  { id: 'p3', name: 'Black Sea Rent', slug: 'black-sea-rent', description: null, logo: null, phone: null, email: null, website: null, is_active: true, commission_rate: 20, rating: 4.8, created_at: '', updated_at: '' },
];

const MOCK_STORAGE: CarStorage[] = [
  {
    id: 'cs_001', travel_booking_id: 'tb_0001abc', partner_id: 'p1', location_id: null,
    car_brand: 'Lada', car_model: 'Granta', car_color: 'Белый', car_license_plate: 'К123ММ',
    check_in_date: '2025-06-01T10:00:00Z', check_out_date: '2025-06-07T10:00:00Z',
    actual_check_in: '2025-06-01T09:45:00Z', actual_check_out: null,
    status: 'in_storage', notes: null, created_at: '2025-05-20T14:30:00Z', updated_at: '2025-06-01T09:45:00Z',
  },
  {
    id: 'cs_002', travel_booking_id: 'tb_0003ghi', partner_id: 'p1', location_id: null,
    car_brand: 'Toyota', car_model: 'Camry', car_color: 'Чёрный', car_license_plate: 'О456ОО',
    check_in_date: '2025-06-20T10:00:00Z', check_out_date: '2025-06-28T10:00:00Z',
    actual_check_in: null, actual_check_out: null,
    status: 'pending', notes: null, created_at: '2025-05-18T09:15:00Z', updated_at: '2025-05-18T09:15:00Z',
  },
  {
    id: 'cs_003', travel_booking_id: 'tb_0006pqr', partner_id: 'p1', location_id: null,
    car_brand: 'Renault', car_model: 'Logan', car_color: 'Серый', car_license_plate: 'Р789РР',
    check_in_date: '2025-07-01T10:00:00Z', check_out_date: '2025-07-10T10:00:00Z',
    actual_check_in: null, actual_check_out: null,
    status: 'pending', notes: 'Требуется мойка', created_at: '2025-05-25T08:00:00Z', updated_at: '2025-05-25T08:00:00Z',
  },
  {
    id: 'cs_004', travel_booking_id: 'tb_0004jkl', partner_id: 'p3', location_id: null,
    car_brand: 'BMW', car_model: 'X5', car_color: 'Чёрный', car_license_plate: 'М001ММ',
    check_in_date: '2025-05-10T10:00:00Z', check_out_date: '2025-05-17T10:00:00Z',
    actual_check_in: '2025-05-10T09:30:00Z', actual_check_out: '2025-05-17T11:00:00Z',
    status: 'completed', notes: null, created_at: '2025-04-25T16:45:00Z', updated_at: '2025-05-17T11:00:00Z',
  },
  {
    id: 'cs_005', travel_booking_id: 'tb_0005mno', partner_id: 'p2', location_id: null,
    car_brand: 'Hyundai', car_model: 'Solaris', car_color: 'Белый', car_license_plate: 'Т555ТТ',
    check_in_date: '2025-05-05T10:00:00Z', check_out_date: '2025-05-10T10:00:00Z',
    actual_check_in: '2025-05-05T10:00:00Z', actual_check_out: '2025-05-10T09:00:00Z',
    status: 'cancelled', notes: 'Бронирование отменено', created_at: '2025-04-20T08:30:00Z', updated_at: '2025-05-03T10:00:00Z',
  },
  {
    id: 'cs_006', travel_booking_id: 'tb_0007stu', partner_id: 'p2', location_id: null,
    car_brand: 'Kia', car_model: 'Sportage', car_color: 'Синий', car_license_plate: 'У777УУ',
    check_in_date: '2025-07-15T10:00:00Z', check_out_date: '2025-07-20T10:00:00Z',
    actual_check_in: null, actual_check_out: null,
    status: 'pending', notes: null, created_at: '2025-06-01T12:00:00Z', updated_at: '2025-06-01T12:00:00Z',
  },
  {
    id: 'cs_007', travel_booking_id: 'tb_0002def', partner_id: 'p1', location_id: null,
    car_brand: 'Volkswagen', car_model: 'Polo', car_color: 'Красный', car_license_plate: 'А888АА',
    check_in_date: '2025-06-10T10:00:00Z', check_out_date: '2025-06-15T10:00:00Z',
    actual_check_in: '2025-06-10T09:50:00Z', actual_check_out: null,
    status: 'in_storage', notes: null, created_at: '2025-05-19T11:00:00Z', updated_at: '2025-06-10T09:50:00Z',
  },
  {
    id: 'cs_008', travel_booking_id: 'tb_0008vwx', partner_id: 'p3', location_id: null,
    car_brand: 'Nissan', car_model: 'Qashqai', car_color: 'Серый', car_license_plate: 'В444ВВ',
    check_in_date: '2025-08-01T10:00:00Z', check_out_date: '2025-08-14T10:00:00Z',
    actual_check_in: null, actual_check_out: null,
    status: 'pending', notes: null, created_at: '2025-06-15T15:00:00Z', updated_at: '2025-06-15T15:00:00Z',
  },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  in_storage: 'На хранении',
  completed: 'Завершено',
  cancelled: 'Отменено',
};

const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'pending', label: 'Ожидает' },
  { value: 'in_storage', label: 'На хранении' },
  { value: 'completed', label: 'Завершено' },
  { value: 'cancelled', label: 'Отменено' },
];

const ITEMS_PER_PAGE = 20;

export function AdminTravelStorage() {
  const { hasAdminAccess } = useAuth();
  const navigate = useNavigate();

  const [storage, setStorage] = useState<CarStorage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewItem, setViewItem] = useState<CarStorage | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editStatusItem, setEditStatusItem] = useState<CarStorage | null>(null);
  const [editStatusValue, setEditStatusValue] = useState<string>('');

  if (!hasAdminAccess) {
    return <Navigate to="/admin-login" />;
  }

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setStorage(MOCK_STORAGE);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const getPartnerName = (partnerId: string) => {
    return MOCK_PARTNERS.find((p) => p.id === partnerId)?.name || partnerId;
  };

  const getDisplayCar = (item: CarStorage) => {
    return [item.car_brand, item.car_model].filter(Boolean).join(' ') || '-';
  };

  const filteredData = useMemo(() => {
    return storage.filter((s) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !s.car_license_plate.toLowerCase().includes(q) &&
          !getDisplayCar(s).toLowerCase().includes(q) &&
          !s.id.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (statusFilter && s.status !== statusFilter) return false;
      return true;
    });
  }, [storage, searchQuery, statusFilter]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: storage.length,
      inStorage: storage.filter((s) => s.status === 'in_storage').length,
      completed: storage.filter((s) => s.status === 'completed').length,
    };
  }, [storage]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const handleStatusChange = (itemId: string, newStatus: string) => {
    setStorage((prev) =>
      prev.map((s) =>
        s.id === itemId ? { ...s, status: newStatus as CarStorage['status'] } : s
      )
    );
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
      <div className="admin-bookings">
        <div className="admin-page-header">
          <h2>Управление хранением</h2>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.total}</span>
              <span className="admin-stat-label">Всего записей</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.inStorage}</span>
              <span className="admin-stat-label">На хранении</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.completed}</span>
              <span className="admin-stat-label">Завершено</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <div className="admin-filters">
            <div className="admin-filters-row">
              <div className="admin-filter-group">
                <label>Поиск</label>
                <input
                  type="text"
                  placeholder="Госномер, марка, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="admin-filter-group">
                <label>Статус</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <button
                className="admin-filter-reset"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                  setCurrentPage(1);
                }}
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="admin-card">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID брони</th>
                  <th>Автомобиль</th>
                  <th>Госномер</th>
                  <th>Партнёр</th>
                  <th>Заезд</th>
                  <th>Выезд</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="admin-empty" style={{ textAlign: 'center' }}>Нет записей хранения</td>
                  </tr>
                ) : (
                  paginatedData.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="admin-id">{item.travel_booking_id.slice(0, 8)}</span>
                      </td>
                      <td className="parking-title">{getDisplayCar(item)}</td>
                      <td className="parking-id">{item.car_license_plate}</td>
                      <td>{getPartnerName(item.partner_id)}</td>
                      <td className="parking-date">{formatDate(item.check_in_date)}</td>
                      <td className="parking-date">{formatDate(item.check_out_date)}</td>
                      <td>
                        <span className={`${styles.travelBadge} ${
                          item.status === 'in_storage'
                            ? styles.travelBadgeInStorage
                            : styles['travelBadge' + item.status.charAt(0).toUpperCase() + item.status.slice(1)]
                        }`}>
                          {STATUS_LABELS[item.status]}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions-cell">
                          <button
                            className="admin-action-btn admin-action-view"
                            onClick={() => { setViewItem(item); setShowModal(true); }}
                            title="Подробнее"
                          >
                            Детали
                          </button>
                          <button
                            className="admin-action-btn admin-action-view"
                            onClick={() => { setEditStatusItem(item); setEditStatusValue(item.status); }}
                            title="Изменить статус"
                          >
                            Статус
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <button
                className="admin-pagination-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ← Назад
              </button>
              <span className="admin-pagination-info">
                Страница {currentPage} из {totalPages} ({filteredData.length} записей)
              </span>
              <button
                className="admin-pagination-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Вперёд →
              </button>
            </div>
          )}
        </div>

        {/* View Storage Details Modal */}
        <TravelModal
          isOpen={showModal && !!viewItem}
          onClose={() => setShowModal(false)}
          title="Детали хранения"
          subtitle={`Запись: ${viewItem?.id || ''}`}
          icon="🏗️"
          size="wide"
          footer={
            <div style={{ display: 'flex', gap: 12 }}>
              {ModalButtons.close(() => setShowModal(false))}
            </div>
          }
        >
          {viewItem && (
            <div className={modalStyles.detailGrid}>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>ID записи</span>
                <span className={modalStyles.detailValue}>{viewItem.id}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>ID бронирования</span>
                <span className={modalStyles.detailValue}>{viewItem.travel_booking_id}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Автомобиль</span>
                <span className={modalStyles.detailValue}>{getDisplayCar(viewItem)}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Госномер</span>
                <span className={modalStyles.detailValue}>{viewItem.car_license_plate}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Цвет</span>
                <span className={modalStyles.detailValue}>{viewItem.car_color || '-'}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Партнёр</span>
                <span className={modalStyles.detailValue}>{getPartnerName(viewItem.partner_id)}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>План заезда</span>
                <span className={modalStyles.detailValue}>{formatDateTime(viewItem.check_in_date)}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>План выезда</span>
                <span className={modalStyles.detailValue}>{formatDateTime(viewItem.check_out_date)}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Факт. заезд</span>
                <span className={modalStyles.detailValue}>{viewItem.actual_check_in ? formatDateTime(viewItem.actual_check_in) : '—'}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Факт. выезд</span>
                <span className={modalStyles.detailValue}>{viewItem.actual_check_out ? formatDateTime(viewItem.actual_check_out) : '—'}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Статус</span>
                <span className={`${modalStyles.badge} ${
                  viewItem.status === 'in_storage' ? modalStyles.badgeInStorage :
                  modalStyles['badge' + viewItem.status.charAt(0).toUpperCase() + viewItem.status.slice(1)]
                }`}>
                  {STATUS_LABELS[viewItem.status]}
                </span>
              </div>
              <div className={`${modalStyles.detailItem} ${modalStyles.detailItemFull}`}>
                <span className={modalStyles.detailLabel}>Примечания</span>
                <span className={modalStyles.detailValue}>{viewItem.notes || '-'}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Дата создания</span>
                <span className={modalStyles.detailValue}>{formatDateTime(viewItem.created_at)}</span>
              </div>
            </div>
          )}
        </TravelModal>

        {/* Edit Status Modal */}
        <TravelModal
          isOpen={!!editStatusItem}
          onClose={() => setEditStatusItem(null)}
          title="Изменение статуса хранения"
          subtitle={editStatusItem ? `Авто: ${getDisplayCar(editStatusItem)}` : ''}
          icon="🔄"
          size="default"
          footer={
            <div style={{ display: 'flex', gap: 12 }}>
              {ModalButtons.cancel(() => setEditStatusItem(null))}
              {ModalButtons.save(
                () => {
                  if (editStatusItem) {
                    handleStatusChange(editStatusItem.id, editStatusValue);
                    setEditStatusItem(null);
                  }
                },
                false,
                'Изменить статус'
              )}
            </div>
          }
        >
          {editStatusItem && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className={modalStyles.detailGrid}>
                <div className={modalStyles.detailItem}>
                  <span className={modalStyles.detailLabel}>Текущий статус</span>
                  <span className={`${modalStyles.badge} ${
                    editStatusItem.status === 'in_storage' ? modalStyles.badgeInStorage :
                    modalStyles['badge' + editStatusItem.status.charAt(0).toUpperCase() + editStatusItem.status.slice(1)]
                  }`}>
                    {STATUS_LABELS[editStatusItem.status]}
                  </span>
                </div>
                <div className={modalStyles.detailItem}>
                  <span className={modalStyles.detailLabel}>Госномер</span>
                  <span className={modalStyles.detailValue}>{editStatusItem.car_license_plate}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className={modalStyles.formLabel}>Новый статус</label>
                <select
                  className={modalStyles.statusSelect}
                  value={editStatusValue}
                  onChange={(e) => setEditStatusValue(e.target.value)}
                >
                  <option value="pending">Ожидает</option>
                  <option value="in_storage">На хранении</option>
                  <option value="completed">Завершено</option>
                  <option value="cancelled">Отменено</option>
                </select>
              </div>
            </div>
          )}
        </TravelModal>
      </div>
    </AdminLayout>
  );
}
