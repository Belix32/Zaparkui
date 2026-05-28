import { useState, useEffect, useMemo } from 'react';
import { PartnerLayout } from './PartnerLayout';
import styles from './Partner.module.css';

interface BookingItem {
  id: string;
  client: string;
  car_brand: string;
  car_model: string;
  destination: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  created_at: string;
  has_storage: boolean;
  own_car?: string;
  own_plate?: string;
}

const MOCK_BOOKINGS: BookingItem[] = [
  { id: 'BK-001', client: 'Иван Петров', car_brand: 'Hyundai', car_model: 'Solaris', destination: 'Сочи', start_date: '2026-06-01', end_date: '2026-06-07', total_price: 35000, status: 'active', payment_status: 'paid', created_at: '2026-05-20', has_storage: true, own_car: 'Toyota Camry', own_plate: 'А123ВВ777' },
  { id: 'BK-002', client: 'Мария Иванова', car_brand: 'Kia', car_model: 'Rio', destination: 'Анапа', start_date: '2026-06-10', end_date: '2026-06-15', total_price: 28000, status: 'confirmed', payment_status: 'paid', created_at: '2026-05-19', has_storage: true, own_car: 'Kia Sportage', own_plate: 'В456СС777' },
  { id: 'BK-003', client: 'Алексей Смирнов', car_brand: 'Toyota', car_model: 'Camry', destination: 'Сочи', start_date: '2026-06-20', end_date: '2026-06-28', total_price: 56000, status: 'pending', payment_status: 'pending', created_at: '2026-05-18', has_storage: false },
  { id: 'BK-004', client: 'Елена Козлова', car_brand: 'Renault', car_model: 'Duster', destination: 'Геленджик', start_date: '2026-06-05', end_date: '2026-06-10', total_price: 31000, status: 'completed', payment_status: 'paid', created_at: '2026-05-15', has_storage: true, own_car: 'Nissan X-Trail', own_plate: 'С789ЕЕ777' },
  { id: 'BK-005', client: 'Дмитрий Новиков', car_brand: 'Nissan', car_model: 'Qashqai', destination: 'Сочи', start_date: '2026-07-15', end_date: '2026-07-22', total_price: 42000, status: 'pending', payment_status: 'pending', created_at: '2026-05-25', has_storage: true, own_car: 'Hyundai Tucson', own_plate: 'К012РР777' },
  { id: 'BK-006', client: 'Ольга Соколова', car_brand: 'Volkswagen', car_model: 'Polo', destination: 'Анапа', start_date: '2026-06-15', end_date: '2026-06-20', total_price: 30000, status: 'cancelled', payment_status: 'refunded', created_at: '2026-05-10', has_storage: false },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'pending', label: 'Ожидает' },
  { value: 'confirmed', label: 'Подтверждено' },
  { value: 'active', label: 'Активно' },
  { value: 'completed', label: 'Завершено' },
  { value: 'cancelled', label: 'Отменено' },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтверждено',
  active: 'Активно',
  completed: 'Завершено',
  cancelled: 'Отменено',
};

const PAYMENT_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  paid: 'Оплачено',
  refunded: 'Возврат',
};

const ITEMS_PER_PAGE = 20;

