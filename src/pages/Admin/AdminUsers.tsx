import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from './components/AdminLayout';
import { getAllUsers, updateUserRole, setUserBlocked, deleteUser } from '../../lib/supabase';
import './AdminUsers.css';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'moderator' | 'admin';
  is_blocked?: boolean;
  created_at?: string;
}

interface UserStats {
  totalUsers: number;
  adminsCount: number;
  moderatorsCount: number;
  blockedCount: number;
}

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [parkings, setParkings] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Modal state
  const [viewModalUser, setViewModalUser] = useState<User | null>(null);
  const [editRoleUser, setEditRoleUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedUsers, storedParkings, storedBookings] = await Promise.all([
        getAllUsers(),
        Promise.resolve(JSON.parse(localStorage.getItem('zaparkyi_parkings') || '[]')),
        Promise.resolve(JSON.parse(localStorage.getItem('zaparkyi_bookings') || '[]'))
      ]);
      
      setUsers(fetchedUsers as User[]);
      setParkings(storedParkings);
      setBookings(storedBookings);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getStats = (): UserStats => {
    return {
      totalUsers: users.length,
      adminsCount: users.filter(u => u.role === 'admin').length,
      moderatorsCount: users.filter(u => u.role === 'moderator').length,
      blockedCount: users.filter(u => u.is_blocked).length,
    };
  };
  
  const getUserParkingsCount = (userId: string) => {
    return parkings.filter(p => p.owner_id === userId || p.user_id === userId).length;
  };
  
  const getUserBookingsCount = (userId: string) => {
    return bookings.filter(b => b.user_id === userId).length;
  };
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  
  // Filter and paginate users
  const filteredUsers = useMemo(() => {
    let filtered = [...users];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query)
      );
    }
    
    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }
    
    return filtered;
  }, [users, searchQuery, roleFilter]);
  
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);
  
  // Actions
  const handleToggleBlock = async (user: User) => {
    const newBlockedState = !user.is_blocked;
    
    // Optimistic update
    setUsers(users.map(u => 
      u.id === user.id ? { ...u, is_blocked: newBlockedState } : u
    ));
    
    try {
      await setUserBlocked(user.id, newBlockedState);
    } catch (error) {
      console.error('Error toggling block:', error);
      // Revert on error
      setUsers(users);
    }
  };
  
  const handleUpdateRole = async (userId: string, newRole: 'user' | 'moderator' | 'admin') => {
    // Optimistic update
    setUsers(users.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    ));
    
    try {
      await updateUserRole(userId, newRole);
      setEditRoleUser(null);
    } catch (error) {
      console.error('Error updating role:', error);
      // Revert on error - would need to refetch
      loadData();
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    // Optimistic update
    const previousUsers = users;
    setUsers(users.filter(u => u.id !== userId));
    
    try {
      await deleteUser(userId);
      setDeleteConfirmUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      // Revert on error
      setUsers(previousUsers);
    }
  };
  
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'role-admin';
      case 'moderator': return 'role-moderator';
      default: return 'role-user';
    }
  };
  
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Админ';
      case 'moderator': return 'Модератор';
      default: return 'Пользователь';
    }
  };
  
  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-loading">Загрузка...</div>
      </AdminLayout>
    );
  }
  
  const stats = getStats();
  
  return (
    <AdminLayout>
      <div className="admin-users">
        {/* Stats Cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon"></div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.totalUsers}</span>
              <span className="admin-stat-label">Всего пользователей</span>
            </div>
          </div>
          
          <div className="admin-stat-card">
            <div className="admin-stat-icon stat-admin"></div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.adminsCount}</span>
              <span className="admin-stat-label">Администраторов</span>
            </div>
          </div>
          
          <div className="admin-stat-card">
            <div className="admin-stat-icon stat-moderator"></div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.moderatorsCount}</span>
              <span className="admin-stat-label">Модераторов</span>
            </div>
          </div>
          
          <div className="admin-stat-card">
            <div className="admin-stat-icon stat-blocked"></div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{stats.blockedCount}</span>
              <span className="admin-stat-label">Заблокировано</span>
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="admin-filters">
          <div className="admin-search">
            <span className="admin-search-icon"></span>
            <input
              type="text"
              placeholder="Поиск по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="admin-role-filter"
          >
            <option value="all">Все роли</option>
            <option value="user">Пользователь</option>
            <option value="moderator">Модератор</option>
            <option value="admin">Админ</option>
          </select>
        </div>
        
        {/* Table */}
        {users.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon"></div>
            <h3>Нет пользователей</h3>
            <p>В системе пока нет зарегистрированных пользователей</p>
          </div>
        ) : filteredUsers.length === 0 ? (
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
                    <th>ID</th>
                    <th>Имя</th>
                    <th>Email</th>
                    <th>Телефон</th>
                    <th>Роль</th>
                    <th>Парковок</th>
                    <th>Бронирований</th>
                    <th>Дата регистрации</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map(user => (
                    <tr key={user.id} className={user.is_blocked ? 'user-blocked' : ''}>
                      <td className="user-id">{user.id.slice(0, 8)}</td>
                      <td className="user-name">{user.name}</td>
                      <td className="user-email">{user.email}</td>
                      <td className="user-phone">{user.phone || '-'}</td>
                      <td>
                        <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="user-parkings">{getUserParkingsCount(user.id)}</td>
                      <td className="user-bookings">{getUserBookingsCount(user.id)}</td>
                      <td className="user-date">{formatDate(user.created_at)}</td>
                      <td className="user-actions">
                        <button 
                          className="action-btn view-btn"
                          onClick={() => setViewModalUser(user)}
                          title="Просмотр"
                        >
                          Просмотр
                        </button>
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => setEditRoleUser(user)}
                          title="Изменить роль"
                        >
                          Роль
                        </button>
                        <button 
                          className={`action-btn ${user.is_blocked ? 'unblock-btn' : 'block-btn'}`}
                          onClick={() => handleToggleBlock(user)}
                          title={user.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                        >
                          {user.is_blocked ? 'Разбл.' : 'Блок.'}
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => setDeleteConfirmUser(user)}
                          title="Удалить"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="admin-pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ← Назад
                </button>
                <span className="pagination-info">
                  Страница {currentPage} из {totalPages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Вперёд →
                </button>
              </div>
            )}
          </>
        )}
        
        {/* View Details Modal */}
        {viewModalUser && (
          <div className="modal-overlay" onClick={() => setViewModalUser(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Информация о пользователе</h2>
                <button className="modal-close" onClick={() => setViewModalUser(null)}>×</button>
              </div>
              <div className="modal-body">
                <div className="user-detail-row">
                  <span className="detail-label">ID:</span>
                  <span className="detail-value">{viewModalUser.id}</span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-label">Имя:</span>
                  <span className="detail-value">{viewModalUser.name}</span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{viewModalUser.email}</span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-label">Телефон:</span>
                  <span className="detail-value">{viewModalUser.phone || '-'}</span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-label">Роль:</span>
                  <span className={`role-badge ${getRoleBadgeClass(viewModalUser.role)}`}>
                    {getRoleLabel(viewModalUser.role)}
                  </span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-label">Статус:</span>
                  <span className={`detail-value ${viewModalUser.is_blocked ? 'text-blocked' : 'text-active'}`}>
                    {viewModalUser.is_blocked ? 'Заблокирован' : 'Активен'}
                  </span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-label">Парковок:</span>
                  <span className="detail-value">{getUserParkingsCount(viewModalUser.id)}</span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-label">Бронирований:</span>
                  <span className="detail-value">{getUserBookingsCount(viewModalUser.id)}</span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-label">Дата регистрации:</span>
                  <span className="detail-value">{formatDate(viewModalUser.created_at)}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="modal-btn" onClick={() => setViewModalUser(null)}>Закрыть</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Edit Role Modal */}
        {editRoleUser && (
          <div className="modal-overlay" onClick={() => setEditRoleUser(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Изменить роль</h2>
                <button className="modal-close" onClick={() => setEditRoleUser(null)}>×</button>
              </div>
              <div className="modal-body">
                <p className="edit-role-user">Пользователь: <strong>{editRoleUser.name}</strong></p>
                <p className="edit-role-user">Email: <strong>{editRoleUser.email}</strong></p>
                <div className="role-select-wrapper">
                  <label>Выберите роль:</label>
                  <select
                    value={editRoleUser.role}
                    onChange={(e) => handleUpdateRole(editRoleUser.id, e.target.value as any)}
                    className="role-select"
                  >
                    <option value="user">Пользователь</option>
                    <option value="moderator">Модератор</option>
                    <option value="admin">Админ</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="modal-btn" onClick={() => setEditRoleUser(null)}>Отмена</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        {deleteConfirmUser && (
          <div className="modal-overlay" onClick={() => setDeleteConfirmUser(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Подтверждение удаления</h2>
                <button className="modal-close" onClick={() => setDeleteConfirmUser(null)}>×</button>
              </div>
              <div className="modal-body">
                <p className="confirm-text">
                  Вы уверены, что хотите удалить пользователя <strong>{deleteConfirmUser.name}</strong>?
                </p>
                <p className="confirm-warning">Это действие нельзя отменить!</p>
              </div>
              <div className="modal-footer">
                <button className="modal-btn cancel-btn" onClick={() => setDeleteConfirmUser(null)}>
                  Отмена
                </button>
                <button className="modal-btn delete-confirm-btn" onClick={() => handleDeleteUser(deleteConfirmUser.id)}>
                  Удалить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}