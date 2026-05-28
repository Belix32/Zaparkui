import { useState, useEffect, useMemo } from 'react';
import { PartnerLayout } from './PartnerLayout';
import styles from './Partner.module.css';

interface StorageItem {
  id: string;
  booking_id: string;
  car_brand: string;
  car_model: string;
  car_color: string;
  car_license_plate: string;
  check_in_date: string;
  check_out_date: string;
  status: 'pending' | 'in_storage' | 'completed' | 'cancelled';
  partner_name: string;
}

const MOCK_STORAGE: StorageItem[] = [
  { id: 'ST-001', booking_id: 'BK-001', car_brand: 'Toyota', car_model: 'Camry', car_color: 'Чёрный', car_license_plate: 'А123ВВ777', check_in_date: '2026-06-01', check_out_date: '2026-06-07', status: 'in_storage', partner_name: 'АвтоМоре Сочи' },
  { id: 'ST-002', booking_id: 'BK-002', car_brand: 'Kia', car_model: 'Sportage', car_color: 'Белый', car_license_plate: 'В456СС777', check_in_date: '2026-06-10', check_out_date: '2026-06-15', status: 'pending', partner_name: 'АвтоМоре Сочи' },
  { id: 'ST-003', booking_id: 'BK-004', car_brand: 'Nissan', car_model: 'X-Trail', car_color: 'Серый', car_license_plate: 'С789ЕЕ777', check_in_date: '2026-06-05', check_out_date: '2026-06-10', status: 'completed', partner_name: 'Южный Прокат' },
  { id: 'ST-004', booking_id: 'BK-005', car_brand: 'Hyundai', car_model: 'Tucson', car_color: 'Синий', car_license_plate: 'К012РР777', check_in_date: '2026-07-15', check_out_date: '2026-07-22', status: 'pending', partner_name: 'АвтоМоре Сочи' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'pending', label: 'Ожидается' },
  { value: 'in_storage', label: 'На хранении' },
  { value: 'completed', label: 'Завершено' },
  { value: 'cancelled', label: 'Отменено' },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидается',
  in_storage: 'На хранении',
  completed: 'Завершено',
  cancelled: 'Отменено',
};

const ITEMS_PER_PAGE = 20;

export function PartnerStorage() {
  const [storage, setStorage] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewItem, setViewItem] = useState<StorageItem | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStorage(MOCK_STORAGE);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filteredData = useMemo(() => {
    return storage.filter((s) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          s.car_license_plate.toLowerCase().includes(q) ||
          s.car_brand.toLowerCase().includes(q) ||
          s.car_model.toLowerCase().includes(q) ||
          s.booking_id.toLowerCase().includes(q) ||
          s.car_color.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      if (statusFilter && s.status !== statusFilter) return false;
      return true;
    });
  }, [storage, searchQuery, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = useMemo(() => {
    return {
      total: storage.length,
      inStorage: storage.filter((s) => s.status === 'in_storage').length,
      completed: storage.filter((s) => s.status === 'completed').length,
      pending: storage.filter((s) => s.status === 'pending').length,
    };
  }, [storage]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = {
      pending: styles.badgePending,
      in_storage: styles.badgeInStorage,
      completed: styles.badgeCompleted,
      cancelled: styles.badgeCancelled,
    };
    return map[status] || '';
  };

  const handleStatusChange = (id: string, newStatus: StorageItem['status']) => {
    setStorage((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
  };

  if (loading) {
    return (
      <PartnerLayout title="Хранение">
        <div className={styles.loading}>Загрузка...</div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout title="Хранение">
      <div>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔒</div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.total}</span>
              <span className={styles.statLabel}>Всего записей</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconOrange}`}>⏳</div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.pending}</span>
              <span className={styles.statLabel}>Ожидается</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconGreen}`}>📦</div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.inStorage}</span>
              <span className={styles.statLabel}>На хранении</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconPurple}`}>✅</div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.completed}</span>
              <span className={styles.statLabel}>Завершено</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filterBar}>
          <div className={styles.filterRow}>
            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Поиск по госномеру, марке, брони..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label>Статус</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {(searchQuery || statusFilter) && (
              <button
                className={styles.filterReset}
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                }}
              >
                Сбросить
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {filteredData.length === 0 ? (
          <div className={styles.card}>
            <div className={styles.empty}>
              <h3>Записи не найдены</h3>
              <p>
                {searchQuery || statusFilter
                  ? 'Попробуйте изменить параметры поиска.'
                  : 'Запросы на хранение пока отсутствуют.'}
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.card}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Бронь</th>
                    <th>Машина клиента</th>
                    <th>Госномер</th>
                    <th>Заезд</th>
                    <th>Выезд</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className={styles.idCell}>{item.id}</span>
                      </td>
                      <td>
                        <span className={styles.idCell}>{item.booking_id}</span>
                      </td>
                      <td>
                        {item.car_brand} {item.car_model}
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', display: 'block' }}>
                          {item.car_color}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {item.car_license_plate}
                      </td>
                      <td>{formatDate(item.check_in_date)}</td>
                      <td>{formatDate(item.check_out_date)}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${getStatusClass(
                            item.status
                          )}`}
                        >
                          {STATUS_LABELS[item.status] || item.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionsCell}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => setViewItem(item)}
                            title="Детали"
                          >
                            Детали
                          </button>
                          {item.status === 'pending' && (
                            <button
                              className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
                              onClick={() =>
                                handleStatusChange(item.id, 'in_storage')
                              }
                            >
                              Отметить заезд
                            </button>
                          )}
                          {item.status === 'in_storage' && (
                            <button
                              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                              onClick={() =>
                                handleStatusChange(item.id, 'completed')
                              }
                            >
                              Отметить выезд
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.paginationBtn}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ← Назад
                </button>
                <span className={styles.paginationInfo}>
                  Страница {currentPage} из {totalPages} ({filteredData.length}{' '}
                  записей)
                </span>
                <button
                  className={styles.paginationBtn}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Вперёд →
                </button>
              </div>
            )}
          </div>
        )}

        {/* View Modal */}
        {viewItem && (
          <div className={styles.modalOverlay} onClick={() => setViewItem(null)}>
            <div
              className={`${styles.modal} ${styles.modalWide}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>Детали хранения {viewItem.id}</h2>
                <button
                  className={styles.modalClose}
                  onClick={() => setViewItem(null)}
                >
                  ✕
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>ID</span>
                    <span className={styles.detailValue}>{viewItem.id}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Бронирование</span>
                    <span className={styles.detailValue}>
                      {viewItem.booking_id}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Марка</span>
                    <span className={styles.detailValue}>
                      {viewItem.car_brand}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Модель</span>
                    <span className={styles.detailValue}>
                      {viewItem.car_model}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Цвет</span>
                    <span className={styles.detailValue}>
                      {viewItem.car_color}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Госномер</span>
                    <span className={styles.detailValue}>
                      {viewItem.car_license_plate}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Дата заезда</span>
                    <span className={styles.detailValue}>
                      {formatDate(viewItem.check_in_date)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Дата выезда</span>
                    <span className={styles.detailValue}>
                      {formatDate(viewItem.check_out_date)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Статус</span>
                    <span
                      className={`${styles.badge} ${getStatusClass(
                        viewItem.status
                      )}`}
                    >
                      {STATUS_LABELS[viewItem.status]}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Партнёр</span>
                    <span className={styles.detailValue}>
                      {viewItem.partner_name}
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  className={styles.modalBtn}
                  onClick={() => setViewItem(null)}
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PartnerLayout>
  );
}
