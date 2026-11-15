
import React, { useEffect, useState } from 'react';
import { userApi } from '../api/userApi';
import { useAuth } from '../context/AuthContext';
import './UserManagement.css';

const initialForm = {
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'reader',
    status: 'active'
};

const UserManagement = () => {
    const { user, isAuthenticated } = useAuth();

    const currentUser = user;
    const isAdmin = user?.role === 'admin';

    const [users, setUsers] = useState([]);
    const [form, setForm] = useState(initialForm);

    const [selectedId, setSelectedId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [isProfile, setIsProfile] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Lấy danh sách người dùng
    const loadUsers = async () => {
        try {
            setLoading(true);
            setError('');

            const data = await userApi.getAllUsers();
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Mở form tạo người dùng
    const openCreateForm = () => {
        setForm({ ...initialForm });
        setSelectedId(null);
        setIsCreating(true);
        setIsProfile(false);
        setShowForm(true);

        setMessage('');
        setError('');
    };

    // Mở form chỉnh sửa người dùng
    const openEdit = async (id, profile = false) => {
        try {
            setError('');
            setMessage('');
            setLoading(true);
            setIsCreating(false);

            const data = await userApi.getUserById(id);

            setSelectedId(id);
            setIsProfile(profile);

            setForm({
                username: data.username || '',
                email: data.email || '',
                password: '',
                fullName: data.fullName || '',
                phone: data.phone || '',
                role: data.role || 'reader',
                status: data.status || 'active'
            });

            setShowForm(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Xử lý thay đổi input
    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Tạo người dùng mới
    const handleCreate = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError('');
            setMessage('');

            const data = {
                username: form.username,
                email: form.email,
                password: form.password,
                fullName: form.fullName,
                phone: form.phone,
                role: form.role
            };

            await userApi.createUser(data);

            setMessage('Tạo người dùng thành công!');
            setShowForm(false);
            setIsCreating(false);
            setForm({ ...initialForm });

            await loadUsers();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Cập nhật người dùng
    const handleUpdate = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError('');
            setMessage('');

            const data = {
                username: form.username,
                email: form.email,
                fullName: form.fullName,
                phone: form.phone
            };

            // Chỉ Admin được thay đổi role và status
            if (isAdmin) {
                data.role = form.role;
                data.status = form.status;
            }

            await userApi.updateUser(selectedId, data);

            setMessage('Cập nhật thông tin thành công!');

            if (isAdmin) {
                setShowForm(false);
                await loadUsers();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Xóa người dùng
    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            'Bạn có chắc chắn muốn xóa tài khoản này?'
        );

        if (!confirmed) return;

        try {
            setLoading(true);
            setError('');
            setMessage('');

            await userApi.deleteUser(id);

            setMessage('Xóa người dùng thành công!');
            await loadUsers();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Tải dữ liệu ban đầu theo role
    useEffect(() => {
        if (!isAuthenticated) return;

        if (!currentUser?.id || !currentUser?.role) return;

        let cancelled = false;

        const loadInitialData = async () => {
            try {
                setLoading(true);
                setError('');

                if (isAdmin) {
                    const data = await userApi.getAllUsers();

                    if (!cancelled) {
                        setUsers(data);
                    }
                } else {
                    const data = await userApi.getUserById(
                        currentUser.id
                    );

                    if (!cancelled) {
                        setSelectedId(currentUser.id);
                        setIsProfile(true);

                        setForm({
                            ...initialForm,
                            username: data.username || '',
                            email: data.email || '',
                            fullName: data.fullName || '',
                            phone: data.phone || '',
                            role: data.role || 'reader',
                            status: data.status || 'active'
                        });

                        setShowForm(true);
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadInitialData();

        return () => {
            cancelled = true;
        };
    }, [
        isAuthenticated,
        currentUser?.id,
        currentUser?.role,
        isAdmin
    ]);

    // Tìm kiếm người dùng
    const filteredUsers = users.filter(user =>
        [
            user.username,
            user.email,
            user.fullName,
            user.phone
        ].some(value =>
            String(value || '')
                .toLowerCase()
                .includes(search.toLowerCase())
        )
    );

    // Kiểm tra đăng nhập
    if (!isAuthenticated) {
        return (
            <div className="user-page">
                Vui lòng đăng nhập lại.
            </div>
        );
    }

    if (!currentUser?.id) {
        return (
            <div className="user-page">
                Đang tải thông tin người dùng...
            </div>
        );
    }

    return (
        <div className="user-page">

            {/* HEADER */}
            <div className="user-header">
                <div>
                    <h2>
                        {isAdmin
                            ? 'Quản lý người dùng'
                            : 'Thông tin cá nhân'}
                    </h2>

                    <p>
                        {isAdmin
                            ? 'Quản lý tài khoản trong hệ thống thư viện'
                            : 'Xem và cập nhật thông tin tài khoản của bạn'}
                    </p>
                </div>

                {isAdmin && (
                    <div className="action-buttons">
                        {!showForm && (
                            <button
                                className="btn-primary"
                                onClick={openCreateForm}
                                disabled={loading}
                            >
                                + Thêm người dùng
                            </button>
                        )}

                        <button
                            className="btn-edit"
                            onClick={() => openEdit(currentUser.id, true)}
                            disabled={loading}
                        >
                            Hồ sơ của tôi
                        </button>
                    </div>
                )}
            </div>

            {/* THÔNG BÁO */}
            {message && (
                <div className="alert-success">
                    {message}
                </div>
            )}

            {error && (
                <div className="alert-error">
                    {error}
                </div>
            )}

            {/* DANH SÁCH NGƯỜI DÙNG - ADMIN */}
            {isAdmin && !showForm && (
                <>
                    <div className="user-toolbar">
                        <input
                            type="text"
                            placeholder="Tìm theo username, email, họ tên..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />

                        <span>
                            Tổng số: {filteredUsers.length} người dùng
                        </span>
                    </div>

                    {loading ? (
                        <p>Đang tải dữ liệu...</p>
                    ) : (
                        <div className="table-wrapper">
                            <table className="user-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Họ tên</th>
                                        <th>Điện thoại</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user.id}>
                                            <td>{user.id}</td>
                                            <td>{user.username}</td>
                                            <td>{user.email}</td>
                                            <td>{user.fullName || '-'}</td>
                                            <td>{user.phone || '-'}</td>

                                            <td>
                                                <span
                                                    className={`role-badge ${user.role}`}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`status-badge ${user.status}`}
                                                >
                                                    {user.status || '-'}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-edit"
                                                        onClick={() =>
                                                            openEdit(user.id)
                                                        }
                                                        disabled={loading}
                                                    >
                                                        Sửa
                                                    </button>

                                                    <button
                                                        className="btn-delete"
                                                        onClick={() =>
                                                            handleDelete(user.id)
                                                        }
                                                        disabled={
                                                            loading ||
                                                            Number(user.id) ===
                                                            Number(currentUser.id)
                                                        }
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan="8"
                                                className="empty-data"
                                            >
                                                Không tìm thấy người dùng.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* FORM TẠO / CẬP NHẬT */}
            {showForm && (
                <div className="user-form-container">

                    <div className="form-header">
                        <h3>
                            {isCreating
                                ? 'Thêm người dùng mới'
                                : isProfile
                                    ? 'Cập nhật hồ sơ cá nhân'
                                    : `Chỉnh sửa người dùng #${selectedId}`}
                        </h3>
                    </div>

                    <form onSubmit={isCreating ? handleCreate : handleUpdate}>
                        <div className="form-grid">

                            {/* USERNAME */}
                            <div className="form-group">
                                <label>Username</label>

                                <input
                                    name="username"
                                    value={form.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* EMAIL */}
                            <div className="form-group">
                                <label>Email</label>

                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* PASSWORD - CHỈ KHI TẠO */}
                            {isCreating && (
                                <div className="form-group">
                                    <label>Mật khẩu</label>

                                    <input
                                        type="password"
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        minLength={8}
                                        required
                                    />
                                </div>
                            )}

                            {/* FULL NAME */}
                            <div className="form-group">
                                <label>Họ và tên</label>

                                <input
                                    name="fullName"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* PHONE */}
                            <div className="form-group">
                                <label>Số điện thoại</label>

                                <input
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* ROLE - ADMIN ONLY */}
                            {isAdmin && (
                                <div className="form-group">
                                    <label>Role</label>

                                    <select
                                        name="role"
                                        value={form.role}
                                        onChange={handleChange}
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="librarian">Librarian</option>
                                        <option value="reader">Reader</option>
                                    </select>
                                </div>
                            )}

                            {/* STATUS - CHỈ KHI CHỈNH SỬA */}
                            {isAdmin && !isCreating && (
                                <div className="form-group">
                                    <label>Status</label>

                                    <select
                                        name="status"
                                        value={form.status}
                                        onChange={handleChange}
                                    >
                                        <option value="active">Active</option>
                                        <option value="locked">Locked</option>
                                    </select>
                                </div>
                            )}

                        </div>

                        {/* BUTTONS */}
                        <div className="form-actions">

                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => {
                                    if (isAdmin) {
                                        setShowForm(false);
                                    }

                                    setIsCreating(false);
                                    setError('');
                                    setMessage('');
                                }}
                                disabled={loading}
                            >
                                Quay lại
                            </button>

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading}
                            >
                                {loading
                                    ? 'Đang lưu...'
                                    : isCreating
                                        ? 'Tạo người dùng'
                                        : 'Lưu thay đổi'}
                            </button>

                        </div>
                    </form>
                </div>
            )}

        </div>
    );
};

export default UserManagement;
