import React, { useState, useEffect } from 'react';
import api from '../api/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/audit');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
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
        <div>
          <span className="tech-pill tech-pill-bc" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <i className="fa-solid fa-cube"></i> Immutable Blockchain Hash Ready
          </span>
        </div>
      </div>

      <div className="table-responsive" style={{ marginTop: '24px' }}>
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
            {logs.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Chưa có bản ghi nhật ký nào.
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id}>
                  <td>#{log.id}</td>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                  <td>
                    <strong>{log.User?.fullName || log.User?.username || 'Hệ thống'}</strong>
                    {log.User?.role && (
                      <span className={`role-tag role-${log.User.role}`} style={{ marginLeft: '8px' }}>
                        {log.User.role}
                      </span>
                    )}
                  </td>
                  <td><span className="badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>{log.action}</span></td>
                  <td>{log.description || '-'}</td>
                  <td>
                    <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>
                      <i className="fa-solid fa-lock"></i> HQC Verified
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
