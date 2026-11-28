// RAG service: Ollama (bge-m3 embedding + gemma3 chat) + Qdrant vector DB (REST, no extra deps)
const fs = require('fs');
const path = require('path');
const { Book, Author, Category, BookCopy } = require('../models');

const QDRANT_URL = (process.env.QDRANT_URL || 'http://localhost:6333').replace(/\/$/, '');
const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
const EMBED_MODEL = process.env.EMBED_MODEL || 'bge-m3';
const CHAT_MODEL = process.env.CHAT_MODEL || 'gemma3:1b';
const COLLECTION = process.env.QDRANT_COLLECTION || 'library_books';
const BATCH = 16;
const TOP_K = parseInt(process.env.RAG_TOP_K || '4', 10);
const MIN_SCORE = parseFloat(process.env.RAG_MIN_SCORE || '0.3');

const STATE_FILE = path.join(__dirname, '../../rag-state.json');

const state = {
  enabled: true,        // dịch vụ RAG bật/tắt (admin điều khiển)
  syncing: false,
  stopRequested: false,
  total: 0,
  done: 0,
  lastSyncAt: null,
  lastError: null,
};

try {
  const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  if (typeof saved.enabled === 'boolean') state.enabled = saved.enabled;
  state.lastSyncAt = saved.lastSyncAt || null;
} catch { /* first run */ }

function persist() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ enabled: state.enabled, lastSyncAt: state.lastSyncAt }));
  } catch { /* ignore */ }
}

async function http(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    const err = new Error(`${url} -> ${res.status}: ${text.slice(0, 300)}`);
    err.statusCode = 502;
    throw err;
  }
  return data;
}

async function embed(inputs) {
  const data = await http(`${OLLAMA_URL}/api/embed`, {
    method: 'POST',
    body: JSON.stringify({ model: EMBED_MODEL, input: inputs }),
  });
  return data.embeddings;
}

async function collectionInfo() {
  try {
    const d = await http(`${QDRANT_URL}/collections/${COLLECTION}`);
    return d.result;
  } catch { return null; }
}

async function ensureCollection(dim) {
  const info = await collectionInfo();
  const curDim = info?.config?.params?.vectors?.size;
  if (info && curDim === dim) return;
  if (info) await http(`${QDRANT_URL}/collections/${COLLECTION}`, { method: 'DELETE' });
  await http(`${QDRANT_URL}/collections/${COLLECTION}`, {
    method: 'PUT',
    body: JSON.stringify({ vectors: { size: dim, distance: 'Cosine' } }),
  });
}

// ID offset mỗi loại để point id không trùng nhau trong cùng collection
const OFFSET = { book: 0, category: 1e9, author: 2e9, copy: 3e9 };
const ALL_SOURCES = Object.keys(OFFSET);

function makeDoc(type, id, title, lines, extra = {}) {
  const text = lines.filter(Boolean).join('\n');
  return {
    id: OFFSET[type] + id,
    text,
    payload: { type, refId: id, bookId: extra.bookId ?? (type === 'book' ? id : null), title, text, ...extra },
  };
}

function buildBookDoc(book) {
  const authors = (book.Authors || []).map((a) => a.name).join(', ');
  const copies = book.BookCopies || [];
  const available = copies.filter((c) => c.status === 'available').length;
  return makeDoc('book', book.id, book.title, [
    `Tên sách: ${book.title}`,
    authors && `Tác giả: ${authors}`,
    book.Category && `Thể loại: ${book.Category.name}`,
    book.publisher && `Nhà xuất bản: ${book.publisher}`,
    book.publicationYear && `Năm xuất bản: ${book.publicationYear}`,
    book.isbn && `ISBN: ${book.isbn}`,
    book.description && `Mô tả: ${book.description}`,
    `Tình trạng: còn ${available}/${copies.length} bản có thể mượn`,
  ], { authors, category: book.Category ? book.Category.name : null, available, totalCopies: copies.length });
}

function titleList(books) {
  const t = (books || []).map((b) => b.title);
  return t.slice(0, 30).join('; ') + (t.length > 30 ? `; ... (tổng ${t.length} sách)` : '');
}

async function loadDocs(sources) {
  const docs = [];
  if (sources.includes('book')) {
    const books = await Book.findAll({ include: [{ model: Author }, { model: Category }, { model: BookCopy }] });
    books.forEach((b) => docs.push(buildBookDoc(b)));
  }
  if (sources.includes('category')) {
    const rows = await Category.findAll({ include: [{ model: Book, attributes: ['id', 'title'] }] });
    rows.forEach((c) => docs.push(makeDoc('category', c.id, `Thể loại ${c.name}`, [
      `Thể loại: ${c.name}`,
      c.description && `Mô tả thể loại: ${c.description}`,
      c.Books && c.Books.length && `Các sách thuộc thể loại này: ${titleList(c.Books)}`,
    ])));
  }
  if (sources.includes('author')) {
    const rows = await Author.findAll({ include: [{ model: Book, attributes: ['id', 'title'] }] });
    rows.forEach((a) => docs.push(makeDoc('author', a.id, `Tác giả ${a.name}`, [
      `Tác giả: ${a.name}`,
      a.biography && `Tiểu sử: ${a.biography}`,
      a.Books && a.Books.length && `Các sách của tác giả: ${titleList(a.Books)}`,
    ])));
  }
  if (sources.includes('copy')) {
    const rows = await BookCopy.findAll({ include: [{ model: Book, attributes: ['id', 'title'] }] });
    rows.forEach((c) => docs.push(makeDoc('copy', c.id, `Bản sao ${c.accessionCode}`, [
      `Bản sao sách: mã ${c.accessionCode}`,
      c.Book && `Thuộc sách: ${c.Book.title}`,
      `Trạng thái: ${c.status === 'available' ? 'sẵn sàng cho mượn' : 'đang được mượn'}`,
    ], { bookId: c.bookId, status: c.status })));
  }
  return docs;
}

