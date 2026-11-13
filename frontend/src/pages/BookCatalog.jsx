import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function BookCatalog() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [copies, setCopies] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookRes, catRes, copyRes] = await Promise.all([
        api.get('/books'),
        api.get('/categories').catch(() => ({ data: [] })),
        api.get('/copies').catch(() => ({ data: [] }))
      ]);
      setBooks(bookRes.data);
      setCategories(catRes.data);
      setCopies(copyRes.data);
    } catch (err) {
      console.error('Error fetching data', err);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableCopies = (bookId) => {
    return copies.filter(c => c.bookId === bookId && c.status === 'available');
  };

  const handleBorrowRequest = async (copyId) => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để yêu cầu mượn sách!');
      return;
    }
    const due = new Date();
    due.setDate(due.getDate() + 14); // 14 days loan

    try {
      await api.post('/borrow/request', {
        copyId,
        dueDate: due.toISOString()
      });
      setMessage('✅ Gửi yêu cầu mượn sách thành công! Vui lòng chờ thủ thư duyệt.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể yêu cầu mượn sách');
    }
  };

  const handleReserve = async (bookId) => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để đặt trước sách!');
      return;
    }
    const exp = new Date();
    exp.setDate(exp.getDate() + 3);

    try {
      await api.post('/reservations', {
        bookId,
        expirationDate: exp.toISOString()
      });
      setMessage('✅ Đặt trước sách thành công! Hãy đến nhận trước hạn giữ sách.');
    } catch (err) {
      alert(err.response?.data?.error || 'Không thể đặt trước sách');
    }
  };

  const filteredBooks = books.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.isbn && b.isbn.includes(search)) ||
      (b.publisher && b.publisher.toLowerCase().includes(search.toLowerCase()));
    const matchCat = !selectedCategory || String(b.categoryId) === String(selectedCategory);
    return matchSearch && matchCat;
  });

  return (
    <div className="container">
      {/* Header & Tech badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#0f172a', fontWeight: 800 }}>
            <i className="fa-solid fa-books" style={{ color: '#2563eb', marginRight: '10px' }}></i>
            Kho Sách & Tài Liệu Thư Viện
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>
            Tra cứu thông tin, tình trạng bản sao và mượn sách trực tuyến
          </p>
          <div className="tech-pill-container">
            <span className="tech-pill"><i className="fa-solid fa-sparkles"></i> AI Assistant Ready</span>
            <span className="tech-pill tech-pill-bc"><i className="fa-solid fa-link"></i> Blockchain Ledger Ready</span>
            <span className="tech-pill tech-pill-hqc"><i className="fa-solid fa-shield-halved"></i> Post-Quantum HQC Encrypted</span>
          </div>
        </div>
      </div>

      {message && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px 18px', borderRadius: '8px', marginTop: '16px', fontWeight: '500' }}>
          {message}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '2', minWidth: '240px' }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="🔍 Tìm sách theo tiêu đề, ISBN, nhà xuất bản..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <div style={{ flex: '1', minWidth: '180px' }}>
          <select 
            className="form-control" 
            value={selectedCategory} 
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="">Tất cả thể loại</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
          <p style={{ marginTop: '12px' }}>Đang tải danh sách sách...</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', marginTop: '24px', border: '1px solid #e2e8f0' }}>
          <i className="fa-solid fa-book-open" style={{ fontSize: '3rem', color: '#cbd5e1' }}></i>
          <p style={{ marginTop: '12px', color: '#64748b' }}>Không tìm thấy cuốn sách nào phù hợp.</p>
        </div>
      ) : (
        <div className="grid">
          {filteredBooks.map(book => {
            const availCopies = getAvailableCopies(book.id);
            const totalCopies = copies.filter(c => c.bookId === book.id).length;

            return (
              <div key={book.id} className="card">
                <div style={{ height: '160px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {book.coverImage ? (
                    <img src={book.coverImage} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <i className="fa-solid fa-book" style={{ fontSize: '4rem', color: '#94a3b8' }}></i>
                  )}
                </div>

                <div className="card-body">
                  <span className="badge" style={{ alignSelf: 'flex-start', background: '#ede9fe', color: '#6d28d9', marginBottom: '8px' }}>
                    {book.Category?.name || 'Chung'}
                  </span>
                  <h3 className="card-title">{book.title}</h3>
                  <p className="card-subtitle">
                    <i className="fa-solid fa-barcode"></i> ISBN: {book.isbn || 'Chưa cập nhật'} | Năm: {book.publicationYear || 'N/A'}
                  </p>
                  <p className="card-text">
                    {book.description ? (book.description.length > 100 ? book.description.substring(0, 100) + '...' : book.description) : 'Không có mô tả chi tiết.'}
                  </p>
                  
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>
                      Khả dụng: <strong>{availCopies.length}</strong> / {totalCopies} bản
                    </span>
                    <span className={`badge ${availCopies.length > 0 ? 'badge-available' : 'badge-borrowed'}`}>
                      {availCopies.length > 0 ? 'Còn sách' : 'Hết bản sao'}
                    </span>
                  </div>
                </div>

                <div className="card-footer">
                  {availCopies.length > 0 ? (
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={() => handleBorrowRequest(availCopies[0].id)}
                    >
                      <i className="fa-solid fa-hand-holding-hand"></i> Mượn sách
                    </button>
                  ) : (
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => handleReserve(book.id)}
                    >
                      <i className="fa-solid fa-bookmark"></i> Đặt trước
                    </button>
                  )}

                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => alert(`Chi tiết sách: ${book.title}\nNXB: ${book.publisher || 'N/A'}\nSố lượng còn: ${availCopies.length}`)}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
