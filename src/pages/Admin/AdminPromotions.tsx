import { useState, useEffect } from 'react';
import { AdminLayout } from './components/AdminLayout';
import {
  Promotion,
  getAllPromotionsAdmin,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from '../../lib/supabase';
import './AdminPromotions.css';

const defaultBgColor = '#2563eb';
const defaultTextColor = '#ffffff';

export function AdminPromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formLinkUrl, setFormLinkUrl] = useState('');
  const [formLinkText, setFormLinkText] = useState('');
  const [formBgColor, setFormBgColor] = useState(defaultBgColor);
  const [formTextColor, setFormTextColor] = useState(defaultTextColor);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formStartsAt, setFormStartsAt] = useState('');
  const [formEndsAt, setFormEndsAt] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllPromotionsAdmin();
      setPromotions(data);
    } catch (err) {
      console.error('Error loading promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormDesc('');
    setFormImageUrl('');
    setFormLinkUrl('');
    setFormLinkText('');
    setFormBgColor(defaultBgColor);
    setFormTextColor(defaultTextColor);
    setFormIsActive(true);
    setFormSortOrder(promotions.length);
    setFormStartsAt(new Date().toISOString().slice(0, 16));
    setFormEndsAt('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (p: Promotion) => {
    setEditingId(p.id);
    setFormTitle(p.title || '');
    setFormDesc(p.description || '');
    setFormImageUrl(p.image_url || '');
    setFormLinkUrl(p.link_url || '');
    setFormLinkText(p.link_text || '');
    setFormBgColor(p.bg_color || defaultBgColor);
    setFormTextColor(p.text_color || defaultTextColor);
    setFormIsActive(p.is_active);
    setFormSortOrder(p.sort_order);
    setFormStartsAt(p.starts_at ? p.starts_at.slice(0, 16) : '');
    setFormEndsAt(p.ends_at ? p.ends_at.slice(0, 16) : '');
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formTitle && !formDesc && !formImageUrl) {
      setFormError('Заполните хотя бы одно из полей:标题, описание или изображение');
      return;
    }

    setSaving(true);
    setFormError('');

    const payload = {
      title: formTitle || undefined,
      description: formDesc || undefined,
      image_url: formImageUrl || undefined,
      link_url: formLinkUrl || undefined,
      link_text: formLinkText || undefined,
      bg_color: formBgColor,
      text_color: formTextColor,
      is_active: formIsActive,
      sort_order: formSortOrder,
      starts_at: formStartsAt ? new Date(formStartsAt).toISOString() : null,
      ends_at: formEndsAt ? new Date(formEndsAt).toISOString() : null,
    };

    try {
      if (editingId) {
        const updated = await updatePromotion(editingId, payload);
        setPromotions((prev) =>
          prev.map((p) => (p.id === editingId ? updated : p))
        );
      } else {
        const created = await createPromotion(payload);
        setPromotions((prev) => [...prev, created]);
      }
      setShowModal(false);
    } catch (err: any) {
      setFormError(err?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePromotion(deleteId);
      setPromotions((prev) => prev.filter((p) => p.id !== deleteId));
      setDeleteId(null);
    } catch (err: any) {
      console.error('Error deleting promotion:', err);
    }
  };

  const handleToggleActive = async (p: Promotion) => {
    const newActive = !p.is_active;
    setPromotions((prev) =>
      prev.map((item) =>
        item.id === p.id ? { ...item, is_active: newActive } : item
      )
    );
    try {
      await updatePromotion(p.id, { is_active: newActive });
    } catch {
      setPromotions((prev) =>
        prev.map((item) =>
          item.id === p.id ? { ...item, is_active: p.is_active } : item
        )
      );
    }
  };

  const now = new Date().getTime();
  const activeCount = promotions.filter((p) => {
    if (!p.is_active) return false;
    if (p.starts_at && new Date(p.starts_at).getTime() > now) return false;
    if (p.ends_at && new Date(p.ends_at).getTime() < now) return false;
    return true;
  }).length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-loading">Загрузка...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-promotions">
        {/* Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="admin-stat-value">{promotions.length}</span>
            <span className="admin-stat-label">Всего акций</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{activeCount}</span>
            <span className="admin-stat-label">Активных сейчас</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="admin-toolbar">
          <h2>Акции и предложения</h2>
          <button className="admin-btn admin-btn-primary" onClick={openCreateModal}>
            + Создать акцию
          </button>
        </div>

        {/* Table */}
        <table className="admin-table">
          <thead>
            <tr>
              <th>Сортировка</th>
              <th>Заголовок</th>
              <th>Описание</th>
              <th>Активна</th>
              <th>Даты</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {promotions.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-empty">
                  Нет акций. Нажмите «Создать акцию», чтобы добавить.
                </td>
              </tr>
            ) : (
              promotions.map((p) => {
                const isExpired =
                  p.ends_at && new Date(p.ends_at).getTime() < now;
                const isScheduled =
                  p.starts_at && new Date(p.starts_at).getTime() > now;
                const statusClass = !p.is_active
                  ? 'status-inactive'
                  : isExpired
                  ? 'status-inactive'
                  : 'status-active';

                return (
                  <tr key={p.id}>
                    <td>{p.sort_order}</td>
                    <td>
                      <div className="admin-promo-title-cell">
                        {p.image_url && (
                          <img
                            src={p.image_url}
                            alt=""
                            className="admin-promo-thumb"
                          />
                        )}
                        <span className="admin-promo-color-dot"
                          style={{ backgroundColor: p.bg_color }}
                        />
                        {p.title || <em style={{ opacity: 0.5 }}>Без标题</em>}
                      </div>
                    </td>
                    <td className="admin-promo-desc-cell">
                      {p.description || '—'}
                    </td>
                    <td>
                      <span className={`admin-status-badge ${statusClass}`}>
                        {!p.is_active
                          ? 'Выкл'
                          : isExpired
                          ? 'Истекла'
                          : isScheduled
                          ? 'Запланирована'
                          : 'Активна'}
                      </span>
                    </td>
                    <td className="admin-promo-dates">
                      {p.starts_at
                        ? new Date(p.starts_at).toLocaleDateString('ru-RU')
                        : '—'}
                      {' → '}
                      {p.ends_at
                        ? new Date(p.ends_at).toLocaleDateString('ru-RU')
                        : '∞'}
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-btn admin-btn-small"
                          onClick={() => openEditModal(p)}
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        <button
                          className="admin-btn admin-btn-small"
                          onClick={() => handleToggleActive(p)}
                          title={p.is_active ? 'Деактивировать' : 'Активировать'}
                        >
                          {p.is_active ? '⏸️' : '▶️'}
                        </button>
                        <button
                          className="admin-btn admin-btn-small admin-btn-danger"
                          onClick={() => setDeleteId(p.id)}
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
            <div className="modal-content admin-promo-modal" onClick={(e) => e.stopPropagation()}>
              <h3>{editingId ? 'Редактировать акцию' : 'Создать акцию'}</h3>

              {formError && <div className="admin-form-error">{formError}</div>}

              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Заголовок</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Скидка 20% на парковку"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Порядок сортировки</label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Описание</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Подробное описание акции..."
                  rows={2}
                />
              </div>

              <div className="admin-form-group">
                <label>URL изображения</label>
                <input
                  type="text"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                />
              </div>

              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Ссылка (URL)</label>
                  <input
                    type="text"
                    value={formLinkUrl}
                    onChange={(e) => setFormLinkUrl(e.target.value)}
                    placeholder="https://example.com/offer"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Текст кнопки</label>
                  <input
                    type="text"
                    value={formLinkText}
                    onChange={(e) => setFormLinkText(e.target.value)}
                    placeholder="Подробнее"
                  />
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Цвет фона</label>
                  <div className="admin-color-group">
                    <input
                      type="color"
                      value={formBgColor}
                      onChange={(e) => setFormBgColor(e.target.value)}
                    />
                    <input
                      type="text"
                      value={formBgColor}
                      onChange={(e) => setFormBgColor(e.target.value)}
                    />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Цвет текста</label>
                  <div className="admin-color-group">
                    <input
                      type="color"
                      value={formTextColor}
                      onChange={(e) => setFormTextColor(e.target.value)}
                    />
                    <input
                      type="text"
                      value={formTextColor}
                      onChange={(e) => setFormTextColor(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Начало показа</label>
                  <input
                    type="datetime-local"
                    value={formStartsAt}
                    onChange={(e) => setFormStartsAt(e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Окончание показа</label>
                  <input
                    type="datetime-local"
                    value={formEndsAt}
                    onChange={(e) => setFormEndsAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                  />
                  Активна
                </label>
              </div>

              {/* Preview */}
              {formTitle || formDesc || formImageUrl ? (
                <div className="admin-promo-preview">
                  <label>Предпросмотр:</label>
                  <div
                    className="admin-promo-preview-box"
                    style={{
                      backgroundColor: formBgColor,
                      color: formTextColor,
                    }}
                  >
                    <div className="admin-promo-preview-content">
                      {formImageUrl && (
                        <img
                          src={formImageUrl}
                          alt=""
                          className="admin-promo-preview-img"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        {formTitle && <strong>{formTitle}</strong>}
                        {formDesc && <p>{formDesc}</p>}
                      </div>
                      {formLinkUrl && (
                        <span
                          className="admin-promo-preview-link"
                          style={{
                            color: formTextColor,
                            borderColor: formTextColor,
                          }}
                        >
                          {formLinkText || 'Подробнее'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="modal-actions">
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Сохранение...' : editingId ? 'Сохранить' : 'Создать'}
                </button>
                <button
                  className="admin-btn admin-btn-ghost"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteId && (
          <div className="modal-overlay" onClick={() => setDeleteId(null)}>
            <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
              <h3>Подтверждение удаления</h3>
              <p>Вы уверены, что хотите удалить эту акцию?</p>
              <div className="modal-actions">
                <button className="admin-btn admin-btn-danger" onClick={handleDelete}>
                  Удалить
                </button>
                <button className="admin-btn admin-btn-ghost" onClick={() => setDeleteId(null)}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
