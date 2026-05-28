import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayout } from './components/AdminLayout';
import { TravelModal, ModalButtons } from './components/TravelModal';
import modalStyles from './components/TravelModal.module.css';
import styles from './AdminTravel.module.css';
import type { TravelBooking, TravelDestination, RentalPartner, PartnerCar } from '../../lib/travel/types';

const MOCK_DESTINATIONS: TravelDestination[] = [
  { id: 'd1', name: 'Сочи', slug: 'sochi', description: null, image: null, region: null, latitude: null, longitude: null, is_active: true, sort_order: 1, created_at: '', updated_at: '' },
  { id: 'd2', name: 'Анапа', slug: 'anapa', description: null, image: null, region: null, latitude: null, longitude: null, is_active: true, sort_order: 2, created_at: '', updated_at: '' },
  { id: 'd3', name: 'Геленджик', slug: 'gelendzhik', description: null, image: null, region: null, latitude: null, longitude: null, is_active: true, sort_order: 3, created_at: '', updated_at: '' },
  { id: 'd4', name: 'Новороссийск', slug: 'novorossiysk', description: null, image: null, region: null, latitude: null, longitude: null, is_active: true, sort_order: 4, created_at: '', updated_at: '' },
];

const MOCK_PARTNERS: RentalPartner[] = [
  { id: 'p1', name: 'Авангард-Авто', slug: 'avangard-avto', description: null, logo: null, phone: null, email: null, website: null, is_active: true, commission_rate: 15, rating: 4.5, created_at: '', updated_at: '' },
  { id: 'p2', name: 'Юг-Авто', slug: 'yug-avto', description: null, logo: null, phone: null, email: null, website: null, is_active: true, commission_rate: 12, rating: 4.2, created_at: '', updated_at: '' },
  { id: 'p3', name: 'Black Sea Rent', slug: 'black-sea-rent', description: null, logo: null, phone: null, email: null, website: null, is_active: true, commission_rate: 20, rating: 4.8, created_at: '', updated_at: '' },
];

const MOCK_CARS: PartnerCar[] = [
  { id: 'c1', partner_id: 'p1', location_id: null, brand: 'Hyundai', model: 'Solaris', year: 2023, color: 'Белый', license_plate: 'А123ВВ', transmission: 'automatic', fuel_type: 'gasoline', seats: 5, price_per_day: 2500, deposit: 10000, image: null, images: [], description: null, is_available: true, is_active: true, created_at: '', updated_at: '' },
  { id: 'c2', partner_id: 'p1', location_id: null, brand: 'Kia', model: 'Rio', year: 2024, color: 'Синий', license_plate: 'А456ВВ', transmission: 'automatic', fuel_type: 'gasoline', seats: 5, price_per_day: 2800, deposit: 12000, image: null, images: [], description: null, is_available: true, is_active: true, created_at: '', updated_at: '' },
  { id: 'c3', partner_id: 'p2', location_id: null, brand: 'Lada', model: 'Vesta', year: 2023, color: 'Чёрный', license_plate: 'В789СС', transmission: 'manual', fuel_type: 'gasoline', seats: 5, price_per_day: 1800, deposit: 8000, image: null, images: [], description: null, is_available: true, is_active: true, created_at: '', updated_at: '' },
  { id: 'c4', partner_id: 'p3', location_id: null, brand: 'Toyota', model: 'Camry', year: 2024, color: 'Белый', license_plate: 'С345НН', transmission: 'automatic', fuel_type: 'gasoline', seats: 5, price_per_day: 4500, deposit: 20000, image: null, images: [], description: null, is_available: true, is_active: true, created_at: '', updated_at: '' },
];

