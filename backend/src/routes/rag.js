const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const rag = require('../services/rag.service');
const auditService = require('../services/audit.service');

const wrap = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

const log = (req, action, description) =>
  auditService.createAuditLog({ userId: req.user.id, action, description }).catch(() => {});

// Public: chatbot
router.post('/chat', wrap(async (req) => {
  const question = String(req.body?.prompt || '').trim().slice(0, 500);
  if (!question) {
    const e = new Error('Thiếu nội dung câu hỏi');
    e.statusCode = 400;
    throw e;
  }
  return rag.chat(question);
}));

// Admin only
const admin = [verifyToken, authorize('admin')];
router.get('/status', ...admin, wrap(() => rag.getStatus()));
router.post('/sync', ...admin, wrap(async (req) => {
  const s = rag.startSync(req.body?.sources);
  log(req, 'RAG_SYNC_START', `Bắt đầu đồng bộ lên Qdrant: ${(req.body?.sources || ['all']).join(', ')}`);
  return s;
}));
router.post('/stop', ...admin, wrap(async (req) => {
  log(req, 'RAG_SYNC_STOP', 'Dừng đồng bộ Qdrant');
  return rag.stopSync();
}));
router.post('/enabled', ...admin, wrap(async (req) => {
  const on = !!req.body?.enabled;
  log(req, on ? 'RAG_ENABLE' : 'RAG_DISABLE', on ? 'Bật dịch vụ trợ lý AI' : 'Dừng dịch vụ trợ lý AI');
  return rag.setEnabled(on);
}));

module.exports = router;