export function PartnerBookings() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewItem, setViewItem] = useState<BookingItem | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBookings(MOCK_BOOKINGS);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filteredData = useMemo(() => {
    return bookings.filter((b) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          b.id.toLowerCase().includes(q) ||
          b.client.toLowerCase().includes(q) ||
          b.car_brand.toLowerCase().includes(q) ||
          b.car_model.toLowerCase().includes(q) ||
          b.destination.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      if (statusFilter && b.status !== statusFilter) return false;
      return true;
    });
  }, [bookings, searchQuery, statusFilter]);

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
      total: bookings.length,
      pending: bookings.filter((b) => b.status === 'pending').length,
      active: bookings.filter((b) => b.status === 'active').length,
      completed: bookings.filter((b) => b.status === 'completed').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    };
  }, [bookings]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
      confirmed: styles.badgeConfirmed,
      active: styles.badgeActive,
      completed: styles.badgeCompleted,
      cancelled: styles.badgeCancelled,
    };
    return map[status] || '';
  };

  const getPaymentClass = (status: string) => {
    const map: Record<string, string> = {
      pending: styles.badgePending,
      paid: styles.badgeConfirmed,
      refunded: styles.badgeCompleted,
    };
    return map[status] || '';
  };

  const handleStatusChange = (id: string, newStatus: BookingItem['status']) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
  };

  if (loading) {
    return (
      <PartnerLayout title="Бронирования">
        <div className={styles.loading}>Загрузка...</div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout title="Бронирования">
      <div>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📋</div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.total}</span>
              <span className={styles.statLabel}>Всего</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconOrange}`}>⏳</div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.pending}</span>
              <span className={styles.statLabel}>Ожидают</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconGreen}`}>🚀</div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.active}</span>
              <span className={styles.statLabel}>Активные</span>
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
                placeholder="Поиск по ID, клиенту, авто..."
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
              <h3>Бронирования не найдены</h3>
              <p>
                {searchQuery || statusFilter
                  ? 'Попробуйте изменить параметры поиска.'
                  : 'Бронирования пока отсутствуют.'}
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
                    <th>Клиент</th>
                    <th>Автомобиль</th>
                    <th>Даты</th>
                    <th>Сумма</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <span className={styles.idCell}>{booking.id}</span>
                      </td>
                      <td>
                        <div className={styles.userCell}>
                          <span className={styles.userCellName}>
                            {booking.client}
                          </span>
                        </div>
                      </td>
                      <td>
                        {booking.car_brand} {booking.car_model}
                      </td>
                      <td>
                        <div className={styles.datesCell}>
                          <span>{formatDate(booking.start_date)}</span>
                          <span className={styles.datesSeparator}>—</span>
                          <span>{formatDate(booking.end_date)}</span>
                        </div>
                      </td>
                      <td className={styles.priceCell}>
                        {formatCurrency(booking.total_price)}
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${getStatusClass(
                            booking.status
                          )}`}
                        >
                          {STATUS_LABELS[booking.status] || booking.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionsCell}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => setViewItem(booking)}
                            title="Детали"
                          >
                            Детали
                          </button>
                          {booking.status === 'pending' && (
                            <>
                              <button
                                className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
                                onClick={() =>
                                  handleStatusChange(booking.id, 'confirmed')
                                }
                              >
                                Подтвердить
                              </button>
                              <button
                                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                onClick={() =>
                                  handleStatusChange(booking.id, 'cancelled')
                                }
                              >
                                Отклонить
                              </button>
                            </>
                          )}
                          {(booking.status === 'confirmed' ||
                            booking.status === 'active') && (
                            <button
                              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                              onClick={() =>
                                handleStatusChange(booking.id, 'completed')
                              }
                            >
                              Завершить
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
                <h2>Детали бронирования {viewItem.id}</h2>
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
                    <span className={styles.detailLabel}>Клиент</span>
                    <span className={styles.detailValue}>{viewItem.client}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Направление</span>
                    <span className={styles.detailValue}>
                      {viewItem.destination}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Автомобиль</span>
                    <span className={styles.detailValue}>
                      {viewItem.car_brand} {viewItem.car_model}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Дата начала</span>
                    <span className={styles.detailValue}>
                      {formatDate(viewItem.start_date)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Дата окончания</span>
                    <span className={styles.detailValue}>
                      {formatDate(viewItem.end_date)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Сумма</span>
                    <span className={`${styles.detailValue} ${styles.detailPrice}`}>
                      {formatCurrency(viewItem.total_price)}
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
                    <span className={styles.detailLabel}>Оплата</span>
                    <span
                      className={`${styles.badge} ${getPaymentClass(
                        viewItem.payment_status
                      )}`}
                    >
                      {PAYMENT_LABELS[viewItem.payment_status]}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Дата создания</span>
                    <span className={styles.detailValue}>
                      {formatDate(viewItem.created_at)}
                    </span>
                  </div>
                  {viewItem.has_storage && (
                    <>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Хранение авто</span>
                        <span className={styles.detailValue}>
                          {viewItem.own_car || '-'}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Госномер</span>
                        <span className={styles.detailValue}>
                          {viewItem.own_plate || '-'}
                        </span>
                      </div>
                    </>
                  )}
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
