import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function ReservationManagement() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reservations');
      setReservations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/reservations/${id}`, { status });
      setMessage(`✅ Đã cập nhật trạng thái đặt trước: ${status}`);
      fetchReservations();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi cập nhật');
    }
  };

  return (
    <div className="container">
      <h1 style={{ fontSize: '1.8rem', color: '#0f172a', fontWeight: 800 }}>
        <i className="fa-solid fa-bookmark" style={{ color: '#2563eb', marginRight: '10px' }}></i>
        Quản Lý Đặt Trước Sách (Book Reservations)
      </h1>
      <p style={{ color: '#64748b', marginTop: '4px' }}>
        Theo dõi trạng thái giữ sách, thời hạn hết hạn và giao nhận sách đặt trước
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
              <th>ID</th>
              <th>Đầu Sách</th>
              <th>Ngày Đặt</th>
              <th>Hạn Đến Nhận</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Chưa có yêu cầu đặt trước nào.
                </td>
              </tr>
            ) : (
              reservations.map(r => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td><strong>{r.Book?.title || `Sách ID: ${r.bookId}`}</strong></td>
                  <td>{r.reservationDate ? new Date(r.reservationDate).toLocaleDateString() : '-'}</td>
                  <td>{r.expirationDate ? new Date(r.expirationDate).toLocaleDateString() : '-'}</td>
                  <td>
                    <span className={`badge badge-${r.status}`}>
                      {r.status === 'pending' ? 'Chờ sách về' : r.status === 'ready' ? 'Sẵn sàng nhận' : r.status === 'completed' ? 'Đã nhận' : r.status === 'cancelled' ? 'Đã hủy' : r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === 'pending' && (user?.role === 'admin' || user?.role === 'librarian') && (
                      <button className="btn btn-primary btn-sm" style={{ marginRight: '6px' }} onClick={() => handleUpdateStatus(r.id, 'ready')}>
                        Báo sách đã sẵn sàng
                      </button>
                    )}
                    {r.status === 'ready' && (user?.role === 'admin' || user?.role === 'librarian') && (
                      <button className="btn btn-success btn-sm" style={{ marginRight: '6px' }} onClick={() => handleUpdateStatus(r.id, 'completed')}>
                        Xác nhận đã đến nhận
                      </button>
                    )}
                    {(r.status === 'pending' || r.status === 'ready') && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleUpdateStatus(r.id, 'cancelled')}>
                        Hủy đặt
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