const MOCK_BOOKINGS: TravelBooking[] = [
  {
    id: 'tb_0001abc', user_id: 'u1', destination_id: 'd1', partner_id: 'p1', car_id: 'c1', location_id: null,
    start_date: '2025-06-01T10:00:00Z', end_date: '2025-06-07T10:00:00Z',
    rental_price_per_day: 2500, total_rental_days: 6, total_rental_price: 15000,
    has_storage: true, storage_price_per_day: 500, total_storage_days: 6, total_storage_price: 3000,
    own_car_brand: 'Lada', own_car_model: 'Granta', own_car_color: 'Белый', own_car_license_plate: 'К123ММ',
    total_price: 18000, commission_price: 2700,
    status: 'active', payment_status: 'paid', payment_method: 'card', payment_id: 'pay_001', notes: null,
    created_at: '2025-05-20T14:30:00Z', updated_at: '2025-05-20T14:30:00Z',
    destination: MOCK_DESTINATIONS[0], partner: MOCK_PARTNERS[0], car: MOCK_CARS[0],
  },
  {
    id: 'tb_0002def', user_id: 'u2', destination_id: 'd2', partner_id: 'p2', car_id: 'c3', location_id: null,
    start_date: '2025-06-10T10:00:00Z', end_date: '2025-06-15T10:00:00Z',
    rental_price_per_day: 1800, total_rental_days: 5, total_rental_price: 9000,
    has_storage: false, storage_price_per_day: 0, total_storage_days: null, total_storage_price: 0,
    own_car_brand: null, own_car_model: null, own_car_color: null, own_car_license_plate: null,
    total_price: 9000, commission_price: 1080,
    status: 'confirmed', payment_status: 'pending', payment_method: null, payment_id: null, notes: null,
    created_at: '2025-05-19T11:00:00Z', updated_at: '2025-05-19T11:00:00Z',
    destination: MOCK_DESTINATIONS[1], partner: MOCK_PARTNERS[1], car: MOCK_CARS[2],
  },
  {
    id: 'tb_0003ghi', user_id: 'u3', destination_id: 'd3', partner_id: 'p1', car_id: 'c2', location_id: null,
    start_date: '2025-06-20T10:00:00Z', end_date: '2025-06-28T10:00:00Z',
    rental_price_per_day: 2800, total_rental_days: 8, total_rental_price: 22400,
    has_storage: true, storage_price_per_day: 600, total_storage_days: 8, total_storage_price: 4800,
    own_car_brand: 'Toyota', own_car_model: 'Camry', own_car_color: 'Чёрный', own_car_license_plate: 'О456ОО',
    total_price: 27200, commission_price: 4080,
    status: 'pending', payment_status: 'pending', payment_method: null, payment_id: null, notes: 'Нужен детский автокресло',
    created_at: '2025-05-18T09:15:00Z', updated_at: '2025-05-18T09:15:00Z',
    destination: MOCK_DESTINATIONS[2], partner: MOCK_PARTNERS[0], car: MOCK_CARS[1],
  },
  {
    id: 'tb_0004jkl', user_id: 'u1', destination_id: 'd1', partner_id: 'p3', car_id: 'c4', location_id: null,
    start_date: '2025-05-10T10:00:00Z', end_date: '2025-05-17T10:00:00Z',
    rental_price_per_day: 4500, total_rental_days: 7, total_rental_price: 31500,
    has_storage: false, storage_price_per_day: 0, total_storage_days: null, total_storage_price: 0,
    own_car_brand: null, own_car_model: null, own_car_color: null, own_car_license_plate: null,
    total_price: 31500, commission_price: 6300,
    status: 'completed', payment_status: 'paid', payment_method: 'card', payment_id: 'pay_002', notes: null,
    created_at: '2025-04-25T16:45:00Z', updated_at: '2025-05-17T10:00:00Z',
    destination: MOCK_DESTINATIONS[0], partner: MOCK_PARTNERS[2], car: MOCK_CARS[3],
  },
  {
    id: 'tb_0005mno', user_id: 'u4', destination_id: 'd4', partner_id: 'p2', car_id: 'c3', location_id: null,
    start_date: '2025-05-05T10:00:00Z', end_date: '2025-05-10T10:00:00Z',
    rental_price_per_day: 1800, total_rental_days: 5, total_rental_price: 9000,
    has_storage: false, storage_price_per_day: 0, total_storage_days: null, total_storage_price: 0,
    own_car_brand: null, own_car_model: null, own_car_color: null, own_car_license_plate: null,
    total_price: 9000, commission_price: 1080,
    status: 'cancelled', payment_status: 'refunded', payment_method: 'card', payment_id: 'pay_003', notes: 'Передумал',
    created_at: '2025-04-20T08:30:00Z', updated_at: '2025-05-03T10:00:00Z',
    destination: MOCK_DESTINATIONS[3], partner: MOCK_PARTNERS[1], car: MOCK_CARS[2],
  },
  {
    id: 'tb_0006pqr', user_id: 'u5', destination_id: 'd2', partner_id: 'p1', car_id: 'c1', location_id: null,
    start_date: '2025-07-01T10:00:00Z', end_date: '2025-07-10T10:00:00Z',
    rental_price_per_day: 2500, total_rental_days: 9, total_rental_price: 22500,
    has_storage: true, storage_price_per_day: 500, total_storage_days: 9, total_storage_price: 4500,
    own_car_brand: 'Renault', own_car_model: 'Logan', own_car_color: 'Серый', own_car_license_plate: 'Р789РР',
    total_price: 27000, commission_price: 4050,
    status: 'pending', payment_status: 'pending', payment_method: null, payment_id: null, notes: null,
    created_at: '2025-05-25T08:00:00Z', updated_at: '2025-05-25T08:00:00Z',
    destination: MOCK_DESTINATIONS[1], partner: MOCK_PARTNERS[0], car: MOCK_CARS[0],
  },
  {
    id: 'tb_0007stu', user_id: 'u2', destination_id: 'd1', partner_id: 'p3', car_id: 'c4', location_id: null,
    start_date: '2025-07-15T10:00:00Z', end_date: '2025-07-20T10:00:00Z',
    rental_price_per_day: 4500, total_rental_days: 5, total_rental_price: 22500,
    has_storage: false, storage_price_per_day: 0, total_storage_days: null, total_storage_price: 0,
    own_car_brand: null, own_car_model: null, own_car_color: null, own_car_license_plate: null,
    total_price: 22500, commission_price: 4500,
    status: 'confirmed', payment_status: 'paid', payment_method: 'card', payment_id: 'pay_004', notes: null,
    created_at: '2025-06-01T12:00:00Z', updated_at: '2025-06-01T12:00:00Z',
    destination: MOCK_DESTINATIONS[0], partner: MOCK_PARTNERS[2], car: MOCK_CARS[3],
  },
  {
    id: 'tb_0008vwx', user_id: 'u6', destination_id: 'd3', partner_id: 'p2', car_id: 'c3', location_id: null,
    start_date: '2025-08-01T10:00:00Z', end_date: '2025-08-14T10:00:00Z',
    rental_price_per_day: 1800, total_rental_days: 13, total_rental_price: 23400,
    has_storage: false, storage_price_per_day: 0, total_storage_days: null, total_storage_price: 0,
    own_car_brand: null, own_car_model: null, own_car_color: null, own_car_license_plate: null,
    total_price: 23400, commission_price: 2808,
    status: 'pending', payment_status: 'pending', payment_method: null, payment_id: null, notes: null,
    created_at: '2025-06-15T15:00:00Z', updated_at: '2025-06-15T15:00:00Z',
    destination: MOCK_DESTINATIONS[2], partner: MOCK_PARTNERS[1], car: MOCK_CARS[2],
  },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'pending', label: 'Ожидает' },
  { value: 'confirmed', label: 'Подтверждено' },
  { value: 'active', label: 'Активно' },
  { value: 'completed', label: 'Завершено' },
  { value: 'cancelled', label: 'Отменено' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'Все статусы оплаты' },
  { value: 'pending', label: 'Ожидает' },
  { value: 'paid', label: 'Оплачено' },
  { value: 'refunded', label: 'Возврат' },
  { value: 'partially_refunded', label: 'Частичный возврат' },
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
  partially_refunded: 'Частичный возврат',
};

