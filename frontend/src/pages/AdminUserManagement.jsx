import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

// ─── Stats Card ───────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: color + '20', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '1.3rem', color: color,
      }}>
        <i className={icon}></i>
      </div>
      <div>
        <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{value}</div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function AdminUserManagement() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchText, setSearchText] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Create account form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newAccount, setNewAccount] = useState({
    username: '', email: '', password: '',
    fullName: '', phone: '', role: 'librarian',
  });

  // ─── Fetch users ───
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterRole) params.role = filterRole;
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/users', { params });
      setUsers(res.data);
    } catch (err) {
      showMsg(err.response?.data?.error || 'Không thể tải danh sách người dùng.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [filterRole, filterStatus]);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // ─── Toggle status (lock / unlock) ───
  const handleToggleStatus = async (user) => {
    const action = user.status === 'active' ? 'khóa' : 'mở khóa';
    if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản "${user.username}" (${user.role})?`)) return;
    try {
      const res = await api.patch(`/users/${user.id}/status`);
      showMsg(res.data.message, 'success');
      fetchUsers();
    } catch (err) {
      showMsg(err.response?.data?.error || 'Thao tác thất bại.', 'error');
    }
  };

  // ─── Delete user ───
  const handleDelete = async (user) => {
    if (!window.confirm(`Xóa tài khoản "${user.username}"? Hành động này không thể hoàn tác!`)) return;
    try {
      const res = await api.delete(`/users/${user.id}`);
      showMsg(res.data.message, 'success');
      fetchUsers();
    } catch (err) {
      showMsg(err.response?.data?.error || 'Không thể xóa người dùng.', 'error');
    }
  };

  // ─── Create new account ───
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const res = await api.post('/users', newAccount);
      showMsg(res.data.message, 'success');
      setNewAccount({ username: '', email: '', password: '', fullName: '', phone: '', role: 'librarian' });
      setShowCreateForm(false);
      fetchUsers();
    } catch (err) {
      showMsg(err.response?.data?.error || 'Tạo tài khoản thất bại.', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  // ─── Filtered list ───
  const filteredUsers = users.filter(u => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.fullName?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  });

  // ─── Stats ───
  const totalUsers = users.length;
  const totalAdmins = users.filter(u => u.role === 'admin').length;
  const totalLibrarians = users.filter(u => u.role === 'librarian').length;
  const totalReaders = users.filter(u => u.role === 'reader').length;
  const totalLocked = users.filter(u => u.status === 'locked').length;

  // ─── Helpers ───
  const roleBadge = (role) => {
    const map = {
      admin: { label: 'Admin', color: '#ef4444', bg: '#fee2e2' },
      librarian: { label: 'Thủ thư', color: '#d97706', bg: '#fef3c7' },
      reader: { label: 'Độc giả', color: '#16a34a', bg: '#dcfce7' },
    };
    const s = map[role] || { label: role, color: '#64748b', bg: '#f1f5f9' };
    return (
      <span style={{
        padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem',
        fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.color}30`
      }}>
        {s.label}
      </span>
    );
  };

  const statusBadge = (status) => (
    <span style={{
      padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
      background: status === 'active' ? '#dcfce7' : '#fee2e2',
      color: status === 'active' ? '#15803d' : '#b91c1c',
      display: 'inline-flex', alignItems: 'center', gap: '5px'
    }}>
      <i className={`fa-solid fa-circle`} style={{ fontSize: '0.5rem' }}></i>
      {status === 'active' ? 'Đang hoạt động' : 'Đã bị khóa'}
    </span>
  );

  return (
    <div className="container">
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#0f172a', fontWeight: 800 }}>
            <i className="fa-solid fa-users-gear" style={{ color: '#2563eb', marginRight: '10px' }}></i>
            Quản Lý Tài Khoản Người Dùng
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>
            Dành riêng cho Quản trị viên — Xem, khóa, mở khóa và cấp tài khoản nhân viên
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
          <i className="fa-solid fa-user-plus"></i> Tạo tài khoản nhân viên
        </button>
      </div>

      {/* ── Notifications ── */}
      {message.text && (
        <div style={{
          marginTop: '16px', padding: '12px 18px', borderRadius: '8px', fontWeight: 500,
          background: message.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: message.type === 'error' ? '#b91c1c' : '#15803d',
        }}>
          <i className={`fa-solid ${message.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`} style={{ marginRight: '8px' }}></i>
          {message.text}
        </div>
      )}

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginTop: '24px' }}>
        <StatCard icon="fa-solid fa-users" label="Tổng tài khoản" value={totalUsers} color="#2563eb" />
        <StatCard icon="fa-solid fa-user-shield" label="Admin" value={totalAdmins} color="#ef4444" />
        <StatCard icon="fa-solid fa-user-tie" label="Thủ thư" value={totalLibrarians} color="#d97706" />
        <StatCard icon="fa-solid fa-user" label="Độc giả" value={totalReaders} color="#16a34a" />
        <StatCard icon="fa-solid fa-lock" label="Đang bị khóa" value={totalLocked} color="#6b7280" />
      </div>

      {/* ── Filters & Search ── */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '2', minWidth: '220px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Tìm theo tên, username, email, số điện thoại..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>
        <select className="form-control" style={{ flex: '1', minWidth: '160px' }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">Tất cả vai trò</option>
          <option value="admin">Admin</option>
          <option value="librarian">Thủ thư</option>
          <option value="reader">Độc giả</option>
        </select>
        <select className="form-control" style={{ flex: '1', minWidth: '160px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="locked">Đã bị khóa</option>
        </select>
        <button className="btn btn-secondary" onClick={fetchUsers} title="Làm mới danh sách">
          <i className="fa-solid fa-arrows-rotate"></i>
        </button>
      </div>

      {/* ── Users Table ── */}
      <div className="table-responsive" style={{ marginTop: '20px' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>
            Danh sách tài khoản
            <span style={{ marginLeft: '8px', background: '#e0e7ff', color: '#3730a3', padding: '2px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
              {filteredUsers.length}
            </span>
          </span>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
            <p style={{ marginTop: '10px' }}>Đang tải danh sách tài khoản...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
            <i className="fa-solid fa-users-slash" style={{ fontSize: '3rem', color: '#cbd5e1' }}></i>
            <p style={{ marginTop: '12px' }}>Không tìm thấy tài khoản nào phù hợp.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th style={{ textAlign: 'center' }}>Vai trò</th>
                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                <th>Ngày tạo</th>
                <th style={{ textAlign: 'center', width: '180px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, idx) => {
                const isSelf = Number(u.id) === Number(currentUser?.id);
                return (
                  <tr key={u.id} style={{ opacity: u.status === 'locked' ? 0.7 : 1 }}>
                    <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: u.role === 'admin' ? '#fee2e2' : u.role === 'librarian' ? '#fef3c7' : '#eff6ff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1rem', color: u.role === 'admin' ? '#ef4444' : u.role === 'librarian' ? '#d97706' : '#2563eb',
                          fontWeight: 700, flexShrink: 0,
                        }}>
                          {u.fullName?.charAt(0)?.toUpperCase() || u.username?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                            {u.fullName}
                            {isSelf && (
                              <span style={{ marginLeft: '6px', fontSize: '0.72rem', background: '#eff6ff', color: '#2563eb', padding: '1px 7px', borderRadius: '10px', fontWeight: 600 }}>
                                Bạn
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.88rem' }}>{u.email}</td>
                    <td style={{ fontSize: '0.88rem' }}>{u.phone || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                    <td style={{ textAlign: 'center' }}>{roleBadge(u.role)}</td>
                    <td style={{ textAlign: 'center' }}>{statusBadge(u.status)}</td>
                    <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {/* Lock / Unlock button */}
                        <button
                          className={`btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleToggleStatus(u)}
                          disabled={isSelf}
                          title={isSelf ? 'Không thể tự khóa tài khoản mình' : u.status === 'active' ? 'Khóa tài khoản này' : 'Mở khóa tài khoản này'}
                          style={{ opacity: isSelf ? 0.4 : 1 }}
                        >
                          <i className={`fa-solid ${u.status === 'active' ? 'fa-lock' : 'fa-lock-open'}`}></i>
                          {u.status === 'active' ? ' Khóa' : ' Mở khóa'}
                        </button>

                        {/* Delete button – only show for non-admin or other admins */}
                        {!isSelf && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDelete(u)}
                            title="Xóa tài khoản này"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── CREATE ACCOUNT MODAL ── */}
      {showCreateForm && (
        <div className="modal-backdrop" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <i className="fa-solid fa-user-plus" style={{ color: '#2563eb' }}></i>
                Tạo Tài Khoản Nhân Viên Mới
              </div>
              <button onClick={() => setShowCreateForm(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body">
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', marginBottom: '18px', fontSize: '0.85rem', color: '#1d4ed8' }}>
                <i className="fa-solid fa-circle-info" style={{ marginRight: '6px' }}></i>
                Chỉ Admin mới có thể tạo tài khoản <strong>Thủ thư</strong> hoặc <strong>Admin</strong> qua form này.
                Tài khoản Độc giả được tự đăng ký qua trang công khai.
              </div>

              <form onSubmit={handleCreate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
                  <div className="form-group">
                    <label className="form-label">Username *</label>
                    <input type="text" className="form-control" placeholder="VD: thuthu01"
                      value={newAccount.username} onChange={e => setNewAccount({ ...newAccount, username: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Họ và tên *</label>
                    <input type="text" className="form-control" placeholder="Nguyễn Văn A"
                      value={newAccount.fullName} onChange={e => setNewAccount({ ...newAccount, fullName: e.target.value })} required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" className="form-control" placeholder="example@library.com"
                    value={newAccount.email} onChange={e => setNewAccount({ ...newAccount, email: e.target.value })} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
                  <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
                    <input type="text" className="form-control" placeholder="0909xxxxxx"
                      value={newAccount.phone} onChange={e => setNewAccount({ ...newAccount, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vai trò *</label>
                    <select className="form-control" value={newAccount.role}
                      onChange={e => setNewAccount({ ...newAccount, role: e.target.value })}>
                      <option value="librarian">Thủ thư (Librarian)</option>
                      <option value="admin">Quản trị viên (Admin)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mật khẩu *</label>
                  <input type="password" className="form-control" placeholder="Tối thiểu 8 ký tự, có chữ hoa, số, ký tự đặc biệt"
                    value={newAccount.password} onChange={e => setNewAccount({ ...newAccount, password: e.target.value })} required />
                </div>

                <div className="modal-footer" style={{ padding: '0', border: 'none', marginTop: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={createLoading}>
                    <i className="fa-solid fa-user-plus"></i>
                    {createLoading ? ' Đang tạo...' : ' Tạo tài khoản'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
