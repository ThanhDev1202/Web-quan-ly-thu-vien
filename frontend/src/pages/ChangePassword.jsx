
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

function ChangePassword() {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');
        setSuccess('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (formData.oldPassword === formData.newPassword) {
            setError('Mật khẩu mới phải khác mật khẩu cũ');
            return;
        }

        try {
            setLoading(true);

            const res = await api.put(
                '/auth/changepassword',
                {
                    oldPassword: formData.oldPassword,
                    newPassword: formData.newPassword
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setSuccess(res.data.message || 'Đổi mật khẩu thành công!');

            setFormData({
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

        } catch (err) {
    console.log('Status:', err.response?.status);
    console.log('Data:', err.response?.data);
    console.log('Message:', err.message);

    setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message
    );
}
    };

    return (
        <div className="form-card">
            <h2>Đổi mật khẩu</h2>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {success && (
                <div className="success-message">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Mật khẩu hiện tại</label>
                    <input
                        className="form-control"
                        type="password"
                        name="oldPassword"
                        value={formData.oldPassword}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Mật khẩu mới</label>
                    <input
                        className="form-control"
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Xác nhận mật khẩu mới</label>
                    <input
                        className="form-control"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="button"
                    disabled={loading}
                >
                    {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </button>
            </form>

            <button
                type="button"
                className="button"
                onClick={() => navigate(-1)}
                style={{ marginTop: '10px' }}
            >
                Quay lại
            </button>
        </div>
    );
}

export default ChangePassword;