const ITEMS_PER_PAGE = 20;

export function AdminTravelBookings() {
  const { hasAdminAccess } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<TravelBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<TravelBooking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editStatusBooking, setEditStatusBooking] = useState<TravelBooking | null>(null);
  const [editStatusValue, setEditStatusValue] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  if (!hasAdminAccess) {
    return <Navigate to="/admin-login" />;
  }

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setBookings(MOCK_BOOKINGS);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const getDestinationName = (booking: TravelBooking) => {
    return booking.destination?.name || MOCK_DESTINATIONS.find((d) => d.id === booking.destination_id)?.name || '-';
  };

  const getPartnerName = (booking: TravelBooking) => {
    return booking.partner?.name || MOCK_PARTNERS.find((p) => p.id === booking.partner_id)?.name || '-';
  };

  const getCarDisplay = (booking: TravelBooking) => {
    if (booking.car) return `${booking.car.brand} ${booking.car.model}`;
    const car = MOCK_CARS.find((c) => c.id === booking.car_id);
    return car ? `${car.brand} ${car.model}` : '-';
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const destinationName = getDestinationName(b).toLowerCase();
        const partnerName = getPartnerName(b).toLowerCase();
        const carDisplay = getCarDisplay(b).toLowerCase();
        if (
          !b.id.toLowerCase().includes(q) &&
          !destinationName.includes(q) &&
          !partnerName.includes(q) &&
          !carDisplay.includes(q)
        ) {
          return false;
        }
      }
      if (statusFilter && b.status !== statusFilter) return false;
      if (paymentFilter && b.payment_status !== paymentFilter) return false;
      if (destinationFilter && b.destination_id !== destinationFilter) return false;
      if (dateFrom && new Date(b.start_date).getTime() < new Date(dateFrom).getTime()) return false;
      if (dateTo && new Date(b.end_date).getTime() > new Date(dateTo).getTime()) return false;
      return true;
    });
  }, [bookings, searchQuery, statusFilter, paymentFilter, destinationFilter, dateFrom, dateTo]);

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, paymentFilter, destinationFilter, dateFrom, dateTo]);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      active: bookings.filter((b) => b.status === 'active' || b.status === 'confirmed').length,
      completed: bookings.filter((b) => b.status === 'completed').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
      revenue: bookings
        .filter((b) => b.payment_status === 'paid')
        .reduce((sum, b) => sum + (b.total_price || 0), 0),
    };
  }, [bookings]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency', currency: 'RUB', maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleStatusChange = (bookingId: string, newStatus: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: newStatus as TravelBooking['status'] } : b
      )
    );
  };

  const handlePaymentStatusChange = (bookingId: string, newPaymentStatus: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, payment_status: newPaymentStatus as TravelBooking['payment_status'] } : b
      )
    );
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
        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.total}</span>
              <span className="admin-stat-label">Всего бронирований</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.active}</span>
              <span className="admin-stat-label">Активных сейчас</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.completed}</span>
              <span className="admin-stat-label">Завершено</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.cancelled}</span>
              <span className="admin-stat-label">Отменено</span>
            </div>
          </div>
        </div>

        {/* Revenue stat row */}
        <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
          <div className="admin-stat-card">
            <div className="admin-stat-content">
              <span className="admin-stat-value">{formatCurrency(stats.revenue)}</span>
              <span className="admin-stat-label">Общая выручка</span>
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
                  placeholder="ID, направление, партнёр..."
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

              <div className="admin-filter-group">
                <label>Оплата</label>
                <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                  {PAYMENT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="admin-filter-group">
                <label>Направление</label>
                <select value={destinationFilter} onChange={(e) => setDestinationFilter(e.target.value)}>
                  <option value="">Все направления</option>
                  {MOCK_DESTINATIONS.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="admin-filter-group">
                <label>С</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>

              <div className="admin-filter-group">
                <label>По</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>

              <button
                className="admin-filter-reset"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                  setPaymentFilter('');
                  setDestinationFilter('');
                  setDateFrom('');
                  setDateTo('');
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
                  <th>ID</th>
                  <th>Направление</th>
                  <th>Партнёр</th>
                  <th>Авто</th>
                  <th>Даты</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th>Оплата</th>
                  <th>Дата брони</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="admin-empty" style={{ textAlign: 'center' }}>Нет бронирований</td>
                  </tr>
                ) : (
                  paginatedBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="admin-id-cell">
                        <span className="admin-id">{booking.id.slice(0, 8)}</span>
                      </td>
                      <td>{getDestinationName(booking)}</td>
                      <td>{getPartnerName(booking)}</td>
                      <td>{getCarDisplay(booking)}</td>
                      <td>
                        <div className={styles.travelDatesCell}>
                          <span>{formatDate(booking.start_date)}</span>
                          <span className={styles.travelDatesSeparator}>—</span>
                          <span>{formatDate(booking.end_date)}</span>
                        </div>
                      </td>
                      <td className={styles.travelPriceCell}>{formatCurrency(booking.total_price || 0)}</td>
                      <td>
                        <span className={`${styles.travelBadge} ${styles['travelBadge' + booking.status.charAt(0).toUpperCase() + booking.status.slice(1)]}`}>
                          {STATUS_LABELS[booking.status]}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.travelPaymentBadge} ${styles['travelPaymentBadge' + booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)]}`}>
                          {PAYMENT_LABELS[booking.payment_status]}
                        </span>
                      </td>
                      <td className="parking-date">{formatDateTime(booking.created_at)}</td>
                      <td>
                        <div className="admin-actions-cell">
                          <button
                            className="admin-action-btn admin-action-view"
                            onClick={() => { setSelectedBooking(booking); setShowModal(true); }}
                            title="Подробнее"
                          >
                            Детали
                          </button>
                          <button
                            className="admin-action-btn admin-action-view"
                            onClick={() => { setEditStatusBooking(booking); setEditStatusValue(booking.status); }}
                            title="Изменить статус"
                          >
                            Статус
                          </button>
                          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                            <button
                              className="admin-action-btn admin-action-cancel"
                              onClick={() => handleCancelBooking(booking.id)}
                              title="Отменить"
                            >
                              Отмена
                            </button>
                          )}
                          {booking.payment_status === 'paid' && (booking.status === 'cancelled' || booking.status === 'completed') && (
                            <button
                              className="admin-action-btn admin-action-refund"
                              onClick={() => handleRefund(booking.id)}
                              title="Вернуть"
                            >
                              Возврат
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

        {/* View Booking Details Modal */}
        <TravelModal
          isOpen={showModal && !!selectedBooking}
          onClose={() => setShowModal(false)}
          title="Детали бронирования"
          subtitle={`ID: ${selectedBooking?.id || ''}`}
          icon="📋"
          size="wide"
          footer={
            <div style={{ display: 'flex', gap: 12 }}>
              {ModalButtons.close(() => setShowModal(false))}
            </div>
          }
        >
          {selectedBooking && (
            <div className={modalStyles.detailGrid}>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>ID бронирования</span>
                <span className={modalStyles.detailValue}>{selectedBooking.id}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Направление</span>
                <span className={modalStyles.detailValue}>{getDestinationName(selectedBooking)}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Партнёр</span>
                <span className={modalStyles.detailValue}>{getPartnerName(selectedBooking)}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Автомобиль</span>
                <span className={modalStyles.detailValue}>{getCarDisplay(selectedBooking)}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Дата заезда</span>
                <span className={modalStyles.detailValue}>{formatDateTime(selectedBooking.start_date)}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Дата выезда</span>
                <span className={modalStyles.detailValue}>{formatDateTime(selectedBooking.end_date)}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Дней аренды</span>
                <span className={modalStyles.detailValue}>{selectedBooking.total_rental_days}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Цена аренды</span>
                <span className={`${modalStyles.detailValue} ${modalStyles.detailValueHighlight}`}>{formatCurrency(selectedBooking.total_rental_price)}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Хранение авто</span>
                <span className={modalStyles.detailValue}>
                  {selectedBooking.has_storage ? `Да (${selectedBooking.total_storage_days} дн.)` : 'Нет'}
                </span>
              </div>
              {selectedBooking.has_storage && (
                <>
                  <div className={modalStyles.detailItem}>
                    <span className={modalStyles.detailLabel}>Своё авто</span>
                    <span className={modalStyles.detailValue}>
                      {[selectedBooking.own_car_brand, selectedBooking.own_car_model].filter(Boolean).join(' ') || '-'}
                    </span>
                  </div>
                  <div className={modalStyles.detailItem}>
                    <span className={modalStyles.detailLabel}>Госномер</span>
                    <span className={modalStyles.detailValue}>{selectedBooking.own_car_license_plate || '-'}</span>
                  </div>
                  <div className={modalStyles.detailItem}>
                    <span className={modalStyles.detailLabel}>Цвет</span>
                    <span className={modalStyles.detailValue}>{selectedBooking.own_car_color || '-'}</span>
                  </div>
                </>
              )}
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Статус</span>
                <span className={`${modalStyles.badge} ${modalStyles['badge' + selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)]}`}>
                  {STATUS_LABELS[selectedBooking.status]}
                </span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Статус оплаты</span>
                <span className={`${modalStyles.badge} ${
                  selectedBooking.payment_status === 'paid' ? modalStyles.badgePaid :
                  selectedBooking.payment_status === 'refunded' ? modalStyles.badgeRefunded :
                  modalStyles.badgePending
                }`}>
                  {PAYMENT_LABELS[selectedBooking.payment_status]}
                </span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Общая сумма</span>
                <span className={modalStyles.priceValue}>{formatCurrency(selectedBooking.total_price || 0)}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Комиссия</span>
                <span className={modalStyles.detailValue}>{formatCurrency(selectedBooking.commission_price)}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Метод оплаты</span>
                <span className={modalStyles.detailValue}>{selectedBooking.payment_method || '-'}</span>
              </div>
              <div className={`${modalStyles.detailItem} ${modalStyles.detailItemFull}`}>
                <span className={modalStyles.detailLabel}>Примечания</span>
                <span className={modalStyles.detailValue}>{selectedBooking.notes || '-'}</span>
              </div>
              <div className={modalStyles.detailItem}>
                <span className={modalStyles.detailLabel}>Дата создания</span>
                <span className={modalStyles.detailValue}>{formatDateTime(selectedBooking.created_at)}</span>
              </div>
            </div>
          )}
        </TravelModal>

        {/* Edit Status Modal */}
        <TravelModal
          isOpen={!!editStatusBooking}
          onClose={() => setEditStatusBooking(null)}
          title="Изменение статуса"
          subtitle={editStatusBooking ? `Бронирование #${editStatusBooking.id.slice(0, 8)}` : ''}
          icon="🔄"
          size="default"
          footer={
            <div style={{ display: 'flex', gap: 12 }}>
              {ModalButtons.cancel(() => setEditStatusBooking(null))}
              {ModalButtons.save(
                () => {
                  if (editStatusBooking) {
                    handleStatusChange(editStatusBooking.id, editStatusValue);
                    setEditStatusBooking(null);
                  }
                },
                false,
                'Изменить статус'
              )}
            </div>
          }
        >
          {editStatusBooking && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className={modalStyles.detailGrid}>
                <div className={modalStyles.detailItem}>
                  <span className={modalStyles.detailLabel}>Текущий статус</span>
                  <span className={`${modalStyles.badge} ${modalStyles['badge' + editStatusBooking.status.charAt(0).toUpperCase() + editStatusBooking.status.slice(1)]}`}>
                    {STATUS_LABELS[editStatusBooking.status]}
                  </span>
                </div>
                <div className={modalStyles.detailItem}>
                  <span className={modalStyles.detailLabel}>Оплата</span>
                  <span className={`${modalStyles.badge} ${
                    editStatusBooking.payment_status === 'paid' ? modalStyles.badgePaid :
                    editStatusBooking.payment_status === 'refunded' ? modalStyles.badgeRefunded :
                    modalStyles.badgePending
                  }`}>
                    {PAYMENT_LABELS[editStatusBooking.payment_status]}
                  </span>
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
                  <option value="confirmed">Подтверждено</option>
                  <option value="active">Активно</option>
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
