
import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import BorrowRequestForm from '../components/BorrowRequestForm';

export default function BorrowManagement() {
    const [records, setRecords] = useState([]);
    const [stats, setStats] = useState(null);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    const [view, setView] = useState('all');
    const [allRecords, setAllRecords] = useState([]);
    const [contactRecord, setContactRecord] = useState(null);

    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const initialBookId = searchParams.get('bookId');

    const isStaff =
        user?.role === 'admin' ||
        user?.role === 'librarian';

    // Display date
    const formatDate = (date) => {
        if (!date) return '-';

        return new Date(date).toLocaleDateString('vi-VN');
    };

    // Show notification
    const showMessage = useCallback((text, type = 'success') => {
        setMessage(text);
        setMessageType(type);
    }, []);

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
            const list = Array.isArray(res.data) ? res.data : [];

            setRecords(list);
            if (view === 'all') {
                setAllRecords(list);
            } else if (user?.role === 'reader') {
                const allRes = await api.get('/borrow/all');
                setAllRecords(Array.isArray(allRes.data) ? allRes.data : []);
            }
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
    }, [view, showMessage, user?.role]);

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

    // Check whether a record is overdue
    const isOverdueRecord = (record) =>
        record.status === 'borrowed' &&
        record.dueDate &&
        new Date(record.dueDate) < new Date();

    // Calculate overdue days
    const getOverdueDays = (record) => {
        if (typeof record.overdueDays === 'number') return record.overdueDays;
        if (!record.dueDate) return 0;
        return Math.max(
            0,
            Math.floor(
                (Date.now() - new Date(record.dueDate).getTime()) /
                    (1000 * 60 * 60 * 24)
            )
        );
    };

    // Approved records for reader notification banner
    const approvedRecords = user?.role === 'reader'
        ? allRecords.filter((r) => r.status === 'approved')
        : [];

    // Display status label
    const getStatusLabel = (record) => {
        if (isOverdueRecord(record)) {
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
        if (isOverdueRecord(record)) {
            return 'badge-overdue';
        }

        return `badge-${record.status}`;
    };

    // Number of table columns (for empty / loading rows)
    const colCount = 8 + (isStaff ? 1 : 0) + (view === 'overdue' ? 1 : 0);

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
                {isStaff ? 'Duyệt Mượn & Trả Sách' : 'Mượn Sách & Lịch Sử Mượn'}
            </h1>

            <p style={{
                color: '#64748b',
                marginTop: '4px'
            }}>
                {isStaff
                    ? 'Quản lý yêu cầu mượn, giao sách, trả sách và theo dõi thời hạn mượn.'
                    : 'Chọn sách, chọn bản sao còn trên kệ để gửi yêu cầu mượn và theo dõi các phiếu mượn của bạn.'}
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

            {/* Reader approved notification banner */}
            {user.role === 'reader' && approvedRecords.length > 0 && (
                <div
                    style={{
                        marginTop: '18px',
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #ecfdf5 0%, #dcfce7 100%)',
                        border: '1px solid #86efac',
                        color: '#14532d',
                        boxShadow: '0 4px 12px rgba(22, 163, 74, 0.08)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontWeight: 700,
                            fontSize: '1rem',
                            marginBottom: '8px',
                        }}
                    >
                        <i className="fa-solid fa-bell" style={{ color: '#16a34a', fontSize: '1.15rem' }}></i>
                        <span>
                            Thông báo: Bạn có {approvedRecords.length} yêu cầu mượn sách đã được chấp nhận duyệt!
                        </span>
                    </div>
                    <ul style={{ margin: '0 0 6px 22px', fontSize: '0.92rem', lineHeight: 1.6 }}>
                        {approvedRecords.map((item) => (
                            <li key={item.id}>
                                Phiếu <strong>#{item.id}</strong> —{' '}
                                <strong>{item.BookCopy?.Book?.title || 'Sách'}</strong> (Mã bản sao:{' '}
                                <code>{item.BookCopy?.accessionCode || `#${item.copyId}`}</code>, hạn trả dự kiến:{' '}
                                {formatDate(item.dueDate)})
                            </li>
                        ))}
                    </ul>
                    <div style={{ fontSize: '0.86rem', color: '#15803d', fontWeight: 600 }}>
                        <i className="fa-solid fa-circle-info" style={{ marginRight: 6 }}></i>
                        Vui lòng đến quầy thư viện để nhận sách từ thủ thư.
                    </div>
                </div>
            )}

            {/* Reader request form */}
            {user.role === 'reader' && (
                <BorrowRequestForm
                    initialBookId={initialBookId}
                    onMessage={showMessage}
                    onSubmitted={fetchRecords}
                />
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
                    {' '}Lịch sử (đã hoàn tất)
                </button>
            </div>

            {/* Borrow records table */}
            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>ID Giao dịch</th>
                            <th>Sách</th>
                            <th>Mã Bản Sao</th>
                            {isStaff && <th>Độc Giả</th>}
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
                                    colSpan={colCount}
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
                                    colSpan={colCount}
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
                            records.map((r) => {
                                const overdue = isOverdueRecord(r);
                                const clickableOverdue = isStaff && overdue;
                                return (
                                <tr
                                    key={r.id}
                                    onClick={() => {
                                        if (clickableOverdue) {
                                            setContactRecord(r);
                                        }
                                    }}
                                    title={clickableOverdue ? 'Bấm để xem thông tin liên lạc độc giả (Email & SĐT)' : undefined}
                                    style={clickableOverdue ? { cursor: 'pointer' } : undefined}
                                >
                                    <td>#{r.id}</td>

                                    <td>
                                        <strong>
                                            {r.BookCopy?.Book?.title || '-'}
                                        </strong>
                                    </td>

                                    <td>
                                        <span style={{ fontFamily: 'monospace' }}>
                                            {r.BookCopy?.accessionCode || `#${r.copyId}`}
                                        </span>
                                    </td>

                                    {isStaff && (
                                        <td>
                                            {r.user?.fullName || r.user?.username || `#${r.userId}`}
                                        </td>
                                    )}

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

<td style={{
    width: '130px',
    minWidth: '130px',
    textAlign: 'center'
}}>
    <span
        className={`badge ${getStatusClass(r)}`}
        onClick={(e) => {
            if (clickableOverdue) {
                e.stopPropagation();
                setContactRecord(r);
            }
        }}
        style={{
            display: 'inline-block',
            width: '105px',
            padding: '6px 4px',
            textAlign: 'center',
            boxSizing: 'border-box',
            ...(clickableOverdue
                ? { cursor: 'pointer', textDecoration: 'underline' }
                : {})
        }}
    >
        {getStatusLabel(r)}
        {clickableOverdue && (
            <i
                className="fa-solid fa-address-card"
                style={{ marginLeft: 5 }}
            ></i>
        )}
    </span>
</td>

                                    <td onClick={(e) => e.stopPropagation()}>
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

                                            {/* Staff: return borrowed book */}
                                            {r.status === 'borrowed' && isStaff && (
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

                                            {/* Staff: view contact info when overdue */}
                                            {clickableOverdue && (
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => setContactRecord(r)}
                                                    style={{
                                                        background: '#fef2f2',
                                                        color: '#b91c1c',
                                                        border: '1px solid #fecaca',
                                                    }}
                                                >
                                                    <i className="fa-solid fa-phone-volume"></i>
                                                    {' '}Liên hệ
                                                </button>
                                            )}

                                            {/* Reader: borrowed notice */}
                                            {r.status === 'borrowed' && !isStaff && (
                                                <span
                                                    style={{
                                                        fontSize: '0.82rem',
                                                        color: '#2563eb',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    <i className="fa-solid fa-book-open-reader"></i> Đang mượn – trả sách tại quầy
                                                </span>
                                            )}

                                            {/* Reader: approved notice */}
                                            {r.status === 'approved' && !isStaff && (
                                                <span
                                                    style={{
                                                        fontSize: '0.82rem',
                                                        color: '#15803d',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    <i className="fa-solid fa-circle-check"></i> Đã duyệt – đến quầy nhận sách
                                                </span>
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
                                );
                            })
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

            {/* Overdue Reader Contact Modal */}
            {contactRecord && (
                <div
                    className="modal-backdrop"
                    onClick={() => setContactRecord(null)}
                >
                    <div
                        className="modal-content"
                        style={{ maxWidth: '500px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div className="modal-title">
                                <i
                                    className="fa-solid fa-address-card"
                                    style={{ color: '#dc2626' }}
                                ></i>
                                <span>Thông Tin Liên Lạc Độc Giả Quá Hạn</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setContactRecord(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.3rem',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                }}
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div
                                style={{
                                    padding: '12px 14px',
                                    borderRadius: '10px',
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    color: '#991b1b',
                                    fontSize: '0.9rem',
                                }}
                            >
                                <div>
                                    Phiếu mượn <strong>#{contactRecord.id}</strong> — Quá hạn{' '}
                                    <strong>{getOverdueDays(contactRecord)} ngày</strong> (Hạn trả:{' '}
                                    {formatDate(contactRecord.dueDate)})
                                </div>
                                <div style={{ marginTop: 4 }}>
                                    Sách: <strong>{contactRecord.BookCopy?.Book?.title || '-'}</strong> (Mã bản sao:{' '}
                                    <code>{contactRecord.BookCopy?.accessionCode || `#${contactRecord.copyId}`}</code>)
                                </div>
                            </div>

                            <div
                                style={{
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    background: '#f8fafc',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Họ và tên độc giả</div>
                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                                        {contactRecord.user?.fullName || contactRecord.user?.username || `#${contactRecord.userId}`}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Email liên hệ</div>
                                    {contactRecord.user?.email ? (
                                        <a
                                            href={`mailto:${contactRecord.user.email}`}
                                            style={{ fontWeight: 600, fontSize: '0.95rem', color: '#2563eb' }}
                                        >
                                            <i className="fa-solid fa-envelope" style={{ marginRight: 6 }}></i>
                                            {contactRecord.user.email}
                                        </a>
                                    ) : (
                                        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Chưa cập nhật email</div>
                                    )}
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Số điện thoại</div>
                                    {contactRecord.user?.phone ? (
                                        <a
                                            href={`tel:${contactRecord.user.phone}`}
                                            style={{ fontWeight: 600, fontSize: '0.95rem', color: '#16a34a' }}
                                        >
                                            <i className="fa-solid fa-phone" style={{ marginRight: 6 }}></i>
                                            {contactRecord.user.phone}
                                        </a>
                                    ) : (
                                        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Chưa cập nhật số điện thoại</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setContactRecord(null)}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
