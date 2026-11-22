import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [approvedList, setApprovedList] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [seenIds, setSeenIds] = useState([]);
  const notifRef = useRef(null);

  const storageKey = user?.id ? `seen_approved_borrows_${user.id}` : null;

  useEffect(() => {
    if (!storageKey) {
      setSeenIds([]);
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setSeenIds(Array.isArray(saved) ? saved : []);
    } catch {
      setSeenIds([]);
    }
  }, [storageKey]);

  const fetchApprovedNotifications = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'reader') {
      setApprovedList([]);
      return;
    }
    try {
      const res = await api.get('/borrow/all');
      const rows = Array.isArray(res.data) ? res.data : [];
      setApprovedList(rows.filter((r) => r.status === 'approved'));
    } catch {
      // ignore background poll errors
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    fetchApprovedNotifications();
    if (!isAuthenticated || user?.role !== 'reader') return;
    const timer = setInterval(fetchApprovedNotifications, 15000);
    return () => clearInterval(timer);
  }, [fetchApprovedNotifications, isAuthenticated, user?.role, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = approvedList.filter((r) => !seenIds.includes(r.id)).length;

  const markAllSeen = () => {
    if (!storageKey) return;
    const next = Array.from(new Set([...seenIds, ...approvedList.map((r) => r.id)]));
    setSeenIds(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const handleToggleNotif = () => {
    const nextOpen = !notifOpen;
    setNotifOpen(nextOpen);
    if (nextOpen && unreadCount > 0) {
      markAllSeen();
    }
  };

  const handleLogout = () => {
    setNotifOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <i className="fa-solid fa-book-bookmark"></i>
        <span>Smart Library</span>
      </Link>

      <div className="navbar-links">
        <Link to="/">
          <i className="fa-solid fa-compass"></i> Tra cứu sách
        </Link>

        {isAuthenticated && (
          <>
            {user?.role === 'reader' && (
              <Link to="/my-borrows">
                <i className="fa-solid fa-book-open-reader"></i> Mượn sách & lịch sử
              </Link>
            )}

            <Link to="/change-password">
              <i className="fa-solid fa-key"></i> Đổi mật khẩu
            </Link>

            {(user?.role === 'admin' || user?.role === 'librarian') && (
              <>
                <Link to="/manage-books">
                  <i className="fa-solid fa-book-medical"></i> Quản lý sách
                </Link>

                <Link to="/manage-borrows">
                  <i className="fa-solid fa-clipboard-check"></i> Duyệt mượn/trả
                </Link>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <Link to="/admin/users">
                  <i className="fa-solid fa-users-gear"></i> Quản lý tài khoản
                </Link>

                <Link to="/audit-logs">
                  <i className="fa-solid fa-shield-halved"></i> Nhật ký hệ thống
                </Link>
              </>
            )}
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isAuthenticated ? (
          <>
            {user?.role === 'reader' && (
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={handleToggleNotif}
                  title="Thông báo duyệt mượn sách"
                  style={{
                    position: 'relative',
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#fff',
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                  }}
                >
                  <i className="fa-solid fa-bell"></i>
                  {approvedList.length > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: unreadCount > 0 ? '#ef4444' : '#10b981',
                        color: '#fff',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        minWidth: '18px',
                        height: '18px',
                        padding: '0 5px',
                        borderRadius: '999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #1e3a8a',
                      }}
                    >
                      {approvedList.length}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '48px',
                      width: '340px',
                      background: '#fff',
                      color: '#0f172a',
                      borderRadius: '12px',
                      boxShadow: '0 12px 30px rgba(15, 23, 42, 0.2)',
                      border: '1px solid #e2e8f0',
                      overflow: 'hidden',
                      zIndex: 200,
                    }}
                  >
                    <div
                      style={{
                        padding: '12px 16px',
                        background: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>
                        <i className="fa-solid fa-bell" style={{ color: '#2563eb', marginRight: 6 }}></i>
                        Thông báo duyệt mượn
                      </span>
                      <span className="badge badge-available">{approvedList.length}</span>
                    </div>

                    {approvedList.length === 0 ? (
                      <div style={{ padding: '20px 16px', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                        Hiện chưa có yêu cầu mượn nào được duyệt mới.
                      </div>
                    ) : (
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {approvedList.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setNotifOpen(false);
                              navigate('/my-borrows');
                            }}
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid #f1f5f9',
                              cursor: 'pointer',
                              background: '#f0fdf4',
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#15803d', marginBottom: 4 }}>
                              <i className="fa-solid fa-circle-check" style={{ marginRight: 6 }}></i>
                              Yêu cầu mượn #{item.id} đã được chấp nhận!
                            </div>
                            <div style={{ fontSize: '0.86rem', color: '#0f172a' }}>
                              Sách: <strong>{item.BookCopy?.Book?.title || 'Không rõ'}</strong>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 2 }}>
                              Mã bản sao: <code>{item.BookCopy?.accessionCode || `#${item.copyId}`}</code> · Hạn trả:{' '}
                              {item.dueDate ? new Date(item.dueDate).toLocaleDateString('vi-VN') : '-'}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#15803d', marginTop: 4, fontWeight: 600 }}>
                              Vui lòng đến quầy thư viện để nhận sách.
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="user-badge">
              <i className="fa-solid fa-user-circle" style={{ fontSize: '1.1rem' }}></i>
              <span className={`role-tag role-${user?.role || 'reader'}`}>
                {user?.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              style={{ color: '#ef4444' }}
            >
              <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-primary btn-sm">
              <i className="fa-solid fa-right-to-bracket"></i> Đăng nhập
            </Link>

            <Link to="/register" className="btn btn-secondary btn-sm">
              Đăng ký
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}