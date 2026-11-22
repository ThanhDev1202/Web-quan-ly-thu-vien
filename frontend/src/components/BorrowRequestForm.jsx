import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api, { getFullFileUrl } from '../api/api';

// Format a Date as local YYYY-MM-DD
const toDateInput = (d) =>
    [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
    ].join('-');

const addDays = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
};

/**
 * Reader borrow form:
 *  Step 1 – choose a book
 *  Step 2 – choose one of its currently available copies
 *  Step 3 – choose due date and submit
 */
export default function BorrowRequestForm({ initialBookId, onSubmitted, onMessage }) {
    const [books, setBooks] = useState([]);
    const [loadingBooks, setLoadingBooks] = useState(true);
    const [search, setSearch] = useState('');

    const [selectedBook, setSelectedBook] = useState(null);
    const [copies, setCopies] = useState([]);
    const [loadingCopies, setLoadingCopies] = useState(false);
    const [selectedCopyId, setSelectedCopyId] = useState(null);

    const minDueDate = toDateInput(addDays(1));
    const [dueDate, setDueDate] = useState(toDateInput(addDays(14)));
    const [submitting, setSubmitting] = useState(false);

    // Load books
    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                const res = await api.get('/books');
                if (!ignore) setBooks(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                onMessage?.('Không thể tải danh sách sách', 'error');
            } finally {
                if (!ignore) setLoadingBooks(false);
            }
        })();
        return () => { ignore = true; };
    }, []);

    // Load borrowable copies of the selected book
    const loadCopies = useCallback(async (bookId) => {
        setLoadingCopies(true);
        setSelectedCopyId(null);
        try {
            const res = await api.get(`/copies/book/${bookId}/borrowable`);
            const list = Array.isArray(res.data) ? res.data : [];
            setCopies(list);
            if (list.length === 1) setSelectedCopyId(list[0].id);
        } catch (err) {
            setCopies([]);
            onMessage?.('Không thể tải danh sách bản sao', 'error');
        } finally {
            setLoadingCopies(false);
        }
    }, [onMessage]);

    const selectBook = (book) => {
        setSelectedBook(book);
        loadCopies(book.id);
    };

    // Preselect book from URL (?bookId=)
    useEffect(() => {
        if (!initialBookId || books.length === 0 || selectedBook) return;
        const found = books.find((b) => String(b.id) === String(initialBookId));
        if (found) selectBook(found);
    }, [initialBookId, books]);

    const filteredBooks = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return books;
        return books.filter((b) =>
            b.title?.toLowerCase().includes(q) ||
            b.isbn?.toLowerCase().includes(q) ||
            (b.Authors || []).some((a) => a.name?.toLowerCase().includes(q))
        );
    }, [books, search]);

    const availableCount = (b) =>
        (b.BookCopies || []).filter((c) => c.status === 'available').length;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCopyId) {
            onMessage?.('Vui lòng chọn một bản sao để mượn.', 'error');
            return;
        }
        if (!dueDate) {
            onMessage?.('Vui lòng chọn hạn trả.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/borrow/request', {
                copyId: Number(selectedCopyId),
                dueDate,
            });
            const copy = copies.find((c) => c.id === selectedCopyId);
            onMessage?.(
                `Đã gửi yêu cầu mượn "${selectedBook.title}" (bản sao ${copy?.accessionCode || selectedCopyId}) thành công!`,
                'success'
            );
            await loadCopies(selectedBook.id);
            onSubmitted?.();
        } catch (err) {
            onMessage?.(err.response?.data?.message || 'Không thể gửi yêu cầu mượn', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const boxStyle = {
        marginTop: '24px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        background: '#fff',
    };

    const stepTitle = (n, text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0f172a', margin: '16px 0 10px' }}>
            <span style={{
                width: 24, height: 24, borderRadius: '50%', background: '#2563eb', color: '#fff',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
            }}>{n}</span>
            {text}
        </div>
    );

    return (
        <div style={boxStyle}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>
                <i className="fa-solid fa-book-open"></i>{' '}Mượn sách
            </h3>

            {/* STEP 1: choose book */}
            {stepTitle(1, 'Chọn đầu sách')}

            {selectedBook ? (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '14px', padding: '12px',
                    border: '2px solid #2563eb', borderRadius: '10px', background: '#eff6ff',
                }}>
                    <div style={{ width: 48, height: 64, borderRadius: 6, overflow: 'hidden', background: '#e2e8f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedBook.coverImage
                            ? <img src={getFullFileUrl(selectedBook.coverImage)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <i className="fa-solid fa-book" style={{ color: '#94a3b8' }}></i>}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedBook.title}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            {(selectedBook.Authors || []).map((a) => a.name).join(', ') || 'Chưa rõ tác giả'}
                            {selectedBook.isbn ? ` · ISBN ${selectedBook.isbn}` : ''}
                        </div>
                    </div>
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setSelectedBook(null); setCopies([]); setSelectedCopyId(null); }}
                    >
                        <i className="fa-solid fa-arrow-rotate-left"></i> Đổi sách
                    </button>
                </div>
            ) : (
                <>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Tìm theo tên sách, tác giả hoặc ISBN..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ marginBottom: '12px' }}
                    />
                    {loadingBooks ? (
                        <p style={{ color: '#64748b' }}>Đang tải danh sách sách...</p>
                    ) : filteredBooks.length === 0 ? (
                        <p style={{ color: '#64748b' }}>Không tìm thấy sách phù hợp.</p>
                    ) : (
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                            gap: '10px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px',
                        }}>
                            {filteredBooks.map((b) => {
                                const avail = availableCount(b);
                                return (
                                    <button
                                        key={b.id}
                                        type="button"
                                        onClick={() => selectBook(b)}
                                        disabled={avail === 0}
                                        style={{
                                            textAlign: 'left', padding: '10px 12px', borderRadius: '10px',
                                            border: '1px solid #e2e8f0', background: avail ? '#fff' : '#f8fafc',
                                            cursor: avail ? 'pointer' : 'not-allowed', opacity: avail ? 1 : 0.6,
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{b.title}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 6 }}>
                                            {(b.Authors || []).map((a) => a.name).join(', ') || 'Chưa rõ tác giả'}
                                        </div>
                                        <span className={`badge ${avail ? 'badge-available' : 'badge-borrowed'}`}>
                                            {avail ? `Còn ${avail} bản` : 'Hết sách'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* STEP 2: choose copy */}
            {selectedBook && (
                <form onSubmit={handleSubmit}>
                    {stepTitle(2, 'Chọn bản sao hiện có')}
                    {loadingCopies ? (
                        <p style={{ color: '#64748b' }}>Đang tải bản sao...</p>
                    ) : copies.length === 0 ? (
                        <p style={{ color: '#b91c1c' }}>
                            Hiện không có bản sao nào sẵn sàng cho mượn (tất cả đang được mượn hoặc đang chờ duyệt).
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {copies.map((c) => {
                                const active = selectedCopyId === c.id;
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setSelectedCopyId(c.id)}
                                        style={{
                                            padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                                            fontFamily: 'monospace', fontWeight: 600,
                                            border: active ? '2px solid #2563eb' : '1px solid #cbd5e1',
                                            background: active ? '#dbeafe' : '#fff',
                                            color: active ? '#1d4ed8' : '#334155',
                                        }}
                                    >
                                        <i className={`fa-solid ${active ? 'fa-circle-check' : 'fa-barcode'}`} style={{ marginRight: 6 }}></i>
                                        {c.accessionCode}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* STEP 3: due date + submit */}
                    {copies.length > 0 && (
                        <>
                            {stepTitle(3, 'Chọn hạn trả & gửi yêu cầu')}
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'end' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label>Hạn trả dự kiến</label>
                                    <input
                                        type="date"
                                        min={minDueDate}
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        required
                                        style={{ padding: '9px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting || !selectedCopyId}
                                >
                                    <i className="fa-solid fa-paper-plane"></i>{' '}
                                    {submitting ? 'Đang gửi...' : 'Gửi yêu cầu mượn'}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            )}
        </div>
    );
}
