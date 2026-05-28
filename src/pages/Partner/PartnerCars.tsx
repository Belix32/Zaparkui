import { useState, useEffect, useMemo } from 'react';
import { PartnerLayout } from './PartnerLayout';
import styles from './Partner.module.css';

interface PartnerCarItem {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  transmission: 'manual' | 'automatic';
  fuel_type: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  seats: number;
  price_per_day: number;
  deposit: number;
  is_available: boolean;
  is_active: boolean;
  description?: string;
}

const MOCK_CARS: PartnerCarItem[] = [
  { id: 'car-1', brand: 'Hyundai', model: 'Solaris', year: 2023, color: 'Белый', transmission: 'automatic', fuel_type: 'gasoline', seats: 5, price_per_day: 2500, deposit: 10000, is_available: true, is_active: true },
  { id: 'car-2', brand: 'Kia', model: 'Rio', year: 2023, color: 'Синий', transmission: 'automatic', fuel_type: 'gasoline', seats: 5, price_per_day: 2800, deposit: 10000, is_available: true, is_active: true },
  { id: 'car-3', brand: 'Toyota', model: 'Camry', year: 2024, color: 'Чёрный', transmission: 'automatic', fuel_type: 'gasoline', seats: 5, price_per_day: 4500, deposit: 20000, is_available: true, is_active: true },
  { id: 'car-4', brand: 'Renault', model: 'Duster', year: 2023, color: 'Зелёный', transmission: 'manual', fuel_type: 'gasoline', seats: 5, price_per_day: 3200, deposit: 15000, is_available: false, is_active: true },
  { id: 'car-5', brand: 'Lada', model: 'Vesta', year: 2024, color: 'Серебристый', transmission: 'manual', fuel_type: 'gasoline', seats: 5, price_per_day: 2000, deposit: 8000, is_available: true, is_active: true },
  { id: 'car-6', brand: 'Nissan', model: 'Qashqai', year: 2023, color: 'Серый', transmission: 'automatic', fuel_type: 'diesel', seats: 5, price_per_day: 3800, deposit: 18000, is_available: true, is_active: true },
  { id: 'car-7', brand: 'Volkswagen', model: 'Polo', year: 2024, color: 'Красный', transmission: 'automatic', fuel_type: 'gasoline', seats: 5, price_per_day: 3000, deposit: 12000, is_available: true, is_active: true },
  { id: 'car-8', brand: 'Mitsubishi', model: 'Outlander', year: 2023, color: 'Тёмно-синий', transmission: 'automatic', fuel_type: 'gasoline', seats: 7, price_per_day: 4200, deposit: 20000, is_available: false, is_active: false },
];

interface CarFormData {
  brand: string;
  model: string;
  year: string;
  color: string;
  transmission: 'manual' | 'automatic';
  fuel_type: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  seats: number;
  price_per_day: number;
  deposit: number;
  description: string;
  is_available: boolean;
}

const emptyForm: CarFormData = {
  brand: '',
  model: '',
  year: '',
  color: '',
  transmission: 'manual',
  fuel_type: 'gasoline',
  seats: 5,
  price_per_day: 0,
  deposit: 0,
  description: '',
  is_available: true,
};

const ITEMS_PER_PAGE = 20;

const TRANSMISSION_LABELS: Record<string, string> = {
  manual: 'Механика',
  automatic: 'Автомат',
};

const FUEL_LABELS: Record<string, string> = {
  gasoline: 'Бензин',
  diesel: 'Дизель',
  electric: 'Электро',
  hybrid: 'Гибрид',
};

