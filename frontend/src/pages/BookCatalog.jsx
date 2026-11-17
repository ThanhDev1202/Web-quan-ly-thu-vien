import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getFullFileUrl } from '../api/api';

export default function BookCatalog() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [copies, setCopies] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

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

  const getAvailableCopies = (book) => {
    if (book.BookCopies) {
      return book.BookCopies.filter(c => c.status === 'available');
    }
    return copies.filter(c => c.bookId === book.id && c.status === 'available');
  };

  const getTotalCopiesCount = (book) => {
    if (book.BookCopies) return book.BookCopies.length;
    return copies.filter(c => c.bookId === book.id).length;
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
            Tra Cứu Kho Sách & Tài Liệu Thư Viện
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>
            Tra cứu thông tin danh mục, đọc thử trực tuyến và tải tài liệu sách điện tử
          </p>
          <div className="tech-pill-container">
            <span className="tech-pill"><i className="fa-solid fa-sparkles"></i> AI Assistant Ready</span>
            <span className="tech-pill tech-pill-bc"><i className="fa-solid fa-link"></i> Blockchain Ledger Ready</span>
            <span className="tech-pill tech-pill-hqc"><i className="fa-solid fa-shield-halved"></i> Post-Quantum HQC Encrypted</span>
          </div>
        </div>
      </div>

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
            const availCopies = getAvailableCopies(book);
            const totalCopies = getTotalCopiesCount(book);
            const hasPreview = book.BookPreviews && book.BookPreviews.length > 0;

            return (
              <div key={book.id} className="card">
                {/* Book Cover Image linking to Detail */}
                <Link
                  to={`/books/${book.id}`}
                  style={{
                    height: '200px', background: '#f1f5f9', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', overflow: 'hidden', position: 'relative', textDecoration: 'none'
                  }}
                  title="Nhấn để xem chi tiết sách"
                >
                  {book.coverImage ? (
                    <img
                      src={getFullFileUrl(book.coverImage)}
                      alt={book.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/280x200?text=No+Cover';
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                      <i className="fa-solid fa-book" style={{ fontSize: '3.5rem', marginBottom: '8px' }}></i>
                      <div style={{ fontSize: '0.8rem' }}>Chưa có ảnh bìa</div>
                    </div>
                  )}

                  {/* Online preview ribbon if available */}
                  {hasPreview && (
                    <span style={{
                      position: 'absolute', top: '10px', right: '10px', background: '#ef4444',
                      color: 'white', fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px',
                      borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                    }}>
                      <i className="fa-solid fa-file-pdf"></i> Đọc online
                    </span>
                  )}
                </Link>

                <div className="card-body">
                  <span className="badge" style={{ alignSelf: 'flex-start', background: '#ede9fe', color: '#6d28d9', marginBottom: '8px' }}>
                    {book.Category?.name || 'Chung'}
                  </span>
                  
                  <Link to={`/books/${book.id}`} style={{ textDecoration: 'none' }}>
                    <h3 className="card-title" style={{ transition: 'color 0.2s' }}>
                      {book.title}
                    </h3>
                  </Link>

                  <p className="card-subtitle">
                    <i className="fa-solid fa-barcode"></i> ISBN: {book.isbn || 'Chưa cập nhật'} | Năm: {book.publicationYear || 'N/A'}
                  </p>
                  
                  <p className="card-text">
                    {book.description ? (book.description.length > 90 ? book.description.substring(0, 90) + '...' : book.description) : 'Không có mô tả chi tiết.'}
                  </p>
                  
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>
                      Tồn kho: <strong>{availCopies.length}</strong> / {totalCopies} cuốn
                    </span>
                    <span className={`badge ${availCopies.length > 0 ? 'badge-available' : 'badge-borrowed'}`}>
                      {availCopies.length > 0 ? 'Còn sách tại quầy' : 'Hết bản sao'}
                    </span>
                  </div>
                </div>

                <div className="card-footer" style={{ justifyContent: 'space-between' }}>
                  <Link 
                    to={`/books/${book.id}`}
                    className="btn btn-primary btn-sm"
                    style={{ textDecoration: 'none', width: '100%', justifyContent: 'center' }}
                  >
                    <i className="fa-solid fa-book-open"></i> Xem chi tiết & Đọc thử
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