async function runSync(sources) {
  try {
    const docs = await loadDocs(sources);
    state.total = docs.length;
    state.done = 0;

    if (docs.length) {
      const first = await embed([docs[0].text]);
      await ensureCollection(first[0].length);
    }

    for (let i = 0; i < docs.length; i += BATCH) {
      if (state.stopRequested) throw Object.assign(new Error('Đã dừng bởi admin'), { stopped: true });
      const chunk = docs.slice(i, i + BATCH);
      const vectors = await embed(chunk.map((c) => c.text));
      await http(`${QDRANT_URL}/collections/${COLLECTION}/points?wait=true`, {
        method: 'PUT',
        body: JSON.stringify({
          points: chunk.map((c, k) => ({ id: c.id, vector: vectors[k], payload: c.payload })),
        }),
      });
      state.done += chunk.length;
    }

    // Xoá vector đã lỗi thời (bản ghi đã bị xoá khỏi DB), theo từng loại đã chọn
    for (const type of sources) {
      const ids = docs.filter((d) => d.payload.type === type).map((d) => d.id);
      await http(`${QDRANT_URL}/collections/${COLLECTION}/points/delete?wait=true`, {
        method: 'POST',
        body: JSON.stringify({
          filter: {
            must: [{ key: 'type', match: { value: type } }],
            ...(ids.length ? { must_not: [{ has_id: ids }] } : {}),
          },
        }),
      });
    }

    state.lastSyncAt = new Date().toISOString();
    state.lastError = null;
    persist();
  } catch (err) {
    state.lastError = err.stopped ? 'Đồng bộ đã bị dừng' : err.message;
  } finally {
    state.syncing = false;
    state.stopRequested = false;
  }
}

function startSync(sources) {
  if (state.syncing) {
    const e = new Error('Đang đồng bộ, vui lòng đợi hoặc dừng trước');
    e.statusCode = 409;
    throw e;
  }
  const chosen = ALL_SOURCES.filter((s) => (Array.isArray(sources) && sources.length ? sources : ALL_SOURCES).includes(s));
  state.syncing = true;
  state.stopRequested = false;
  state.lastError = null;
  state.done = 0;
  runSync(chosen); // chạy nền
  return getStatus();
}

function stopSync() {
  if (state.syncing) state.stopRequested = true;
  return getStatus();
}

function setEnabled(enabled) {
  state.enabled = !!enabled;
  if (!state.enabled && state.syncing) state.stopRequested = true;
  persist();
  return getStatus();
}

async function getStatus() {
  const [info, ollama] = await Promise.all([
    collectionInfo(),
    http(`${OLLAMA_URL}/api/tags`).then(() => true).catch(() => false),
  ]);
  return {
    ...state,
    qdrantOnline: info !== null || (await http(`${QDRANT_URL}/collections`).then(() => true).catch(() => false)),
    ollamaOnline: ollama,
    vectorCount: info?.points_count ?? 0,
    collection: COLLECTION,
    embedModel: EMBED_MODEL,
    chatModel: CHAT_MODEL,
  };
}

async function chat(question) {
  if (!state.enabled) {
    const e = new Error('Dịch vụ trợ lý AI đang tạm dừng bởi quản trị viên');
    e.statusCode = 503;
    throw e;
  }
  const [qv] = await embed([question]);
  const search = await http(`${QDRANT_URL}/collections/${COLLECTION}/points/search`, {
    method: 'POST',
    body: JSON.stringify({ vector: qv, limit: TOP_K, with_payload: true, score_threshold: MIN_SCORE }),
  });
  const hits = search.result || [];
  const context = hits.length
    ? hits.map((h, i) => `[${i + 1}] ${h.payload.text}`).join('\n\n')
    : '(Không tìm thấy sách liên quan trong cơ sở dữ liệu)';

  const data = await http(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    body: JSON.stringify({
      model: CHAT_MODEL,
      stream: false,
      options: { temperature: 0.2 },
      messages: [
        {
          role: 'system',
          content:
            'Bạn là trợ lý thư viện. Chỉ trả lời bằng tiếng Việt, ngắn gọn, dựa HOÀN TOÀN vào phần "Thông tin thư viện" được cung cấp. ' +
            'Nếu thông tin không đủ, hãy nói bạn không tìm thấy trong thư viện. Không bịa đặt sách hay tác giả.',
        },
        { role: 'user', content: `Thông tin thư viện:\n${context}\n\nCâu hỏi: ${question}` },
      ],
    }),
  });

  return {
    reply: data.message?.content || '',
    sources: hits.map((h) => ({ bookId: h.payload.bookId, title: h.payload.title, score: h.score })),
  };
}

module.exports = { startSync, stopSync, setEnabled, getStatus, chat };
