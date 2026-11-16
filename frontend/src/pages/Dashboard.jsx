
import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import './Dashboard.css';

const formatNumber = (value) =>
  Number(value || 0).toLocaleString('vi-VN');

const formatDate = (date) => {
  if (!date) return 'Chưa có';

  return new Date(date).toLocaleDateString('vi-VN');
};

export default function Dashboard() {
  const [overview, setOverview] = useState({});
  const [topBooks, setTopBooks] = useState([]);
  const [overdueBooks, setOverdueBooks] = useState([]);
  const [borrowingData, setBorrowingData] = useState([]);

  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [error, setError] = useState('');

  // Lấy dữ liệu tổng quan, sách phổ biến và sách quá hạn
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const [overviewRes, topBooksRes, overdueRes] =
          await Promise.all([
            api.get('/statistics/overview'),
            api.get('/statistics/top-books'),
            api.get('/statistics/overdue')
          ]);

        setOverview(overviewRes.data);
        setTopBooks(
          Array.isArray(topBooksRes.data)
            ? topBooksRes.data
            : topBooksRes.data.topBooks || []
        );
        setOverdueBooks(
          Array.isArray(overdueRes.data)
            ? overdueRes.data
            : overdueRes.data.overdue || []
        );
      } catch (err) {
        console.error('Lỗi tải Dashboard:', err);
        setError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Không thể tải dữ liệu thống kê.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Lấy dữ liệu biểu đồ theo khoảng thời gian
  useEffect(() => {
    const fetchBorrowing = async () => {
      try {
        setChartLoading(true);

        const response = await api.get(
          `/statistics/borrowing?period=${period}`
        );

        const borrowings = response.data.borrowings || [];
        const returns = response.data.returns || [];

        const dataMap = {};

        borrowings.forEach((item) => {
          const date = String(item.date).slice(0, 10);
          dataMap[date] = {
            date,
            borrow: Number(item.count || item.total || 0),
            returned: 0
          };
        });

        returns.forEach((item) => {
          const date = String(item.date).slice(0, 10);

          if (!dataMap[date]) {
            dataMap[date] = {
              date,
              borrow: 0,
              returned: 0
            };
          }

          dataMap[date].returned = Number(
            item.count || item.total || 0
          );
        });

        setBorrowingData(
          Object.values(dataMap).sort((a, b) =>
            a.date.localeCompare(b.date)
          )
        );
      } catch (err) {
        console.error('Lỗi tải biểu đồ:', err);
        setBorrowingData([]);
      } finally {
        setChartLoading(false);
      }
    };

    fetchBorrowing();
  }, [period]);

  const chartData = useMemo(() => {
    return borrowingData.map((item) => ({
      ...item,
      label: item.date.slice(5)
    }));
  }, [borrowingData]);

  const statisticCards = [
    {
      title: 'Tổng số sách',
      value: overview.totalBooks,
      icon: 'fa-book',
      color: 'blue'
    },
    {
      title: 'Tổng bản sao',
      value: overview.totalCopies,
      icon: 'fa-copy',
      color: 'purple'
    },
    {
      title: 'Bản sao có sẵn',
      value: overview.availableCopies,
      icon: 'fa-book-open',
      color: 'green'
    },
    {
      title: 'Đang được mượn',
      value: overview.borrowedCopies,
      icon: 'fa-book-reader',
      color: 'orange'
    },
    {
      title: 'Tổng độc giả',
      value: overview.totalReaders,
      icon: 'fa-users',
      color: 'cyan'
    },
    {
      title: 'Lượt mượn đang hoạt động',
      value: overview.activeBorrows,
      icon: 'fa-clock',
      color: 'blue'
    },
    {
      title: 'Tổng lượt trả',
      value: overview.totalReturns,
      icon: 'fa-rotate-left',
      color: 'green'
    },
    {
      title: 'Sách quá hạn',
      value: overview.overdueBooks,
      icon: 'fa-triangle-exclamation',
      color: 'red'
    }
  ];

  if (loading) {
    return (
      <div className="dashboard-container">
        <p className="dashboard-message">Đang tải dữ liệu thống kê...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard thống kê</h1>
          <p>Tổng quan hoạt động của thư viện</p>
        </div>

        <button
          className="dashboard-refresh"
          onClick={() => window.location.reload()}
        >
          <i className="fa-solid fa-rotate"></i> Làm mới
        </button>
      </div>

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      {/* Các thẻ thống kê */}
      <div className="dashboard-stats">
        {statisticCards.map((item, index) => (
          <div className="stat-card" key={index}>
            <div className={`stat-icon ${item.color}`}>
              <i className={`fa-solid ${item.icon}`}></i>
            </div>

            <div className="stat-info">
              <p>{item.title}</p>
              <h2>{formatNumber(item.value)}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Biểu đồ */}
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Thống kê mượn và trả sách</h2>
            <p>Theo dõi số lượt mượn và trả theo thời gian</p>
          </div>

          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
          >
            <option value={7}>7 ngày</option>
            <option value={30}>30 ngày</option>
            <option value={90}>90 ngày</option>
            <option value={365}>1 năm</option>
          </select>
        </div>

        <div className="dashboard-chart">
          {chartLoading ? (
            <p className="dashboard-message">Đang tải biểu đồ...</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 5
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />

                <Bar
                  dataKey="borrow"
                  name="Lượt mượn"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />

                <Bar
                  dataKey="returned"
                  name="Lượt trả"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Top sách */}
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Top 5 sách được mượn nhiều nhất</h2>
            <p>Những đầu sách có lượt mượn cao nhất</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên sách</th>
                <th>Lượt mượn</th>
              </tr>
            </thead>

            <tbody>
              {topBooks.length > 0 ? (
                topBooks.map((book, index) => (
                  <tr key={book.id || index}>
                    <td>{index + 1}</td>
                    <td>
                      {book.title || book.bookTitle || book.name || 'Không rõ tên'}
                    </td>
                    <td>
                      {formatNumber(
                        book.borrowCount || book.borrow_count || book.totalBorrows
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="empty-data">
                    Chưa có dữ liệu sách được mượn
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sách quá hạn */}
      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Danh sách sách quá hạn</h2>
            <p>Các lượt mượn đã quá ngày trả</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Độc giả</th>
                <th>Tên sách</th>
                <th>Ngày mượn</th>
                <th>Hạn trả</th>
              </tr>
            </thead>

            <tbody>
              {overdueBooks.length > 0 ? (
                overdueBooks.map((record) => (
                  <tr key={record.id}>
                    <td>
                      {record.user?.full_name ||
                        record.user?.username ||
                        'Không rõ'}
                    </td>

                    <td>
                      {record.BookCopy?.Book?.title ||
                        record.BookCopy?.book?.title ||
                        'Không rõ'}
                    </td>

                    <td>{formatDate(record.borrowDate || record.borrow_date)}</td>

                    <td className="overdue-date">
                      {formatDate(record.dueDate || record.due_date)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="empty-data">
                    Không có sách quá hạn
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
