
import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function BorrowManagement() {
    const [records, setRecords] = useState([]);
    const [stats, setStats] = useState(null);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    const [view, setView] = useState('all');

    // Borrow request form
    const [copyId, setCopyId] = useState('');
    const [dueDate, setDueDate] = useState('');

    const { user } = useAuth();

    const isStaff =
        user?.role === 'admin' ||
        user?.role === 'librarian';

    // Get today's date in local YYYY-MM-DD format
    const today = new Date();
    const minDueDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
    ].join('-');

    // Display date
    const formatDate = (date) => {
        if (!date) return '-';

        return new Date(date).toLocaleDateString('vi-VN');
    };

    // Show notification
    const showMessage = (text, type = 'success') => {
        setMessage(text);
        setMessageType(type);
    };

    // Fetch borrow records according to selected view
    const fetchRecords = useCallback(async () => {
        setLoading(true);

        try {
            let endpoint = '/borrow/all';

            switch (view) {
                case 'borrowing':
                    endpoint = '/borrow/borrowing';
                    break;

                case 'overdue':
                    endpoint = '/borrow/overdue/details';
                    break;

                case 'history':
                    endpoint = '/borrow/history';
                    break;

                default:
                    endpoint = '/borrow/all';
            }

            const res = await api.get(endpoint);

            setRecords(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Fetch borrow records error:', err);

            setRecords([]);

            showMessage(
                err.response?.data?.message ||
                'Không thể tải danh sách mượn sách',
                'error'
            );
        } finally {
            setLoading(false);
        }
    }, [view]);

    // Fetch statistics for admin and librarian
    const fetchStatistics = useCallback(async () => {
        if (!isStaff) return;

        try {
            const res = await api.get('/borrow/statistics');
            setStats(res.data);
        } catch (err) {
            console.error('Fetch borrow statistics error:', err);
        }
    }, [isStaff]);

    // Load data
    useEffect(() => {
        if (user) {
            fetchRecords();
        }
    }, [user, fetchRecords]);

    useEffect(() => {
        if (user && isStaff) {
            fetchStatistics();
        }
    }, [user, isStaff, fetchStatistics]);

    // Execute API action
    const handleAction = async (
        method,
        endpoint,
        successMessage,
        data = undefined
    ) => {
        try {
            setActionLoading(true);

            if (method === 'patch') {
                await api.patch(endpoint, data);
            } else {
                await api.post(endpoint, data);
            }

            showMessage(successMessage, 'success');

            await fetchRecords();

            if (isStaff) {
                await fetchStatistics();
            }

            return true;
        } catch (err) {
            console.error('Borrow action error:', err);

            showMessage(
                err.response?.data?.message || 'Có lỗi xảy ra',
                'error'
            );

            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // Reader requests to borrow a copy
    const handleRequestBorrow = async (e) => {
        e.preventDefault();

        if (!copyId || !dueDate) {
            showMessage('Vui lòng nhập mã bản sao và hạn trả.', 'error');
            return;
        }

        const success = await handleAction(
            'post',
            '/borrow/request',
            'Đã gửi yêu cầu mượn sách thành công!',
            {
                copyId: Number(copyId),
                dueDate,
            }
        );

        if (success) {
            setCopyId('');
            setDueDate('');
        }
    };

    // Approve borrow request
    const handleApprove = (id) => {
        handleAction(
            'post',
            `/borrow/approve/${id}`,
            'Đã duyệt yêu cầu mượn sách thành công!'
        );
    };

    // Reject borrow request
    const handleReject = (id, status) => {
        const message = status === 'approved'
            ? 'Bạn có chắc chắn muốn hủy duyệt yêu cầu này?'
            : 'Bạn có chắc chắn muốn từ chối yêu cầu này?';

        if (!window.confirm(message)) return;

        handleAction(
            'post',
            `/borrow/reject/${id}`,
            status === 'approved'
                ? 'Đã hủy duyệt yêu cầu mượn sách!'
                : 'Đã từ chối yêu cầu mượn sách!'
        );
    };

    // Reader cancels their own request
    const handleCancel = (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy yêu cầu mượn?')) {
            return;
        }

        handleAction(
            'post',
            `/borrow/cancel/${id}`,
            'Đã hủy yêu cầu mượn sách!'
        );
    };

    // Confirm book handover
    const handleHandover = (id) => {
        if (!window.confirm('Xác nhận giao sách cho độc giả?')) {
            return;
        }

        handleAction(
            'post',
            `/borrow/handover/${id}`,
            'Đã xác nhận giao sách thành công!'
        );
    };

    // Confirm book return
    const handleReturn = (id) => {
        if (!window.confirm('Xác nhận sách đã được trả?')) {
            return;
        }

        handleAction(
            'post',
            `/borrow/return/${id}`,
            'Đã xác nhận trả sách thành công!'
        );
    };

    // Extend borrowing period
    const handleExtend = async (id) => {
        const newDueDate = window.prompt(
            'Nhập hạn trả mới (YYYY-MM-DD):'
        );

        if (newDueDate === null) return;

        if (!newDueDate.trim()) {
            showMessage('Vui lòng nhập hạn trả mới.', 'error');
            return;
        }

        handleAction(
            'patch',
            `/borrow/extend/${id}`,
            'Đã gia hạn thời gian mượn sách!',
            { newDueDate }
        );
    };

    // Display status label
    const getStatusLabel = (record) => {
        if (
            record.status === 'borrowed' &&
            new Date(record.dueDate) < new Date()
        ) {
            return 'Quá hạn';
        }

        const statusLabels = {
            pending: 'Chờ duyệt',
            approved: 'Đã duyệt',
            borrowed: 'Đang mượn',
            returned: 'Đã trả',
            rejected: 'Đã từ chối',
            cancelled: 'Đã hủy',
        };

        return statusLabels[record.status] || record.status;
    };

    // Get status CSS class
    const getStatusClass = (record) => {
        if (
            record.status === 'borrowed' &&
            new Date(record.dueDate) < new Date()
        ) {
            return 'badge-overdue';
        }

        return `badge-${record.status}`;
    };

    // Not logged in
    if (!user) {
        return (
            <div className="container">
                Vui lòng đăng nhập.
            </div>
        );
    }

    return (
        <div className="container">

            {/* Page heading */}
            <h1 style={{
                fontSize: '1.8rem',
                color: '#0f172a',
                fontWeight: 800
            }}>
                <i
                    className="fa-solid fa-arrows-rotate"
                    style={{
                        color: '#2563eb',
                        marginRight: '10px'
                    }}
                ></i>
                Quản Lý Hoạt Động Mượn & Trả Sách
            </h1>

            <p style={{
                color: '#64748b',
                marginTop: '4px'
            }}>
                Quản lý yêu cầu mượn, giao sách, trả sách
                và theo dõi thời hạn mượn.
            </p>

            {/* Notification */}
            {message && (
                <div style={{
                    background: messageType === 'success'
                        ? '#dcfce7'
                        : '#fee2e2',
                    color: messageType === 'success'
                        ? '#15803d'
                        : '#b91c1c',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    marginTop: '16px',
                    fontWeight: 500
                }}>
                    {message}
                </div>
            )}

            {/* Reader request form */}
            {user.role === 'reader' && (
                <div style={{
                    marginTop: '24px',
                    padding: '20px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    background: '#fff'
                }}>
                    <h3 style={{
                        marginTop: 0,
                        color: '#0f172a'
                    }}>
                        <i className="fa-solid fa-book-open"></i>
                        {' '}Gửi yêu cầu mượn sách
                    </h3>

                    <form
                        onSubmit={handleRequestBorrow}
                        style={{
                            display: 'flex',
                            gap: '12px',
                            flexWrap: 'wrap',
                            alignItems: 'end'
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                        }}>
                            <label>Mã bản sao sách</label>
                            <input
                                type="number"
                                min="1"
                                value={copyId}
                                onChange={(e) => setCopyId(e.target.value)}
                                placeholder="Nhập copy ID"
                                required
                                style={{
                                    padding: '9px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px'
                                }}
                            />
                        </div>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                        }}>
                            <label>Hạn trả dự kiến</label>
                            <input
                                type="date"
                                min={minDueDate}
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                required
                                style={{
                                    padding: '9px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={actionLoading}
                        >
                            <i className="fa-solid fa-paper-plane"></i>
                            {' '}Gửi yêu cầu
                        </button>
                    </form>
                </div>
            )}

            {/* Statistics */}
            {isStaff && stats && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '12px',
                    marginTop: '24px'
                }}>
                    {[
                        { label: 'Tổng phiếu', value: stats.total },
                        { label: 'Chờ duyệt', value: stats.pending },
                        { label: 'Đã duyệt', value: stats.approved },
                        { label: 'Đang mượn', value: stats.borrowed },
                        { label: 'Đã trả', value: stats.returned },
                        { label: 'Quá hạn', value: stats.overdue },
                    ].map((item) => (
                        <div
                            key={item.label}
                            style={{
                                padding: '16px',
                                background: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px'
                            }}
                        >
                            <div style={{
                                fontSize: '0.85rem',
                                color: '#64748b'
                            }}>
                                {item.label}
                            </div>

                            <strong style={{
                                fontSize: '1.5rem',
                                color: '#0f172a'
                            }}>
                                {item.value ?? 0}
                            </strong>
                        </div>
                    ))}
                </div>
            )}

            {/* Filter buttons */}
            <div style={{
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                marginTop: '24px',
                marginBottom: '16px'
            }}>
                <button
                    className={`btn ${view === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setView('all')}
                >
                    Tất cả giao dịch
                </button>

                <button
                    className={`btn ${view === 'borrowing' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setView('borrowing')}
                >
                    <i className="fa-solid fa-book"></i>
                    {' '}Đang mượn
                </button>

                {isStaff && (
                    <button
                        className={`btn ${view === 'overdue' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setView('overdue')}
                    >
                        <i className="fa-solid fa-clock"></i>
                        {' '}Sách quá hạn
                    </button>
                )}

                <button
                    className={`btn ${view === 'history' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setView('history')}
                >
                    <i className="fa-solid fa-clock-rotate-left"></i>
                    {' '}Lịch sử
                </button>
            </div>

            {/* Borrow records table */}
            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>ID Giao dịch</th>
                            <th>Mã Bản Sao</th>
                            <th>Mã Độc Giả</th>
                            <th>Ngày Mượn</th>
                            <th>Hạn Trả</th>
                            <th>Ngày Trả</th>
                            {view === 'overdue' && (
                                <th>Số Ngày Quá Hạn</th>
                            )}
                            <th>Trạng Thái</th>
                            <th>Thao Tác</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={view === 'overdue' ? 9 : 8}
                                    style={{
                                        textAlign: 'center',
                                        padding: '30px'
                                    }}
                                >
                                    Đang tải dữ liệu...
                                </td>
                            </tr>
                        ) : records.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={view === 'overdue' ? 9 : 8}
                                    style={{
                                        textAlign: 'center',
                                        padding: '30px',
                                        color: '#64748b'
                                    }}
                                >
                                    Không có giao dịch nào.
                                </td>
                            </tr>
                        ) : (
                            records.map((r) => (
                                <tr key={r.id}>
                                    <td>#{r.id}</td>

                                    <td>
                                        <strong>
                                            {r.BookCopy?.id || r.copyId}
                                        </strong>
                                    </td>

                                    <td>{r.userId}</td>

                                    <td>
                                        {formatDate(r.borrowDate)}
                                    </td>

                                    <td>
                                        {formatDate(r.dueDate)}
                                    </td>

                                    <td>
                                        {formatDate(r.returnDate)}
                                    </td>

                                    {view === 'overdue' && (
                                        <td>
                                            <strong style={{
                                                color: '#dc2626'
                                            }}>
                                                {r.overdueDays ?? 0} ngày
                                            </strong>
                                        </td>
                                    )}

                                    <td>
                                        <span className={`badge ${getStatusClass(r)}`}>
                                            {getStatusLabel(r)}
                                        </span>
                                    </td>

                                    <td>
                                        <div style={{
                                            display: 'flex',
                                            gap: '6px',
                                            flexWrap: 'wrap'
                                        }}>

                                            {/* Staff: approve or reject pending */}
                                            {r.status === 'pending' && isStaff && (
                                                <>
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        disabled={actionLoading}
                                                        onClick={() => handleApprove(r.id)}
                                                    >
                                                        <i className="fa-solid fa-check"></i>
                                                        {' '}Duyệt
                                                    </button>

                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        disabled={actionLoading}
                                                        onClick={() => handleReject(r.id, r.status)}
                                                    >
                                                        <i className="fa-solid fa-xmark"></i>
                                                        {' '}Từ chối
                                                    </button>
                                                </>
                                            )}

                                            {/* Reader: cancel pending request */}
                                            {r.status === 'pending' && !isStaff && (
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    disabled={actionLoading}
                                                    onClick={() => handleCancel(r.id)}
                                                >
                                                    <i className="fa-solid fa-ban"></i>
                                                    {' '}Hủy yêu cầu
                                                </button>
                                            )}

                                            {/* Staff: handover approved book */}
                                            {r.status === 'approved' && isStaff && (
                                                <>
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        disabled={actionLoading}
                                                        onClick={() => handleHandover(r.id)}
                                                    >
                                                        <i className="fa-solid fa-book"></i>
                                                        {' '}Giao sách
                                                    </button>

                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        disabled={actionLoading}
                                                        onClick={() => handleReject(r.id, r.status)}
                                                    >
                                                        <i className="fa-solid fa-xmark"></i>
                                                        {' '}Hủy duyệt
                                                    </button>
                                                </>
                                            )}

                                            {/* Return borrowed book */}
                                            {r.status === 'borrowed' && (
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    disabled={actionLoading}
                                                    onClick={() => handleReturn(r.id)}
                                                >
                                                    <i className="fa-solid fa-rotate-left"></i>
                                                    {' '}Xác nhận trả
                                                </button>
                                            )}

                                            {/* Staff: extend borrowing period */}
                                            {r.status === 'borrowed' && isStaff && (
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    disabled={actionLoading}
                                                    onClick={() => handleExtend(r.id)}
                                                >
                                                    <i className="fa-solid fa-calendar-plus"></i>
                                                    {' '}Gia hạn
                                                </button>
                                            )}

                                            {/* No available action */}
                                            {(
                                                r.status === 'returned' ||
                                                r.status === 'rejected' ||
                                                r.status === 'cancelled'
                                            ) && (
                                                <span>-</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Refresh button */}
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '16px'
            }}>
                <button
                    className="btn btn-primary"
                    disabled={loading || actionLoading}
                    onClick={() => {
                        fetchRecords();
                        fetchStatistics();
                    }}
                >
                    <i className="fa-solid fa-rotate"></i>
                    {' '}Làm mới
                </button>
            </div>
        </div>
    );
}
