import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'reader'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/auth/register', formData);
      setSuccess('Đăng ký thành công! Đang chuyển hướng tới trang đăng nhập...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-card" style={{ maxWidth: '500px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px', color: '#1e3a8a' }}>
          <i className="fa-solid fa-user-plus" style={{ marginRight: '8px' }}></i>Đăng Ký Tài Khoản
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
          Tạo tài khoản độc giả hoặc nhân viên thư viện
        </p>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tên đăng nhập (Username):</label>
            <input 
              type="text" 
              name="username"
              className="form-control" 
              value={formData.username} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Họ và tên:</label>
            <input 
              type="text" 
              name="fullName"
              className="form-control" 
              value={formData.fullName} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email:</label>
            <input 
              type="email" 
              name="email"
              className="form-control" 
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Số điện thoại:</label>
            <input 
              type="text" 
              name="phone"
              className="form-control" 
              value={formData.phone} 
              onChange={handleChange} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu:</label>
            <input 
              type="password" 
              name="password"
              className="form-control" 
              value={formData.password} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Vai trò (Role):</label>
            <select name="role" className="form-control" value={formData.role} onChange={handleChange}>
              <option value="reader">Độc giả (Reader)</option>
              <option value="librarian">Thủ thư (Librarian)</option>
              <option value="admin">Quản trị viên (Admin)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo Tài Khoản'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.88rem', color: '#64748b' }}>
          Đã có tài khoản? <Link to="/login" style={{ fontWeight: '600' }}>Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
}
