import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function BorrowManagement() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      // In a full implementation, you can query /borrow/history or /copies
      // We will fetch borrow records:
      const res = await api.get('/borrow/all').catch(async () => {
        // Fallback for demonstration:
        return { data: [] };
      });
      setRecords(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/borrow/approve/${id}`);
      setMessage('✅ Đã duyệt mượn sách thành công!');
      fetchRecords();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi duyệt mượn');
    }
  };

  const handleReturn = async (id) => {
    try {
      await api.post(`/borrow/return/${id}`);
      setMessage('✅ Đã xác nhận trả sách vào kho!');
      fetchRecords();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi trả sách');
    }
  };

  return (
    <div className="container">
      <h1 style={{ fontSize: '1.8rem', color: '#0f172a', fontWeight: 800 }}>
        <i className="fa-solid fa-arrows-rotate" style={{ color: '#2563eb', marginRight: '10px' }}></i>
        Quản Lý Hoạt Động Mượn & Trả Sách
      </h1>
      <p style={{ color: '#64748b', marginTop: '4px' }}>
        Xác nhận giao sách, thu hồi sách và cập nhật tình trạng bản sao trong kho
      </p>

      {message && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px 18px', borderRadius: '8px', marginTop: '16px', fontWeight: '500' }}>
          {message}
        </div>
      )}

      <div className="table-responsive" style={{ marginTop: '24px' }}>
        <table>
          <thead>
            <tr>
              <th>ID Giao dịch</th>
              <th>Mã Bản Sao</th>
              <th>Ngày Mượn</th>
              <th>Hạn Trả</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Hiện chưa có giao dịch mượn trả nào phát sinh hoặc đang chờ xử lý.
                </td>
              </tr>
            ) : (
              records.map(r => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td><strong>{r.copyId}</strong></td>
                  <td>{r.borrowDate ? new Date(r.borrowDate).toLocaleDateString() : '-'}</td>
                  <td>{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '-'}</td>
                  <td>
                    <span className={`badge badge-${r.status}`}>
                      {r.status === 'pending' ? 'Chờ duyệt' : r.status === 'borrowed' ? 'Đang mượn' : r.status === 'returned' ? 'Đã trả' : r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === 'pending' && (user?.role === 'admin' || user?.role === 'librarian') && (
                      <button className="btn btn-success btn-sm" onClick={() => handleApprove(r.id)}>
                        <i className="fa-solid fa-check"></i> Duyệt giao sách
                      </button>
                    )}
                    {r.status === 'borrowed' && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleReturn(r.id)}>
                        <i className="fa-solid fa-rotate-left"></i> Xác nhận trả
                      </button>
                    )}
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
