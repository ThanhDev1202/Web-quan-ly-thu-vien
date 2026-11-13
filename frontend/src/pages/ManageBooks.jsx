import React, { useState, useEffect } from 'react';
import api from '../api/api';

export default function ManageBooks() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  
  // Book Form
  const [newBook, setNewBook] = useState({
    title: '',
    isbn: '',
    publisher: '',
    publicationYear: new Date().getFullYear(),
    description: '',
    coverImage: '',
    categoryId: ''
  });

  // Category Form
  const [newCat, setNewCat] = useState({ name: '', description: '' });

  // Copy Form
  const [copyData, setCopyData] = useState({ bookId: '', accessionCode: '', status: 'available' });

  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [bRes, cRes, aRes] = await Promise.all([
        api.get('/books'),
        api.get('/categories'),
        api.get('/authors').catch(() => ({ data: [] }))
      ]);
      setBooks(bRes.data);
      setCategories(cRes.data);
      setAuthors(aRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/books', newBook);
      setMessage('✅ Thêm đầu sách mới thành công!');
      setNewBook({ title: '', isbn: '', publisher: '', publicationYear: 2026, description: '', coverImage: '', categoryId: '' });
      loadAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi thêm sách');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories', newCat);
      setMessage('✅ Thêm thể loại mới thành công!');
      setNewCat({ name: '', description: '' });
      loadAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi thêm thể loại');
    }
  };

  const handleAddCopy = async (e) => {
    e.preventDefault();
    try {
      await api.post('/copies', copyData);
      setMessage('✅ Thêm bản sao vật lý thành công!');
      setCopyData({ bookId: '', accessionCode: '', status: 'available' });
      loadAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi thêm bản sao');
    }
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa cuốn sách này?')) return;
    try {
      await api.delete(`/books/${id}`);
      setMessage('Đã xóa sách.');
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi xóa sách');
    }
  };

  return (
    <div className="container">
      <h1 style={{ fontSize: '1.8rem', color: '#0f172a', fontWeight: 800 }}>
        <i className="fa-solid fa-sliders" style={{ color: '#2563eb', marginRight: '10px' }}></i>
        Quản Trị Danh Mục & Kho Sách
      </h1>
      <p style={{ color: '#64748b', marginTop: '4px' }}>
        Dành cho Thủ thư (Librarian) và Quản trị viên (Admin)
      </p>

      {message && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px 18px', borderRadius: '8px', marginTop: '16px', fontWeight: '500' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '24px' }}>
        {/* Form Thêm Sách */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '16px', color: '#1e3a8a' }}>
            <i className="fa-solid fa-book-medical"></i> Thêm Đầu Sách Mới
          </h3>
          <form onSubmit={handleCreateBook}>
            <div className="form-group">
              <label className="form-label">Tiêu đề sách:</label>
              <input type="text" className="form-control" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Mã ISBN:</label>
              <input type="text" className="form-control" value={newBook.isbn} onChange={e => setNewBook({...newBook, isbn: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Thể loại:</label>
              <select className="form-control" value={newBook.categoryId} onChange={e => setNewBook({...newBook, categoryId: e.target.value})}>
                <option value="">-- Chọn thể loại --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Nhà xuất bản:</label>
              <input type="text" className="form-control" value={newBook.publisher} onChange={e => setNewBook({...newBook, publisher: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Năm xuất bản:</label>
              <input type="number" className="form-control" value={newBook.publicationYear} onChange={e => setNewBook({...newBook, publicationYear: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Mô tả tóm tắt:</label>
              <textarea className="form-control" rows="3" value={newBook.description} onChange={e => setNewBook({...newBook, description: e.target.value})}></textarea>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <i className="fa-solid fa-plus"></i> Tạo Sách
            </button>
          </form>
        </div>

        {/* Form Thêm Bản Sao (Copy) & Thể loại */}
        <div>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '16px', color: '#1e3a8a' }}>
              <i className="fa-solid fa-copy"></i> Nhập Bản Sao Vật Lý (Book Copy)
            </h3>
            <form onSubmit={handleAddCopy}>
              <div className="form-group">
                <label className="form-label">Thuộc đầu sách:</label>
                <select className="form-control" value={copyData.bookId} onChange={e => setCopyData({...copyData, bookId: e.target.value})} required>
                  <option value="">-- Chọn sách --</option>
                  {books.map(b => <option key={b.id} value={b.id}>{b.title} (ISBN: {b.isbn})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Mã vạch / Kiểm kê (Accession Code):</label>
                <input type="text" className="form-control" placeholder="VD: BC-00129" value={copyData.accessionCode} onChange={e => setCopyData({...copyData, accessionCode: e.target.value})} required />
              </div>
              <button type="submit" className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }}>
                <i className="fa-solid fa-barcode"></i> Nhập Bản Sao
              </button>
            </form>
          </div>

          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '16px', color: '#1e3a8a' }}>
              <i className="fa-solid fa-folder-plus"></i> Thêm Thể Loại
            </h3>
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label className="form-label">Tên thể loại:</label>
                <input type="text" className="form-control" value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})} required />
              </div>
              <button type="submit" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                Thêm Thể Loại
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Danh sách sách đã tạo */}
      <div className="table-responsive" style={{ marginTop: '32px' }}>
        <h3 style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', margin: 0 }}>
          Danh sách đầu sách hiện hành ({books.length})
        </h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tiêu đề</th>
              <th>ISBN</th>
              <th>Thể loại</th>
              <th>Nhà XB</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {books.map(b => (
              <tr key={b.id}>
                <td>#{b.id}</td>
                <td><strong>{b.title}</strong></td>
                <td>{b.isbn || '-'}</td>
                <td>{b.Category?.name || '-'}</td>
                <td>{b.publisher || '-'}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBook(b.id)}>
                    <i className="fa-solid fa-trash"></i> Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
