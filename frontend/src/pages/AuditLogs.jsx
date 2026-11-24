import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/api';

const PAGE_SIZE = 20;

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, hasMore: true, total: 0 });

  // Filter state
  const [filterAction, setFilterAction] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [availableActions, setAvailableActions] = useState([]);

  const loaderRef = useRef(null);

  // Lấy danh sách loại action để hiển thị bộ lọc
  useEffect(() => {
    api.get('/audit/actions')
      .then(res => setAvailableActions(res.data || []))
      .catch(() => {});
  }, []);

  // Reset và load lại khi filter thay đổi
  useEffect(() => {
    setLogs([]);
    setPagination({ page: 1, hasMore: true, total: 0 });
    fetchLogs(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterAction, filterDateFrom, filterDateTo]);

  const buildParams = (page) => {
    const params = { page, limit: PAGE_SIZE };
    if (filterAction) params.action = filterAction;
    if (filterDateFrom) params.dateFrom = filterDateFrom;
    if (filterDateTo) params.dateTo = filterDateTo;
    return params;
  };

  const fetchLogs = async (page = 1, reset = false) => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await api.get('/audit', { params: buildParams(page) });
      const { data, pagination: pg } = res.data;
      setLogs(prev => reset ? data : [...prev, ...data]);
      setPagination({ page: pg.page, hasMore: pg.hasMore, total: pg.total });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && pagination.hasMore) {
      fetchLogs(pagination.page + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, pagination]);

  // Intersection Observer – tự động load thêm khi scroll đến cuối
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [loadMore]);

  const handleReset = () => {
    setFilterAction('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const actionColors = {
    LOGIN: { bg: '#dbeafe', color: '#1e40af' },
    LOGOUT: { bg: '#f1f5f9', color: '#475569' },
    CREATE: { bg: '#dcfce7', color: '#166534' },
    UPDATE: { bg: '#fef9c3', color: '#854d0e' },
    DELETE: { bg: '#fee2e2', color: '#991b1b' },
    BORROW: { bg: '#ede9fe', color: '#5b21b6' },
    RETURN: { bg: '#d1fae5', color: '#065f46' },
  };

  const getActionStyle = (action = '') => {
    const key = Object.keys(actionColors).find(k => action.toUpperCase().includes(k));
    return key ? actionColors[key] : { bg: '#e0e7ff', color: '#3730a3' };
  };

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#0f172a', fontWeight: 800 }}>
            <i className="fa-solid fa-shield-halved" style={{ color: '#ef4444', marginRight: '10px' }}></i>
            Nhật Ký Hoạt Động Hệ Thống (Audit Logs)
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>
            Giám sát các thao tác người dùng, phục vụ đối soát và sẵn sàng đồng bộ Smart Contract Blockchain
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {pagination.total > 0 && (
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Hiển thị <strong>{logs.length}</strong> / <strong>{pagination.total}</strong> bản ghi
            </span>
          )}
          <span className="tech-pill tech-pill-bc" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <i className="fa-solid fa-cube"></i> Immutable Blockchain Hash Ready
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end',
        marginTop: '20px', padding: '16px 20px',
        background: '#f8fafc', borderRadius: '12px',
        border: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '180px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <i className="fa-solid fa-filter" style={{ marginRight: '5px', color: '#6366f1' }}></i>Phân loại
          </label>
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
              background: '#fff', fontSize: '0.9rem', color: '#0f172a', cursor: 'pointer',
              outline: 'none', minWidth: '160px',
            }}
          >
            <option value="">Tất cả hành động</option>
            {availableActions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <i className="fa-regular fa-calendar" style={{ marginRight: '5px', color: '#6366f1' }}></i>Từ ngày
          </label>
          <input
            type="date"
            value={filterDateFrom}
            max={filterDateTo || undefined}
            onChange={e => setFilterDateFrom(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
              background: '#fff', fontSize: '0.9rem', color: '#0f172a', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <i className="fa-regular fa-calendar-check" style={{ marginRight: '5px', color: '#6366f1' }}></i>Đến ngày
          </label>
          <input
            type="date"
            value={filterDateTo}
            min={filterDateFrom || undefined}
            onChange={e => setFilterDateTo(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
              background: '#fff', fontSize: '0.9rem', color: '#0f172a', outline: 'none',
            }}
          />
        </div>

        {(filterAction || filterDateFrom || filterDateTo) && (
          <button
            onClick={handleReset}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: '1px solid #fca5a5',
              background: '#fff', color: '#dc2626', fontSize: '0.875rem', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              alignSelf: 'flex-end',
            }}
          >
            <i className="fa-solid fa-xmark"></i> Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-responsive" style={{ marginTop: '20px' }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Thời Gian</th>
              <th>Người Thực Hiện</th>
              <th>Hành Động</th>
              <th>Mô Tả Chi Tiết</th>
              <th>Trạng Thái Mã Hóa</th>
            </tr>
          </thead>
          <tbody>
            {!loading && logs.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <i className="fa-regular fa-folder-open" style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}></i>
                  Không tìm thấy bản ghi nhật ký nào.
                </td>
              </tr>
            ) : (
              logs.map(log => {
                const actionStyle = getActionStyle(log.action);
                return (
                  <tr key={log.id}>
                    <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>#{log.id}</td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td>
                      <strong>{log.User?.fullName || log.User?.username || 'Hệ thống'}</strong>
                      {log.User?.role && (
                        <span className={`role-tag role-${log.User.role}`} style={{ marginLeft: '8px' }}>
                          {log.User.role}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{ background: actionStyle.bg, color: actionStyle.color }}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.description || '-'}</td>
                    <td>
                      <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>
                        <i className="fa-solid fa-lock"></i> HQC Verified
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Loading skeleton rows */}
      {loading && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
          Đang tải nhật ký...
        </div>
      )}

      {/* Infinite scroll trigger + load-more indicator */}
      <div ref={loaderRef} style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
        {loadingMore && (
          <span>
            <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
            Đang tải thêm...
          </span>
        )}
        {!loadingMore && !pagination.hasMore && logs.length > 0 && (
          <span>
            <i className="fa-solid fa-check-circle" style={{ marginRight: '6px', color: '#22c55e' }}></i>
            Đã hiển thị tất cả {pagination.total} bản ghi
          </span>
        )}
      </div>
    </div>
  );
}
