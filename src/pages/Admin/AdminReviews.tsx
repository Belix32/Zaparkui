import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from './components/AdminLayout';
import { getAllReviewsAdmin, updateReviewStatus as updateReviewStatusDb, deleteReview, Review as SupabaseReview } from '../../lib/supabase';
import { getAllParkingsAdmin } from '../../lib/supabase';
import './AdminReviews.css';

interface Review extends SupabaseReview {
  reject_reason?: string;
}

interface Parking {
  id: string;
  title: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');

  // Modals
  const [viewReview, setViewReview] = useState<Review | null>(null);
  const [rejectModal, setRejectModal] = useState<Review | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reviewsData, parkingsData] = await Promise.all([
        getAllReviewsAdmin(),
        getAllParkingsAdmin()
      ]);
      setReviews(reviewsData);
      setParkings(parkingsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const getParkingTitle = (parkingId: string) => {
    const parking = parkings.find(p => p.id === parkingId);
    return parking?.title || 'Неизвестная парковка';
  };

  const stats = useMemo<Stats>(() => {
    return {
      total: reviews.length,
      pending: reviews.filter(r => r.status === 'pending').length,
      approved: reviews.filter(r => r.status === 'approved').length,
      rejected: reviews.filter(r => r.status === 'rejected').length,
    };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      const parkingTitle = getParkingTitle(review.parking_id).toLowerCase();
      const authorName = (review.author_name || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch = !searchQuery || 
        parkingTitle.includes(query) || 
        authorName.includes(query);
      const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
      const matchesRating = ratingFilter === 'all' || review.rating === ratingFilter;

      return matchesSearch && matchesStatus && matchesRating;
    });
  }, [reviews, searchQuery, statusFilter, ratingFilter, parkings]);

  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReviews.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReviews, currentPage]);

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const handleApprove = async (reviewId: string) => {
    try {
      await updateReviewStatusDb(reviewId, 'approved');
      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { ...r, status: 'approved' } : r
      ));
    } catch (error) {
      console.error('Failed to approve review:', error);
    }
  };

  const handleReject = async () => {
    if (rejectModal && rejectReason.trim()) {
      try {
        await updateReviewStatusDb(rejectModal.id, 'rejected', rejectReason.trim());
        setReviews(prev => prev.map(r => 
          r.id === rejectModal.id 
            ? { ...r, status: 'rejected', reject_reason: rejectReason.trim() } 
            : r
        ));
        setRejectModal(null);
        setRejectReason('');
      } catch (error) {
        console.error('Failed to reject review:', error);
      }
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот отзыв?')) {
      try {
        await deleteReview(reviewId);
        setReviews(prev => prev.filter(r => r.id !== reviewId));
      } catch (error) {
        console.error('Failed to delete review:', error);
      }
    }
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
      <div className="admin-reviews">
        {/* Summary Cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">📝</div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.total}</span>
              <span className="admin-stat-label">Всего отзывов</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon warning">⏳</div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.pending}</span>
              <span className="admin-stat-label">На модерации</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon success">✅</div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.approved}</span>
              <span className="admin-stat-label">Одобрено</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon danger">❌</div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.rejected}</span>
              <span className="admin-stat-label">Отклонено</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-filters">
          <div className="admin-filter-group">
            <input
              type="text"
              placeholder="Поиск по парковке или автору..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="admin-search-input"
            />
          </div>
          <div className="admin-filter-group">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="admin-select"
            >
              <option value="all">Все статусы</option>
              <option value="pending">На модерации</option>
              <option value="approved">Одобрен</option>
              <option value="rejected">Отклонен</option>
            </select>
          </div>
          <div className="admin-filter-group">
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="admin-select"
            >
              <option value="all">Все рейтинги</option>
              <option value="5">5 звёзд</option>
              <option value="4">4 звезды</option>
              <option value="3">3 звезды</option>
              <option value="2">2 звезды</option>
              <option value="1">1 звезда</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Парковка</th>
                <th>Автор</th>
                <th>Рейтинг</th>
                <th>Комментарий</th>
                <th>Дата</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReviews.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-empty">
                    Нет отзывов
                  </td>
                </tr>
              ) : (
                paginatedReviews.map(review => (
                  <tr key={review.id}>
                    <td className="admin-id-cell">{review.id.slice(0, 8)}</td>
                    <td>{getParkingTitle(review.parking_id)}</td>
                    <td>{review.author_name}</td>
                    <td className="admin-stars-cell">{renderStars(review.rating)}</td>
                    <td className="admin-comment-cell">
                      {truncateText(review.comment, 100)}
                    </td>
                    <td>{formatDate(review.created_at)}</td>
                    <td>
                      <span className={`admin-status-badge ${review.status}`}>
                        {review.status === 'pending' && 'На модерации'}
                        {review.status === 'approved' && 'Одобрен'}
                        {review.status === 'rejected' && 'Отклонен'}
                      </span>
                    </td>
                    <td className="admin-actions-cell">
                      <button
                        className="admin-action-btn view"
                        onClick={() => setViewReview(review)}
                        title="Просмотр"
                      >
                        👁️
                      </button>
                      {review.status === 'pending' && (
                        <>
                          <button
                            className="admin-action-btn approve"
                            onClick={() => handleApprove(review.id)}
                            title="Одобрить"
                          >
                            ✓
                          </button>
                          <button
                            className="admin-action-btn reject"
                            onClick={() => setRejectModal(review)}
                            title="Отклонить"
                          >
                            ✗
                          </button>
                        </>
                      )}
                      <button
                        className="admin-action-btn delete"
                        onClick={() => handleDelete(review.id)}
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="admin-pagination">
            <button
              className="admin-page-btn"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Предыдущая
            </button>
            <span className="admin-page-info">
              Страница {currentPage} из {totalPages}
            </span>
            <button
              className="admin-page-btn"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Следующая →
            </button>
          </div>
        )}

        {/* View Modal */}
        {viewReview && (
          <div className="admin-modal-overlay" onClick={() => setViewReview(null)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>Просмотр отзыва</h3>
                <button className="admin-modal-close" onClick={() => setViewReview(null)}>
                  ✕
                </button>
              </div>
              <div className="admin-modal-body">
                <div className="admin-modal-field">
                  <label>Парковка:</label>
                  <span>{getParkingTitle(viewReview.parking_id)}</span>
                </div>
                <div className="admin-modal-field">
                  <label>Автор:</label>
                  <span>{viewReview.author_name}</span>
                </div>
                <div className="admin-modal-field">
                  <label>��ейтинг:</label>
                  <span className="admin-stars-cell">{renderStars(viewReview.rating)}</span>
                </div>
                <div className="admin-modal-field">
                  <label>Комментарий:</label>
                  <p className="admin-modal-comment">{viewReview.comment}</p>
                </div>
                <div className="admin-modal-field">
                  <label>Дата:</label>
                  <span>{formatDate(viewReview.created_at)}</span>
                </div>
                <div className="admin-modal-field">
                  <label>Статус:</label>
                  <span className={`admin-status-badge ${viewReview.status}`}>
                    {viewReview.status === 'pending' && 'На модерации'}
                    {viewReview.status === 'approved' && 'Одобрен'}
                    {viewReview.status === 'rejected' && 'Отклонен'}
                  </span>
                </div>
                {viewReview.reject_reason && (
                  <div className="admin-modal-field">
                    <label>Причина отклонения:</label>
                    <p className="admin-modal-comment reject-reason">{viewReview.reject_reason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {rejectModal && (
          <div className="admin-modal-overlay" onClick={() => setRejectModal(null)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>Отклонение отзыва</h3>
                <button className="admin-modal-close" onClick={() => setRejectModal(null)}>
                  ✕
                </button>
              </div>
              <div className="admin-modal-body">
                <div className="admin-modal-field">
                  <label>Автор:</label>
                  <span>{rejectModal.author_name}</span>
                </div>
                <div className="admin-modal-field">
                  <label>Комментарий:</label>
                  <p className="admin-modal-comment">{truncateText(rejectModal.comment, 150)}</p>
                </div>
                <div className="admin-modal-field">
                  <label>Причина отклонения:</label>
                  <textarea
                    placeholder="Укажите причину отклонения..."
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    className="admin-textarea"
                    rows={4}
                  />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button
                  className="admin-btn cancel"
                  onClick={() => setRejectModal(null)}
                >
                  Отмена
                </button>
                <button
                  className="admin-btn reject-confirm"
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                >
                  Отклонить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}