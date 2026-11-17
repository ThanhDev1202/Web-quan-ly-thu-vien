
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
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
            <Link to="/my-borrows">
              <i className="fa-solid fa-clock-rotate-left"></i> Lịch sử mượn
            </Link>

            <Link to="/reservations">
              <i className="fa-solid fa-bookmark"></i> Đặt trước
            </Link>

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
              <Link to="/audit-logs">
                <i className="fa-solid fa-shield-halved"></i> Nhật ký hệ thống
              </Link>
              <>
                <Link to="/admin/users"><i className="fa-solid fa-users-gear"></i> Quản lý tài khoản</Link>
                <Link to="/audit-logs"><i className="fa-solid fa-shield-halved"></i> Nhật ký hệ thống</Link>
              </>
            )}
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isAuthenticated ? (
          <>
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