export function PartnerCars() {
  const [cars, setCars] = useState<PartnerCarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PartnerCarItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<PartnerCarItem | null>(null);
  const [formData, setFormData] = useState<CarFormData>(emptyForm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCars(MOCK_CARS);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filteredData = useMemo(() => {
    if (!searchQuery) return cars;
    const q = searchQuery.toLowerCase();
    return cars.filter(
      (c) =>
        c.brand.toLowerCase().includes(q) || c.model.toLowerCase().includes(q)
    );
  }, [cars, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalCars = cars.length;
  const availableCount = cars.filter((c) => c.is_available).length;
  const rentedCount = cars.filter(
    (c) => c.is_active && !c.is_available
  ).length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleFormChange = (field: keyof CarFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddItem = () => {
    const newCar: PartnerCarItem = {
      id: 'car-' + Date.now(),
      brand: formData.brand,
      model: formData.model,
      year: Number(formData.year) || new Date().getFullYear(),
      color: formData.color,
      transmission: formData.transmission,
      fuel_type: formData.fuel_type,
      seats: formData.seats,
      price_per_day: formData.price_per_day,
      deposit: formData.deposit,
      is_available: formData.is_available,
      is_active: true,
      description: formData.description || undefined,
    };
    setCars((prev) => [newCar, ...prev]);
    setAddModalOpen(false);
    setFormData(emptyForm);
  };

  const handleUpdateItem = () => {
    if (!editItem) return;
    setCars((prev) => prev.map((c) => (c.id === editItem.id ? editItem : c)));
    setEditItem(null);
  };

  const handleToggleAvailability = (item: PartnerCarItem) => {
    setCars((prev) =>
      prev.map((c) =>
        c.id === item.id ? { ...c, is_available: !c.is_available } : c
      )
    );
  };

  const handleDeleteItem = () => {
    if (!deleteConfirmId) return;
    setCars((prev) => prev.filter((c) => c.id !== deleteConfirmId));
    setDeleteConfirmId(null);
  };

  const openEditModal = (item: PartnerCarItem) => {
    setEditItem(item);
  };

  if (loading) {
    return (
      <PartnerLayout title="Мои авто">
        <div className={styles.loading}>Загрузка...</div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout title="Мои авто">
      <div>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <h2>Управление автомобилями</h2>
          <button
            className={styles.addBtn}
            onClick={() => {
              setFormData(emptyForm);
              setAddModalOpen(true);
            }}
          >
            + Добавить авто
          </button>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🚗</div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{totalCars}</span>
              <span className={styles.statLabel}>Всего</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconGreen}`}>✅</div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{availableCount}</span>
              <span className={styles.statLabel}>Доступно</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconOrange}`}>🔑</div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{rentedCount}</span>
              <span className={styles.statLabel}>В аренде</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconPurple}`}>💰</div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>
                {formatCurrency(
                  cars
                    .filter((c) => c.is_available)
                    .reduce((sum, c) => sum + c.price_per_day, 0)
                )}
              </span>
              <span className={styles.statLabel}>Потенц. доход/день</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className={styles.filterBar}>
          <div className={styles.filterRow}>
            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Поиск по марке или модели..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            {searchQuery && (
              <button
                className={styles.filterReset}
                onClick={() => setSearchQuery('')}
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
              <h3>Автомобили не найдены</h3>
              <p>
                {searchQuery
                  ? 'Попробуйте изменить поисковый запрос.'
                  : 'Добавьте первый автомобиль, нажав на кнопку выше.'}
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.card}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Марка</th>
                    <th>Модель</th>
                    <th>Год</th>
                    <th>КПП</th>
                    <th>Мест</th>
                    <th>Цена/день</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.brand}</td>
                      <td>{item.model}</td>
                      <td>{item.year}</td>
                      <td>{TRANSMISSION_LABELS[item.transmission]}</td>
                      <td>{item.seats}</td>
                      <td className={styles.priceCell}>
                        {formatCurrency(item.price_per_day)}
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            item.is_available
                              ? styles.badgeAvailable
                              : styles.badgeUnavailable
                          }`}
                        >
                          {item.is_available ? 'Доступен' : 'Занят'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionsCell}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => setViewItem(item)}
                            title="Просмотр"
                          >
                            👁
                          </button>
                          <button
                            className={styles.actionBtn}
                            onClick={() => openEditModal(item)}
                            title="Редактировать"
                          >
                            ✏️
                          </button>
                          <button
                            className={`${styles.actionBtn} ${
                              item.is_available
                                ? styles.actionBtnWarning
                                : styles.actionBtnSuccess
                            }`}
                            onClick={() => handleToggleAvailability(item)}
                            title={
                              item.is_available
                                ? 'Сделать недоступным'
                                : 'Сделать доступным'
                            }
                          >
                            {item.is_available ? 'Занять' : 'Освободить'}
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            onClick={() => setDeleteConfirmId(item.id)}
                            title="Удалить"
                          >
                            🗑
                          </button>
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
                <h2>
                  {viewItem.brand} {viewItem.model}
                </h2>
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
                    <span className={styles.detailLabel}>Марка</span>
                    <span className={styles.detailValue}>{viewItem.brand}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Модель</span>
                    <span className={styles.detailValue}>{viewItem.model}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Год</span>
                    <span className={styles.detailValue}>{viewItem.year}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Цвет</span>
                    <span className={styles.detailValue}>{viewItem.color}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Коробка</span>
                    <span className={styles.detailValue}>
                      {TRANSMISSION_LABELS[viewItem.transmission]}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Топливо</span>
                    <span className={styles.detailValue}>
                      {FUEL_LABELS[viewItem.fuel_type]}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Мест</span>
                    <span className={styles.detailValue}>{viewItem.seats}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Цена за день</span>
                    <span className={`${styles.detailValue} ${styles.detailPrice}`}>
                      {formatCurrency(viewItem.price_per_day)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Депозит</span>
                    <span className={styles.detailValue}>
                      {formatCurrency(viewItem.deposit)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Статус</span>
                    <span
                      className={`${styles.badge} ${
                        viewItem.is_available
                          ? styles.badgeAvailable
                          : styles.badgeUnavailable
                      }`}
                    >
                      {viewItem.is_available ? 'Доступен' : 'Занят'}
                    </span>
                  </div>
                  {viewItem.description && (
                    <div className={`${styles.detailItem} ${styles.detailItemFull}`}>
                      <span className={styles.detailLabel}>Описание</span>
                      <span className={styles.detailValue}>
                        {viewItem.description}
                      </span>
                    </div>
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

        {/* Edit Modal */}
        {editItem && (
          <div className={styles.modalOverlay} onClick={() => setEditItem(null)}>
            <div
              className={`${styles.modal} ${styles.modalWide}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>
                  Редактировать: {editItem.brand} {editItem.model}
                </h2>
                <button
                  className={styles.modalClose}
                  onClick={() => setEditItem(null)}
                >
                  ✕
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Марка *</label>
                    <input
                      type="text"
                      value={editItem.brand}
                      onChange={(e) =>
                        setEditItem({ ...editItem, brand: e.target.value })
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Модель *</label>
                    <input
                      type="text"
                      value={editItem.model}
                      onChange={(e) =>
                        setEditItem({ ...editItem, model: e.target.value })
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Год</label>
                    <input
                      type="number"
                      value={editItem.year}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          year: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Цвет</label>
                    <input
                      type="text"
                      value={editItem.color}
                      onChange={(e) =>
                        setEditItem({ ...editItem, color: e.target.value })
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Коробка передач</label>
                    <select
                      value={editItem.transmission}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          transmission: e.target.value as 'manual' | 'automatic',
                        })
                      }
                    >
                      <option value="manual">Механика</option>
                      <option value="automatic">Автомат</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Тип топлива</label>
                    <select
                      value={editItem.fuel_type}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          fuel_type: e.target.value as PartnerCarItem['fuel_type'],
                        })
                      }
                    >
                      <option value="gasoline">Бензин</option>
                      <option value="diesel">Дизель</option>
                      <option value="electric">Электро</option>
                      <option value="hybrid">Гибрид</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Кол-во мест</label>
                    <input
                      type="number"
                      value={editItem.seats}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          seats: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Цена за день (₽)</label>
                    <input
                      type="number"
                      value={editItem.price_per_day}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          price_per_day: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Депозит (₽)</label>
                    <input
                      type="number"
                      value={editItem.deposit}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          deposit: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={editItem.is_available}
                        onChange={(e) =>
                          setEditItem({
                            ...editItem,
                            is_available: e.target.checked,
                          })
                        }
                      />
                      Доступен для бронирования
                    </label>
                  </div>
                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label>Описание</label>
                    <textarea
                      value={editItem.description || ''}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  className={styles.modalBtn}
                  onClick={() => setEditItem(null)}
                >
                  Отмена
                </button>
                <button
                  className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                  onClick={handleUpdateItem}
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {addModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setAddModalOpen(false)}>
            <div
              className={`${styles.modal} ${styles.modalWide}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>Добавить автомобиль</h2>
                <button
                  className={styles.modalClose}
                  onClick={() => setAddModalOpen(false)}
                >
                  ✕
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Марка *</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => handleFormChange('brand', e.target.value)}
                      placeholder="Например: Toyota"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Модель *</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => handleFormChange('model', e.target.value)}
                      placeholder="Например: Camry"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Год</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => handleFormChange('year', e.target.value)}
                      placeholder="2024"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Цвет</label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => handleFormChange('color', e.target.value)}
                      placeholder="Белый"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Коробка передач</label>
                    <select
                      value={formData.transmission}
                      onChange={(e) =>
                        handleFormChange(
                          'transmission',
                          e.target.value as 'manual' | 'automatic'
                        )
                      }
                    >
                      <option value="manual">Механика</option>
                      <option value="automatic">Автомат</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Тип топлива</label>
                    <select
                      value={formData.fuel_type}
                      onChange={(e) =>
                        handleFormChange(
                          'fuel_type',
                          e.target.value as PartnerCarItem['fuel_type']
                        )
                      }
                    >
                      <option value="gasoline">Бензин</option>
                      <option value="diesel">Дизель</option>
                      <option value="electric">Электро</option>
                      <option value="hybrid">Гибрид</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Кол-во мест</label>
                    <input
                      type="number"
                      value={formData.seats}
                      onChange={(e) =>
                        handleFormChange('seats', Number(e.target.value))
                      }
                      placeholder="5"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Цена за день (₽) *</label>
                    <input
                      type="number"
                      value={formData.price_per_day}
                      onChange={(e) =>
                        handleFormChange(
                          'price_per_day',
                          Number(e.target.value)
                        )
                      }
                      placeholder="2500"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Депозит (₽)</label>
                    <input
                      type="number"
                      value={formData.deposit}
                      onChange={(e) =>
                        handleFormChange('deposit', Number(e.target.value))
                      }
                      placeholder="10000"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.is_available}
                        onChange={(e) =>
                          handleFormChange('is_available', e.target.checked)
                        }
                      />
                      Доступен для бронирования
                    </label>
                  </div>
                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label>Описание</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        handleFormChange('description', e.target.value)
                      }
                      rows={3}
                      placeholder="Описание автомобиля..."
                    />
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  className={styles.modalBtn}
                  onClick={() => setAddModalOpen(false)}
                >
                  Отмена
                </button>
                <button
                  className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                  onClick={handleAddItem}
                  disabled={!formData.brand || !formData.model || formData.price_per_day <= 0}
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteConfirmId && (
          <div
            className={styles.modalOverlay}
            onClick={() => setDeleteConfirmId(null)}
          >
            <div
              className={styles.modal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>Подтверждение удаления</h2>
                <button
                  className={styles.modalClose}
                  onClick={() => setDeleteConfirmId(null)}
                >
                  ✕
                </button>
              </div>
              <div className={styles.modalBody}>
                <p className={styles.confirmText}>
                  Вы уверены, что хотите удалить{' '}
                  <strong>
                    {cars.find((c) => c.id === deleteConfirmId)?.brand}{' '}
                    {cars.find((c) => c.id === deleteConfirmId)?.model}
                  </strong>
                  ?
                </p>
                <p className={styles.confirmWarning}>
                  Это действие нельзя отменить!
                </p>
              </div>
              <div className={styles.modalFooter}>
                <button
                  className={styles.modalBtn}
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Отмена
                </button>
                <button
                  className={`${styles.modalBtn} ${styles.modalBtnDanger}`}
                  onClick={handleDeleteItem}
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PartnerLayout>
  );
}
