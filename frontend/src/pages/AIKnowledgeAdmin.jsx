import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api';

const SOURCES = [
  ['book', 'Sách'],
  ['category', 'Thể loại'],
  ['author', 'Tác giả'],
  ['copy', 'Bản sao sách'],
];

const Dot = ({ ok }) => (
  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', marginRight: 6, background: ok ? '#10b981' : '#ef4444' }} />
);

export default function AIKnowledgeAdmin() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sources, setSources] = useState(['book', 'category', 'author', 'copy']);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/rag/status');
      setS(res.data);
      setError('');
    } catch (e) {
      setError(e.response?.data?.error || 'Không lấy được trạng thái');
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, s?.syncing ? 1000 : 4000);
    return () => clearInterval(t);
  }, [load, s?.syncing]);

  const act = async (url, body) => {
    setBusy(true);
    try {
      const res = await api.post(url, body || {});
      setS(res.data);
      setError('');
    } catch (e) {
      setError(e.response?.data?.error || 'Thao tác thất bại');
    } finally {
      setBusy(false);
      load();
    }
  };

  if (!s) return <div className="container"><p>{error || 'Đang tải...'}</p></div>;

  const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;

  return (
    <div className="container" style={{ maxWidth: 800 }}>
      <h2><i className="fa-solid fa-brain"></i> Quản lý tri thức AI (Qdrant)</h2>

      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8, marginBottom: 12 }}>{error}</div>}

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <p><Dot ok={s.qdrantOnline} /> Qdrant: <b>{s.qdrantOnline ? 'online' : 'offline'}</b> &nbsp;|&nbsp; <Dot ok={s.ollamaOnline} /> Ollama: <b>{s.ollamaOnline ? 'online' : 'offline'}</b></p>
        <p>Collection: <code>{s.collection}</code> · Embedding: <code>{s.embedModel}</code> · Chat: <code>{s.chatModel}</code></p>
        <p>Số vector đã lưu: <b>{s.vectorCount}</b></p>
        <p>Lần đồng bộ gần nhất: <b>{s.lastSyncAt ? new Date(s.lastSyncAt).toLocaleString('vi-VN') : 'chưa có'}</b></p>
        <p>Dịch vụ chatbot: <b style={{ color: s.enabled ? '#059669' : '#dc2626' }}>{s.enabled ? 'ĐANG CHẠY' : 'ĐÃ DỪNG'}</b></p>
        {s.lastError && <p style={{ color: '#dc2626' }}>Lỗi/ghi chú: {s.lastError}</p>}

        {s.syncing && (
          <div style={{ margin: '12px 0' }}>
            <div style={{ background: '#e2e8f0', borderRadius: 8, height: 14, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: '#2563eb', transition: 'width .3s' }} />
            </div>
            <small>Đang đồng bộ {s.done}/{s.total} ({pct}%)</small>
          </div>
        )}

        <div style={{ margin: '12px 0 4px' }}>
          <b>Dữ liệu cần đồng bộ:</b>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6 }}>
            {SOURCES.map(([key, label]) => (
              <label key={key} style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={sources.includes(key)}
                  disabled={s.syncing}
                  onChange={() => setSources((p) => (p.includes(key) ? p.filter((x) => x !== key) : [...p, key]))}
                /> {label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <button className="btn btn-primary" disabled={busy || s.syncing || !s.enabled || !sources.length} onClick={() => act('/rag/sync', { sources })}>
            <i className="fa-solid fa-rotate"></i> Đồng bộ ngay
          </button>
          <button className="btn btn-secondary" disabled={busy || !s.syncing} onClick={() => act('/rag/stop')}>
            <i className="fa-solid fa-hand"></i> Dừng đồng bộ
          </button>
          <button
            className="btn btn-secondary"
            style={{ color: s.enabled ? '#ef4444' : '#059669' }}
            disabled={busy}
            onClick={() => act('/rag/enabled', { enabled: !s.enabled })}
          >
            <i className={`fa-solid ${s.enabled ? 'fa-power-off' : 'fa-play'}`}></i> {s.enabled ? 'Dừng dịch vụ' : 'Bật dịch vụ'}
          </button>
        </div>
      </div>
    </div>
  );
}
