import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getFullFileUrl } from '../api/api';

export default function BookDetail() {
  const { id } = useParams();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // PDF Preview Reader Modal
  const [activePreviewDoc, setActivePreviewDoc] = useState(null);

  useEffect(() => {
    fetchBookDetail();
  }, [id]);

  const fetchBookDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/books/${id}`);
      setBook(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tìm thấy thông tin cuốn sách này.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: '#2563eb' }}></i>
        <p style={{ marginTop: '16px', fontSize: '1.1rem' }}>Đang tải thông tin chi tiết sách...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '3rem', color: '#ef4444' }}></i>
        <h2 style={{ marginTop: '16px', color: '#0f172a' }}>{error || 'Sách không tồn tại'}</h2>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '20px' }}>
          <i className="fa-solid fa-arrow-left"></i> Quay lại kho sách
        </Link>
      </div>
    );
  }

  const copies = book.BookCopies || [];
  const availableCopies = copies.filter(c => c.status === 'available');
  const previews = book.BookPreviews || [];

  return (
    <div className="container">
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>
          <i className="fa-solid fa-arrow-left"></i> Quay lại kho sách
        </Link>
      </div>

      {/* Main Detail Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Left Column: Cover & Information Box */}
        <div>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{
              width: '100%', height: '420px', borderRadius: '12px', overflow: 'hidden',
              background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {book.coverImage ? (
                <img
                  src={getFullFileUrl(book.coverImage)}
                  alt={book.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/340x420?text=No+Cover+Image';
                  }}
                />
              ) : (
                <div style={{ color: '#94a3b8' }}>
                  <i className="fa-solid fa-book" style={{ fontSize: '5rem', marginBottom: '12px' }}></i>
                  <p style={{ fontSize: '0.9rem' }}>Chưa có ảnh bìa</p>
                </div>
              )}
            </div>

            {/* Inventory Status Pill */}
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
              <span className={`badge ${availableCopies.length > 0 ? 'badge-available' : 'badge-borrowed'}`} style={{ fontSize: '0.88rem', padding: '6px 16px' }}>
                <i className={`fa-solid ${availableCopies.length > 0 ? 'fa-circle-check' : 'fa-circle-xmark'}`} style={{ marginRight: '6px' }}></i>
                {availableCopies.length > 0 ? `Còn ${availableCopies.length} cuốn tại quầy` : 'Tạm thời hết sách'}
              </span>
            </div>

            {/* Read-only notification box */}
            <div style={{
              marginTop: '16px', padding: '12px 14px', background: '#f8fafc',
              borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem',
              color: '#475569', lineHeight: 1.5, textAlign: 'left'
            }}>
              <i className="fa-solid fa-circle-info" style={{ marginRight: '6px', color: '#2563eb' }}></i>
              Hiện tại thư viện chỉ mở chế độ <strong>tra cứu thông tin, đọc thử online & tải tài liệu</strong>.
              Nếu bạn muốn mượn sách giấy, vui lòng liên hệ trực tiếp tại quầy thủ thư.
            </div>
          </div>

          {/* ONLINE DOCUMENTS & PREVIEW SECTION */}
          <div style={{
            marginTop: '24px', background: 'white', borderRadius: '16px', padding: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ fontSize: '1.1rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <i className="fa-solid fa-file-pdf" style={{ color: '#ef4444' }}></i>
              Tài Liệu Sách Online
            </h3>

            {previews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '10px', color: '#64748b', fontSize: '0.88rem' }}>
                <i className="fa-solid fa-file-lines" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '8px' }}></i>
                <p>Chưa có bản đọc thử điện tử (PDF/EPUB) cho đầu sách này.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {previews.map((doc, idx) => {
                  const fileUrl = getFullFileUrl(doc.fileUrl);
                  const isPdf = doc.fileType === 'pdf' || doc.fileUrl.endsWith('.pdf');

                  return (
                    <div key={doc.id || idx} style={{
                      padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0',
                      background: '#f8fafc'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className={`fa-solid ${isPdf ? 'fa-file-pdf' : 'fa-book-open'}`} style={{ color: isPdf ? '#ef4444' : '#2563eb' }}></i>
                          Bản đọc online #{idx + 1} ({doc.fileType.toUpperCase()})
                        </span>
                        <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.72rem' }}>
                          Miễn phí
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {/* Đọc trước sách trực tuyến */}
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => setActivePreviewDoc({ ...doc, fullUrl: fileUrl })}
                        >
                          <i className="fa-solid fa-eye"></i> Đọc trước
                        </button>

                        {/* Tải tài liệu về máy */}
                        <a
                          href={fileUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}
                        >
                          <i className="fa-solid fa-download"></i> Tải về máy
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Full Book Metadata & Physical Inventory */}
        <div>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0'
          }}>
            {/* Category Pill */}
            <span className="badge" style={{ background: '#ede9fe', color: '#6d28d9', fontSize: '0.85rem', marginBottom: '12px', display: 'inline-block' }}>
              <i className="fa-solid fa-tag" style={{ marginRight: '6px' }}></i>
              {book.Category?.name || 'Chung / Chưa phân loại'}
            </span>

            {/* Book Title */}
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3, marginBottom: '16px' }}>
              {book.title}
            </h1>

            {/* Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'block' }}>Mã ISBN:</span>
                <strong style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: '#1e293b' }}>{book.isbn || 'Chưa cập nhật'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'block' }}>Nhà xuất bản:</span>
                <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{book.publisher || 'Chưa cập nhật'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'block' }}>Năm xuất bản:</span>
                <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{book.publicationYear || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'block' }}>Tác giả:</span>
                <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>
                  {book.Authors && book.Authors.length > 0 ? book.Authors.map(a => a.name).join(', ') : 'Đang cập nhật'}
                </strong>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#1e3a8a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-align-left"></i> Giới Thiệu Nội Dung
              </h3>
              <p style={{ color: '#475569', fontSize: '1rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {book.description || 'Chưa có thông tin mô tả chi tiết cho cuốn sách này.'}
              </p>
            </div>

            {/* Physical Inventory Copies Table (Read-Only) */}
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#1e3a8a', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-boxes-stacked"></i> Danh Sách Bản Sao Vật Lý Trong Kho ({copies.length})
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                  Có sẵn trên kệ: <strong>{availableCopies.length}</strong> / {copies.length} cuốn
                </span>
              </h3>

              <div className="table-responsive" style={{ marginTop: '0', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>STT</th>
                      <th>Mã vạch / Kiểm kê</th>
                      <th>Tình trạng bản sao</th>
                      <th>Vị trí phục vụ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {copies.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                          Hiện tại chưa có bản sao vật lý nào của đầu sách này trong kho.
                        </td>
                      </tr>
                    ) : (
                      copies.map((copy, index) => (
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
                          <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                            {copy.status === 'available' ? 'Kệ sách thư viện' : 'Độc giả mượn tại quầy'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN / INTERACTIVE PDF PREVIEW MODAL */}
      {activePreviewDoc && (
        <div className="modal-backdrop" onClick={() => setActivePreviewDoc(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '960px', height: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">
                <i className="fa-solid fa-book-open-reader" style={{ color: '#2563eb' }}></i>
                <span>Đọc Thử Trực Tuyến: "{book.title}"</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <a
                  href={activePreviewDoc.fullUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  title="Tải tệp này về máy"
                >
                  <i className="fa-solid fa-download"></i> Tải về
                </a>
                <button
                  onClick={() => setActivePreviewDoc(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#64748b', cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            <div className="modal-body" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
              <iframe
                src={activePreviewDoc.fullUrl}
                title="Trình đọc sách trực tuyến"
                style={{ width: '100%', height: '100%', border: 'none', flex: 1 }}
              />
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                <i className="fa-solid fa-circle-info" style={{ marginRight: '6px' }}></i>
                Bạn đang đọc bản xem trước kỹ thuật số được lưu trữ trong hệ thống thư viện.
              </span>
              <button className="btn btn-secondary" onClick={() => setActivePreviewDoc(null)}>
                Đóng trình đọc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
