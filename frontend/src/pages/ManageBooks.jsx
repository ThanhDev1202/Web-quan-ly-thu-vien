import React, { useState, useEffect } from 'react';
import api, { getFullFileUrl } from '../api/api';

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
      categoryId: '',
      authorNames: '',
      previewFileUrl: '',
      previewFileName: '',
      previewFileType: 'pdf'
  });

  // Upload loaders
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Category Form
  const [newCat, setNewCat] = useState({ name: '', description: '' });

  // Batch Copies Form
  const [copyMode, setCopyMode] = useState('range'); // 'range' | 'manual'
  const [batchData, setBatchData] = useState({
    bookId: '',
    prefix: '',
    startNumber: 1,
    quantity: 5,
    manualCodes: ''
  });

  // Modal State for Viewing Copies of a specific book
  const [selectedBookForCopies, setSelectedBookForCopies] = useState(null);
  const [bookCopiesList, setBookCopiesList] = useState([]);
  const [loadingCopies, setLoadingCopies] = useState(false);
  const [quickAddCount, setQuickAddCount] = useState(1);

  // Modal State for Managing Online Documents (PDF/EPUB) of a specific book
  const [selectedBookForDocs, setSelectedBookForDocs] = useState(null);
  const [bookDocsList, setBookDocsList] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadingModalDoc, setUploadingModalDoc] = useState(false);

  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setMessage('');
    } else {
      setMessage(msg);
      setErrorMsg('');
    }
    setTimeout(() => {
      setMessage('');
      setErrorMsg('');
    }, 5000);
  };

  // Upload Cover Image
  const handleCoverFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingCover(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await api.post('/upload', {
          fileName: file.name,
          fileData: reader.result,
          fileType: 'image'
        });
        setNewBook(prev => ({ ...prev, coverImage: res.data.fileUrl }));
        showNotification('✅ Tải lên ảnh bìa thành công!');
      } catch (err) {
        showNotification(err.response?.data?.error || 'Lỗi tải lên ảnh bìa', true);
      } finally {
        setUploadingCover(false);
      }
    };
    reader.onerror = () => {
      showNotification('Lỗi khi đọc tệp ảnh', true);
      setUploadingCover(false);
    };
    reader.readAsDataURL(file);
  };

  // Upload Preview PDF / Document
  const handleDocFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingDoc(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await api.post('/upload', {
          fileName: file.name,
          fileData: reader.result,
          fileType: file.name.endsWith('.epub') ? 'epub' : 'pdf'
        });
        setNewBook(prev => ({
          ...prev,
          previewFileUrl: res.data.fileUrl,
          previewFileName: file.name,
          previewFileType: file.name.endsWith('.epub') ? 'epub' : 'pdf'
        }));
        showNotification('✅ Tải lên tài liệu PDF online thành công!');
      } catch (err) {
        showNotification(err.response?.data?.error || 'Lỗi tải lên tài liệu', true);
      } finally {
        setUploadingDoc(false);
      }
    };
    reader.onerror = () => {
      showNotification('Lỗi khi đọc tệp tài liệu', true);
      setUploadingDoc(false);
    };
    reader.readAsDataURL(file);
  };

  // Create Book
  const handleCreateBook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/books', newBook);
      showNotification('✅ Thêm đầu sách mới thành công!');
      setNewBook({
        title: '',
        isbn: '',
        publisher: '',
        publicationYear: new Date().getFullYear(),
        description: '',
        coverImage: '',
        categoryId: '',
        authorIds: [],
        previewFileUrl: '',
        previewFileName: '',
        previewFileType: 'pdf'
      });
      loadAll();
    } catch (err) {
      showNotification(err.response?.data?.error || 'Lỗi thêm sách', true);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories', newCat);
      showNotification('✅ Thêm thể loại mới thành công!');
      setNewCat({ name: '', description: '' });
      loadAll();
    } catch (err) {
      showNotification(err.response?.data?.error || 'Lỗi thêm thể loại', true);
    }
  };

  // Batch Add Copies
  const handleBatchAddCopies = async (e) => {
    e.preventDefault();
    if (!batchData.bookId) {
      alert('Vui lòng chọn đầu sách cần nhập bản sao!');
      return;
    }

    try {
      let payload = { bookId: batchData.bookId };

      if (copyMode === 'range') {
        if (!batchData.prefix.trim()) {
          alert('Vui lòng nhập tiền tố mã kiểm kê (Ví dụ: CNTT, GD, VH...)');
          return;
        }
        payload.prefix = batchData.prefix.trim().toUpperCase();
        payload.startNumber = Number(batchData.startNumber) || 1;
        payload.quantity = Number(batchData.quantity) || 1;
      } else {
        const codes = batchData.manualCodes
          .split(/[\n,]+/)
          .map(s => s.trim())
          .filter(s => s.length > 0);
        if (codes.length === 0) {
          alert('Vui lòng nhập ít nhất một mã bản sao!');
          return;
        }
        payload.codes = codes;
      }

      const res = await api.post('/copies/batch', payload);
      showNotification(`✅ ${res.data.message}`);
      setBatchData(prev => ({
        ...prev,
        startNumber: (Number(prev.startNumber) || 1) + (Number(prev.quantity) || 1),
        manualCodes: ''
      }));
      loadAll();

      if (selectedBookForCopies && String(selectedBookForCopies.id) === String(batchData.bookId)) {
        loadBookCopies(selectedBookForCopies.id);
      }
    } catch (err) {
      showNotification(err.response?.data?.error || err.response?.data?.message || 'Lỗi nhập bản sao', true);
    }
  };

  // View Copies Modal
  const handleViewCopies = async (book) => {
    setSelectedBookForCopies(book);
    loadBookCopies(book.id);
  };

  const loadBookCopies = async (bookId) => {
    setLoadingCopies(true);
    try {
      const res = await api.get(`/copies/book/${bookId}`);
      setBookCopiesList(res.data);
    } catch (err) {
      console.error(err);
      alert('Không thể tải danh sách bản sao của sách này');
    } finally {
      setLoadingCopies(false);
    }
  };

  const handleDeleteCopy = async (copyId, accessionCode) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bản sao có mã "${accessionCode}"?`)) return;
    try {
      await api.delete(`/copies/${copyId}`);
      showNotification(`✅ Đã xóa bản sao "${accessionCode}".`);
      loadBookCopies(selectedBookForCopies.id);
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi xóa bản sao');
    }
  };

  const handleQuickAddSingle = async () => {
    if (!selectedBookForCopies) return;
    const count = Number(quickAddCount) || 1;
    const defaultPrefix = (selectedBookForCopies.title.substring(0, 3).toUpperCase() || 'BK');
    const startNum = (bookCopiesList.length + 1);

    try {
      await api.post('/copies/batch', {
        bookId: selectedBookForCopies.id,
        prefix: defaultPrefix,
        startNumber: startNum,
        quantity: count
      });
      showNotification(`✅ Đã thêm ${count} bản sao mới cho "${selectedBookForCopies.title}".`);
      loadBookCopies(selectedBookForCopies.id);
      loadAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi thêm bản sao');
    }
  };

  // View & Manage Online Documents Modal
  const handleOpenDocsModal = (book) => {
    setSelectedBookForDocs(book);
    loadBookDocs(book.id);
  };

  const loadBookDocs = async (bookId) => {
    setLoadingDocs(true);
    try {
      const res = await api.get(`/previews/book/${bookId}`);
      setBookDocsList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleUploadModalDoc = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedBookForDocs) return;
    setUploadingModalDoc(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const uploadRes = await api.post('/upload', {
          fileName: file.name,
          fileData: reader.result,
          fileType: file.name.endsWith('.epub') ? 'epub' : 'pdf'
        });

        await api.post('/previews', {
          bookId: selectedBookForDocs.id,
          fileUrl: uploadRes.data.fileUrl,
          fileType: file.name.endsWith('.epub') ? 'epub' : 'pdf',
          status: 'active'
        });

        showNotification('✅ Đã đính kèm tài liệu online mới vào sách!');
        loadBookDocs(selectedBookForDocs.id);
        loadAll();
      } catch (err) {
        showNotification(err.response?.data?.error || 'Lỗi khi tải lên tài liệu', true);
      } finally {
        setUploadingModalDoc(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Bạn có chắc muốn xóa tệp tài liệu này?')) return;
    try {
      await api.delete(`/previews/${docId}`);
      showNotification('✅ Đã xóa tài liệu online.');
      loadBookDocs(selectedBookForDocs.id);
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi xóa tài liệu');
    }
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa cuốn sách này? Toàn bộ bản sao và tài liệu liên quan cũng sẽ bị xóa.')) return;
    try {
      await api.delete(`/books/${id}`);
      showNotification('Đã xóa đầu sách.');
      loadAll();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi xóa sách', true);
    }
  };

  // Helper preview for Range mode
  const getPreviewCodes = () => {
    if (copyMode !== 'range' || !batchData.prefix.trim()) return [];
    const count = Math.min(Number(batchData.quantity) || 0, 5);
    const start = Number(batchData.startNumber) || 1;
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push(`${batchData.prefix.trim().toUpperCase()}-${String(start + i).padStart(3, '0')}`);
    }
    return list;
  };

  return (
    <div className="container">
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#0f172a', fontWeight: 800 }}>
            <i className="fa-solid fa-sliders" style={{ color: '#2563eb', marginRight: '10px' }}></i>
            Quản Trị Danh Mục & Kho Sách
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>
            Quản lý sách, đính kèm ảnh bìa, tải lên tệp PDF tài liệu online và kiểm kê kho bản sao
          </p>
        </div>
      </div>

      {message && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px 18px', borderRadius: '8px', marginTop: '16px', fontWeight: '500' }}>
          {message}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px 18px', borderRadius: '8px', marginTop: '16px', fontWeight: '500' }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginTop: '24px' }}>
        {/* Form Thêm Sách */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '16px', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-book-medical"></i> Thêm Đầu Sách Mới
          </h3>
          <form onSubmit={handleCreateBook}>
            <div className="form-group">
              <label className="form-label">Tiêu đề sách *:</label>
              <input type="text" className="form-control" placeholder="Tên sách đầy đủ..." value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Mã ISBN:</label>
                <input type="text" className="form-control" placeholder="VD: 978-604-01-2345-6" value={newBook.isbn} onChange={e => setNewBook({...newBook, isbn: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Thể loại:</label>
                <select className="form-control" value={newBook.categoryId} onChange={e => setNewBook({...newBook, categoryId: e.target.value})}>
                  <option value="">-- Chọn thể loại --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

<div className="form-group">
  <label className="form-label">Tác giả:</label>
  <input
    type="text"
    className="form-control"
    placeholder="Nhập tên tác giả..."
    value={newBook.authorNames}
    onChange={e =>
      setNewBook({ ...newBook, authorNames: e.target.value })
    }
  />
  <small>Nhập nhiều tác giả bằng dấu phẩy (,).</small>
</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Nhà xuất bản:</label>
                <input type="text" className="form-control" placeholder="NXB Giáo Dục..." value={newBook.publisher} onChange={e => setNewBook({...newBook, publisher: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Năm xuất bản:</label>
                <input type="number" className="form-control" value={newBook.publicationYear} onChange={e => setNewBook({...newBook, publicationYear: e.target.value})} />
              </div>
            </div>

            {/* Ảnh bìa sách (Upload hoặc Link URL) */}
            <div className="form-group" style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-image" style={{ color: '#2563eb' }}></i>
                Ảnh bìa sách (Cover Image):
              </label>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                  <i className="fa-solid fa-upload"></i> {uploadingCover ? 'Đang tải lên...' : 'Chọn tệp từ máy'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleCoverFileChange}
                    disabled={uploadingCover}
                  />
                </label>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>hoặc dán đường dẫn ảnh:</span>
              </div>

              <input
                type="text"
                className="form-control"
                placeholder="https://example.com/cover.jpg hoặc để tự động điền khi tải tệp"
                value={newBook.coverImage}
                onChange={e => setNewBook({...newBook, coverImage: e.target.value})}
              />

              {newBook.coverImage && (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={getFullFileUrl(newBook.coverImage)}
                    alt="Xem trước bìa"
                    style={{ width: '50px', height: '65px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                    <i className="fa-solid fa-circle-check"></i> Đã chọn ảnh bìa
                  </span>
                </div>
              )}
            </div>

            {/* Tài liệu sách online (PDF/EPUB Preview) */}
            <div className="form-group" style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-file-pdf" style={{ color: '#ef4444' }}></i>
                Tài liệu đọc thử / Sách online (PDF / EPUB):
              </label>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                  <i className="fa-solid fa-file-arrow-up"></i> {uploadingDoc ? 'Đang tải lên...' : 'Chọn tệp PDF/EPUB'}
                  <input
                    type="file"
                    accept=".pdf,.epub"
                    style={{ display: 'none' }}
                    onChange={handleDocFileChange}
                    disabled={uploadingDoc}
                  />
                </label>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>hoặc dán link tài liệu:</span>
              </div>

              <input
                type="text"
                className="form-control"
                placeholder="Đường dẫn tệp online (/uploads/... hoặc https://...)"
                value={newBook.previewFileUrl}
                onChange={e => setNewBook({...newBook, previewFileUrl: e.target.value})}
              />

              {newBook.previewFileUrl && (
                <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-circle-check"></i>
                  Đã đính kèm tài liệu: {newBook.previewFileName || newBook.previewFileUrl}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Mô tả tóm tắt:</label>
              <textarea className="form-control" rows="2" placeholder="Tóm tắt nội dung..." value={newBook.description} onChange={e => setNewBook({...newBook, description: e.target.value})}></textarea>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <i className="fa-solid fa-plus"></i> Tạo Đầu Sách Mới
            </button>
          </form>
        </div>

        {/* Form Nhập Hàng Loạt Bản Sao (Bulk Copies) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '16px', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-copy"></i> Nhập Bản Sao Vật Lý (Hỗ trợ nhập nhiều)
            </h3>

            {/* Tabs for Mode */}
            <div className="tabs-container">
              <button 
                type="button" 
                className={`tab-btn ${copyMode === 'range' ? 'active' : ''}`}
                onClick={() => setCopyMode('range')}
              >
                <i className="fa-solid fa-arrow-down-1-9"></i> Tự động theo dải số
              </button>
              <button 
                type="button" 
                className={`tab-btn ${copyMode === 'manual' ? 'active' : ''}`}
                onClick={() => setCopyMode('manual')}
              >
                <i className="fa-solid fa-list-ol"></i> Nhập danh sách mã
              </button>
            </div>

            <form onSubmit={handleBatchAddCopies}>
              <div className="form-group">
                <label className="form-label">Chọn đầu sách *:</label>
                <select 
                  className="form-control" 
                  value={batchData.bookId} 
                  onChange={e => setBatchData({...batchData, bookId: e.target.value})} 
                  required
                >
                  <option value="">-- Chọn đầu sách nhận bản sao --</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>
                      #{b.id} - {b.title} (Hiện có: {b.BookCopies ? b.BookCopies.length : 0} bản)
                    </option>
                  ))}
                </select>
              </div>

              {copyMode === 'range' ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Tiền tố mã (Prefix) *:</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="VD: CNTT, GD, VH" 
                        value={batchData.prefix} 
                        onChange={e => setBatchData({...batchData, prefix: e.target.value.toUpperCase()})} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Số bắt đầu:</label>
                      <input 
                        type="number" 
                        min="1" 
                        className="form-control" 
                        value={batchData.startNumber} 
                        onChange={e => setBatchData({...batchData, startNumber: e.target.value})} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Số lượng bản sao cần tạo *:</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="100" 
                      className="form-control" 
                      value={batchData.quantity} 
                      onChange={e => setBatchData({...batchData, quantity: e.target.value})} 
                      required 
                    />
                  </div>

                  {batchData.prefix && (
                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', border: '1px dashed #cbd5e1', fontSize: '0.85rem' }}>
                      <span style={{ color: '#64748b' }}>Xem trước các mã sẽ tạo: </span>
                      <strong>{getPreviewCodes().join(', ')}</strong>
                      {Number(batchData.quantity) > 5 && <span style={{ color: '#64748b' }}> ... và {Number(batchData.quantity) - 5} mã tiếp theo</span>}
                    </div>
                  )}
                </>
              ) : (
                <div className="form-group">
                  <label className="form-label">Danh sách mã bản sao (phân cách bởi dấu phẩy hoặc xuống dòng):</label>
                  <textarea 
                    className="form-control" 
                    rows="4" 
                    placeholder="VD:&#10;BC-001&#10;BC-002&#10;BC-003" 
                    value={batchData.manualCodes} 
                    onChange={e => setBatchData({...batchData, manualCodes: e.target.value})} 
                    required
                  ></textarea>
                </div>
              )}

              <button type="submit" className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }}>
                <i className="fa-solid fa-layer-group"></i> Nhập {copyMode === 'range' ? `${batchData.quantity || 0} Bản Sao` : 'Danh Sách Bản Sao'}
              </button>
            </form>
          </div>

          {/* Quick Add Category */}
          <div style={{ background: 'white', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h4 style={{ marginBottom: '12px', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-folder-plus"></i> Thêm Thể Loại Mới
            </h4>
            <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Tên thể loại (VD: Kinh tế, Lịch sử...)" 
                value={newCat.name} 
                onChange={e => setNewCat({...newCat, name: e.target.value})} 
                required 
              />
              <button type="submit" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                Thêm
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* DANH SÁCH SÁCH & BẢN SAO & TÀI LIỆU ONLINE */}
      <div className="table-responsive" style={{ marginTop: '36px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-books" style={{ color: '#2563eb' }}></i>
            Danh sách đầu sách, bản sao & tài liệu online ({books.length})
          </h3>
        </div>

        <table>
          <thead>
            <tr>
              <th style={{ width: '50px' }}>Bìa</th>
              <th>Tiêu đề sách</th>
              <th>ISBN</th>
              <th>Thể loại</th>
              <th style={{ textAlign: 'center' }}>Tài liệu online</th>
              <th style={{ textAlign: 'center' }}>Bản sao (Kho)</th>
              <th style={{ textAlign: 'center', width: '260px' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {books.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Chưa có đầu sách nào trong hệ thống. Hãy thêm sách mới ở form phía trên.
                </td>
              </tr>
            ) : (
              books.map(b => {
                const allCopies = b.BookCopies || [];
                const total = allCopies.length;
                const avail = allCopies.filter(c => c.status === 'available').length;
                const borrowed = allCopies.filter(c => c.status === 'borrowed').length;
                const allPreviews = b.BookPreviews || [];

                return (
                  <tr key={b.id}>
                    <td>
                      {b.coverImage ? (
                        <img
                          src={getFullFileUrl(b.coverImage)}
                          alt={b.title}
                          style={{ width: '42px', height: '56px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div style={{ width: '42px', height: '56px', background: '#f1f5f9', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                          <i className="fa-solid fa-book"></i>
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{b.title}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                        NXB: {b.publisher || 'N/A'} | Năm: {b.publicationYear || 'N/A'}
                      </div>
                    </td>
                    <td><span style={{ fontFamily: 'monospace' }}>{b.isbn || '-'}</span></td>
                    <td>
                      <span className="badge" style={{ background: '#ede9fe', color: '#6d28d9' }}>
                        {b.Category?.name || 'Chưa phân loại'}
                      </span>
                    </td>

                    {/* Online Docs Status */}
                    <td style={{ textAlign: 'center' }}>
                      {allPreviews.length > 0 ? (
                        <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                          <i className="fa-solid fa-file-pdf"></i> {allPreviews.length} tệp online
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Chưa có</span>
                      )}
                    </td>
                    
                    {/* Thống kê số lượng bản sao */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <span className="stat-chip stat-chip-total">
                          Tổng: <strong>{total}</strong>
                        </span>
                        <span className="stat-chip stat-chip-avail">
                          Rảnh: <strong>{avail}</strong>
                        </span>
                        {borrowed > 0 && (
                          <span className="stat-chip stat-chip-borrowed">
                            Mượn: <strong>{borrowed}</strong>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Thao tác */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => handleViewCopies(b)}
                          title="Xem chi tiết các bản sao vật lý"
                        >
                          <i className="fa-solid fa-list-check"></i> Bản sao ({total})
                        </button>

                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
                          onClick={() => handleOpenDocsModal(b)}
                          title="Quản lý tài liệu xem trước online (PDF/EPUB)"
                        >
                          <i className="fa-solid fa-file-pdf"></i> Tệp online ({allPreviews.length})
                        </button>

                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => handleDeleteBook(b.id)}
                          title="Xóa đầu sách này"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: XEM CHI TIẾT DANH SÁCH BẢN SAO */}
      {selectedBookForCopies && (
        <div className="modal-backdrop" onClick={() => setSelectedBookForCopies(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <i className="fa-solid fa-boxes-stacked" style={{ color: '#2563eb' }}></i>
                <span>Danh Sách Bản Sao: "{selectedBookForCopies.title}"</span>
              </div>
              <button 
                onClick={() => setSelectedBookForCopies(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body">
              <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Mã ISBN: {selectedBookForCopies.isbn || 'Không có'} | Thể loại: {selectedBookForCopies.Category?.name || 'Chung'}</div>
                  <div style={{ marginTop: '6px', display: 'flex', gap: '10px' }}>
                    <span className="stat-chip stat-chip-total">Tổng số: <strong>{bookCopiesList.length}</strong></span>
                    <span className="stat-chip stat-chip-avail">Có sẵn: <strong>{bookCopiesList.filter(c => c.status === 'available').length}</strong></span>
                    <span className="stat-chip stat-chip-borrowed">Đang mượn: <strong>{bookCopiesList.filter(c => c.status === 'borrowed').length}</strong></span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="number" 
                    min="1" 
                    max="50" 
                    value={quickAddCount} 
                    onChange={e => setQuickAddCount(e.target.value)}
                    style={{ width: '60px', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={handleQuickAddSingle}>
                    <i className="fa-solid fa-plus"></i> Thêm bản sao
                  </button>
                </div>
              </div>

              {loadingCopies ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.8rem' }}></i>
                  <p style={{ marginTop: '10px' }}>Đang tải danh sách bản sao...</p>
                </div>
              ) : bookCopiesList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                  <i className="fa-solid fa-box-open" style={{ fontSize: '2.5rem', color: '#94a3b8' }}></i>
                  <p style={{ marginTop: '10px', color: '#64748b' }}>Sách này hiện chưa có bản sao vật lý nào trong kho.</p>
                </div>
              ) : (
                <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  <table style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}>#</th>
                        <th>Mã kiểm kê (Barcode)</th>
                        <th>Tình trạng</th>
                        <th>Độc giả đang giữ</th>
                        <th style={{ textAlign: 'right', width: '90px' }}>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookCopiesList.map((copy, index) => {
                        const activeBorrow = copy.BorrowRecords && copy.BorrowRecords.length > 0 ? copy.BorrowRecords[0] : null;

                        return (
                          <tr key={copy.id}>
                            <td>{index + 1}</td>
                            <td>
                              <span className="copy-badge-code">
                                <i className="fa-solid fa-barcode" style={{ marginRight: '6px', color: '#64748b' }}></i>
                                {copy.accessionCode}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${copy.status === 'available' ? 'badge-available' : 'badge-borrowed'}`}>
                                {copy.status === 'available' ? 'Có sẵn trên kệ' : 'Đang cho mượn'}
                              </span>
                            </td>
                            <td>
                              {activeBorrow?.user ? (
                                <span style={{ fontSize: '0.88rem', color: '#0f172a' }}>
                                  <i className="fa-solid fa-user" style={{ marginRight: '4px', color: '#64748b' }}></i>
                                  {activeBorrow.user.fullName || activeBorrow.user.username}
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>-</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {copy.status === 'available' ? (
                                <button 
                                  className="btn btn-danger btn-sm" 
                                  onClick={() => handleDeleteCopy(copy.id, copy.accessionCode)}
                                  title="Xóa bản sao này"
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Đang mượn</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedBookForCopies(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: QUẢN LÝ TÀI LIỆU SÁCH ONLINE (PDF/EPUB) */}
      {selectedBookForDocs && (
        <div className="modal-backdrop" onClick={() => setSelectedBookForDocs(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <i className="fa-solid fa-file-pdf" style={{ color: '#ef4444' }}></i>
                <span>Tài Liệu Sách Online: "{selectedBookForDocs.title}"</span>
              </div>
              <button 
                onClick={() => setSelectedBookForDocs(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body">
              {/* Upload thêm tài liệu mới */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', color: '#1e3a8a', marginBottom: '8px' }}>
                  <i className="fa-solid fa-plus-circle"></i> Tải Lên Tệp PDF / EPUB Mới Cho Sách Này
                </h4>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                    <i className="fa-solid fa-upload"></i> {uploadingModalDoc ? 'Đang tải lên...' : 'Chọn tệp PDF/EPUB từ máy'}
                    <input
                      type="file"
                      accept=".pdf,.epub"
                      style={{ display: 'none' }}
                      onChange={handleUploadModalDoc}
                      disabled={uploadingModalDoc}
                    />
                  </label>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Tệp sẽ được lưu và hiển thị cho độc giả đọc thử hoặc tải về.
                  </span>
                </div>
              </div>

              {/* Danh sách các tệp hiện có */}
              {loadingDocs ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem' }}></i>
                  <p style={{ marginTop: '8px' }}>Đang tải danh sách tài liệu...</p>
                </div>
              ) : bookDocsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
                  <i className="fa-solid fa-file-circle-xmark" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '8px' }}></i>
                  <p>Cuốn sách này chưa có tài liệu online nào.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>STT</th>
                      <th>Định dạng</th>
                      <th>Đường dẫn tệp</th>
                      <th>Thời gian tải lên</th>
                      <th style={{ textAlign: 'right', width: '120px' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookDocsList.map((doc, idx) => (
                      <tr key={doc.id}>
                        <td>{idx + 1}</td>
                        <td>
                          <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                            {doc.fileType.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          <a href={getFullFileUrl(doc.fileUrl)} target="_blank" rel="noreferrer" style={{ wordBreak: 'break-all' }}>
                            {doc.fileUrl}
                          </a>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                          {doc.created_at ? new Date(doc.created_at).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteDoc(doc.id)}
                            title="Xóa tài liệu này"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedBookForDocs(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
