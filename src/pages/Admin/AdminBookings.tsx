import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from './components/AdminLayout';
import { getAllBookingsAdmin, updateBookingAdmin, Booking as SupabaseBooking } from '../../lib/supabase';
import './AdminBookings.css';

interface Booking extends SupabaseBooking {
  parking?: { title: string; address: string };
  user?: { email: string; name: string };
}

interface Parking {
  id: string;
  title: string;
}

interface Filters {
  search: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

const ITEMS_PER_PAGE = 20;

const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'pending', label: 'Ожидает' },
  { value: 'confirmed', label: 'Подтверждено' },
  { value: 'active', label: 'Активно' },
  { value: 'cancelled', label: 'Отменено' },
  { value: 'completed', label: 'Завершено' },
];

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedBookings = await getAllBookingsAdmin();
      setBookings(fetchedBookings);
      // Extract unique parkings from bookings for parking titles
      const uniqueParkings = fetchedBookings
        .filter((b) => b.parking_id && b.parking)
        .map((b) => ({ id: b.parking_id, title: b.parking?.title || 'Unknown' }));
      setParkings(uniqueParkings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getParkingTitle = (booking: Booking) => {
    if (booking.parking?.title) return booking.parking.title;
    const localParking = parkings.find((p) => p.id === booking.parking_id);
    return localParking?.title || `Парковка #${booking.parking_id.slice(0, 8)}`;
  };

  const getCarDisplay = (booking: Booking) => {
    if (booking.car_number) return booking.car_number;
    if (booking.car_brand || booking.car_model) {
      return [booking.car_brand, booking.car_model].filter(Boolean).join(' ');
    }
    return '-';
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

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getBookingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hourly: 'Почасовая',
      daily: 'Посуточная',
      monthly: 'Месячная',
    };
    return labels[type] || type;
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const parkingTitle = getParkingTitle(booking).toLowerCase();
        const userEmail = (booking.user?.email || '').toLowerCase();
        const userName = (booking.user?.name || '').toLowerCase();
        const carDisplay = getCarDisplay(booking).toLowerCase();

        if (
          !parkingTitle.includes(searchLower) &&
          !userEmail.includes(searchLower) &&
          !userName.includes(searchLower) &&
          !carDisplay.includes(searchLower)
        ) {
          return false;
        }
      }

      // Status filter
      if (filters.status && booking.status !== filters.status) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom) {
        const bookingStart = new Date(booking.start_date).getTime();
        const fromDate = new Date(filters.dateFrom).getTime();
        if (bookingStart < fromDate) return false;
      }

      if (filters.dateTo) {
        const bookingEnd = new Date(booking.end_date).getTime();
        const toDate = new Date(filters.dateTo).getTime();
        if (bookingEnd > toDate) return false;
      }

      return true;
    });
  }, [bookings, filters, parkings]);

  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      active: bookings.filter((b) => b.status === 'active' || b.status === 'confirmed').length,
      pending: bookings.filter((b) => b.status === 'pending').length,
      revenue: bookings
        .filter((b) => b.payment_status === 'paid')
        .reduce((sum, b) => sum + (b.total_price || 0), 0),
    };
  }, [bookings]);

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      await updateBookingAdmin(bookingId, { status: newStatus as Booking['status'] });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: newStatus as Booking['status'] } : b
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Ошибка при обновлении статуса');
    }
  };

  const handlePaymentStatusChange = async (bookingId: string, newPaymentStatus: string) => {
    try {
      await updateBookingAdmin(bookingId, { payment_status: newPaymentStatus as Booking['payment_status'] });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, payment_status: newPaymentStatus as Booking['payment_status'] } : b
        )
      );
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Ошибка при обновлении статуса оплаты');
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    if (!confirm('Вы уверены, что хотите отменить бронирование?')) return;
    handleStatusChange(bookingId, 'cancelled');
  };

  const handleRefund = (bookingId: string) => {
    if (!confirm('Вы уверены, что хотите сделать возврат?')) return;
    handlePaymentStatusChange(bookingId, 'refunded');
    handleStatusChange(bookingId, 'cancelled');
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
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">📅</div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.total}</span>
              <span className="admin-stat-label">Всего бронирований</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">✅</div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.active}</span>
              <span className="admin-stat-label">Активных сейчас</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">⏳</div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.pending}</span>
              <span className="admin-stat-label">Ожидают подтверждения</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">💰</div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{formatCurrency(stats.revenue)}</span>
              <span className="admin-stat-label">Общая выручка</span>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-filters">
            <div className="admin-filters-row">
              <div className="admin-filter-group">
                <label>Поиск</label>
                <input
                  type="text"
                  placeholder="Парковка, email, авто..."
                  value={filters.search}
                  onChange={(e) => {
                    setFilters({ ...filters, search: e.target.value });
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="admin-filter-group">
                <label>Статус</label>
                <select
                  value={filters.status}
                  onChange={(e) => {
                    setFilters({ ...filters, status: e.target.value });
                    setCurrentPage(1);
                  }}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-filter-group">
                <label>С</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => {
                    setFilters({ ...filters, dateFrom: e.target.value });
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="admin-filter-group">
                <label>По</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => {
                    setFilters({ ...filters, dateTo: e.target.value });
                    setCurrentPage(1);
                  }}
                />
              </div>

              <button
                className="admin-filter-reset"
                onClick={() => {
                  setFilters({ search: '', status: '', dateFrom: '', dateTo: '' });
                  setCurrentPage(1);
                }}
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Парковка</th>
                  <th>Клиент</th>
                  <th>Авто</th>
                  <th>Даты</th>
                  <th>Тип</th>
                  <th>Статус</th>
                  <th>Оплата</th>
                  <th>Сумма</th>
                  <th>Дата брони</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="admin-empty">
                      Нет бронирований
                    </td>
                  </tr>
                ) : (
                  paginatedBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="admin-id-cell">
                        <span className="admin-id">{booking.id.slice(0, 8)}</span>
                      </td>
                      <td>{getParkingTitle(booking)}</td>
                      <td>
                        <div className="admin-user-cell">
                          {booking.user?.name && (
                            <span className="admin-user-name">{booking.user?.name}</span>
                          )}
                          <span className="admin-user-email">{booking.user?.email || '-'}</span>
                        </div>
                      </td>
                      <td>{getCarDisplay(booking)}</td>
                      <td>
                        <div className="admin-dates-cell">
                          <span>{formatDate(booking.start_date)}</span>
                          <span className="admin-dates-separator">—</span>
                          <span>{formatDate(booking.end_date)}</span>
                        </div>
                      </td>
                      <td>{getBookingTypeLabel(booking.booking_type)}</td>
                      <td>
                        <span className={`admin-badge admin-status-badge admin-status-${booking.status}`}>
                          {booking.status === 'pending' && 'Ожидает'}
                          {booking.status === 'confirmed' && 'Подтверждено'}
                          {booking.status === 'active' && 'Активно'}
                          {booking.status === 'cancelled' && 'Отменено'}
                          {booking.status === 'completed' && 'Завершено'}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge admin-payment-badge admin-payment-${booking.payment_status}`}>
                          {booking.payment_status === 'pending' && 'Ожидает'}
                          {booking.payment_status === 'paid' && 'Оплачено'}
                          {booking.payment_status === 'refunded' && 'Возврат'}
                        </span>
                      </td>
                      <td className="admin-price-cell">{formatCurrency(booking.total_price || 0)}</td>
                      <td>{formatDateTime(booking.created_at)}</td>
                      <td>
                        <div className="admin-actions-cell">
                          <button
                            className="admin-action-btn admin-action-view"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowModal(true);
                            }}
                            title="Подробнее"
                          >
                            👁️
                          </button>
                          <select
                            className="admin-status-select"
                            value={booking.status}
                            onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                          >
                            <option value="pending">Ожидает</option>
                            <option value="confirmed">Подтвердить</option>
                            <option value="active">Активировать</option>
                            <option value="completed">Завершить</option>
                            <option value="cancelled">Отменить</option>
                          </select>
                          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                            <button
                              className="admin-action-btn admin-action-cancel"
                              onClick={() => handleCancelBooking(booking.id)}
                              title="Отменить"
                            >
                              ❌
                            </button>
                          )}
                          {booking.payment_status === 'paid' && (booking.status === 'cancelled' || booking.status === 'completed') && (
                            <button
                              className="admin-action-btn admin-action-refund"
                              onClick={() => handleRefund(booking.id)}
                              title="Вернуть"
                            >
                              💵
                            </button>
                          )}
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
                Страница {currentPage} из {totalPages} ({filteredBookings.length} записей)
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

        {showModal && selectedBooking && (
          <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>Детали бронирования</h3>
                <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                  ✕
                </button>
              </div>
              <div className="admin-modal-content">
                <div className="admin-modal-grid">
                  <div className="admin-modal-item">
                    <span className="admin-modal-label">ID</span>
                    <span className="admin-modal-value">{selectedBooking.id}</span>
                  </div>
                  <div className="admin-modal-item">
                    <span className="admin-modal-label">Парковка</span>
                    <span className="admin-modal-value">{getParkingTitle(selectedBooking)}</span>
                  </div>
                  <div className="admin-modal-item">
                    <span className="admin-modal-label">Клиент</span>
                    <span className="admin-modal-value">
                      {selectedBooking.user?.name || '—'}
                      <br />
                      <span className="admin-modal-sub">{selectedBooking.user?.email || '—'}</span>
                    </span>
                  </div>
                  <div className="admin-modal-item">
                    <span className="admin-modal-label">Автомобиль</span>
                    <span className="admin-modal-value">
                      {getCarDisplay(selectedBooking)}
                    </span>
                  </div>
                  <div className="admin-modal-item">
                    <span className="admin-modal-label">Дата начала</span>
                    <span className="admin-modal-value">{formatDateTime(selectedBooking.start_date)}</span>
                  </div>
                  <div className="admin-modal-item">
                    <span className="admin-modal-label">Дата окончания</span>
                    <span className="admin-modal-value">{formatDateTime(selectedBooking.end_date)}</span>
                  </div>
                  <div className="admin-modal-item">
                    <span className="admin-modal-label">Тип бронирования</span>
                    <span className="admin-modal-value">{getBookingTypeLabel(selectedBooking.booking_type)}</span>
                  </div>
                  <div className="admin-modal-item">
                    <span className="admin-modal-label">Статус</span>
                    <span className={`admin-badge admin-status-badge admin-status-${selectedBooking.status}`}>
                      {selectedBooking.status === 'pending' && 'Ожидает'}
                      {selectedBooking.status === 'confirmed' && 'Подтверждено'}
                      {selectedBooking.status === 'active' && 'Активно'}
                      {selectedBooking.status === 'cancelled' && 'Отменено'}
                      {selectedBooking.status === 'completed' && 'Завершено'}
                    </span>
                  </div>
                  <div className="admin-modal-item">
                    <span className="admin-modal-label">Статус оплаты</span>
                    <span className={`admin-badge admin-payment-badge admin-payment-${selectedBooking.payment_status}`}>
                      {selectedBooking.payment_status === 'pending' && 'Ожидает'}
                      {selectedBooking.payment_status === 'paid' && 'Оплачено'}
                      {selectedBooking.payment_status === 'refunded' && 'Возврат'}
                    </span>
                  </div>
                  <div className="admin-modal-item">
                    <span className="admin-modal-label">Сумма</span>
                    <span className="admin-modal-value admin-modal-price">
                      {formatCurrency(selectedBooking.total_price || 0)}
                    </span>
                  </div>
                  <div className="admin-modal-item">
                    <span className="admin-modal-label">Дата создания</span>
                    <span className="admin-modal-value">{formatDateTime(selectedBooking.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}