const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const auditService = require('../services/audit.service');

// GET /api/audit/actions – lấy danh sách loại hành động (Admin only)
router.get('/actions', authorize('admin'), async (req, res) => {
  try {
    const actions = await auditService.getDistinctActions();
    res.json(actions);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// GET /api/audit – get audit logs with pagination & filters (Admin only)
// Query params: page, limit, action, dateFrom, dateTo
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, action, dateFrom, dateTo } = req.query;
    const result = await auditService.getAuditLogs({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      action: action || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// GET /api/audit/user/:userId – get audit logs for a specific user (Admin only)
router.get('/:userId', authorize('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const logs = await auditService.getauditLogsByUserId(userId);
    res.json(logs);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// POST /api/audit – create audit log entry
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { action, description } = req.body;
    const log = await auditService.createAuditLog({
      userId: req.user ? req.user.id : null,
      action,
      description,
    });
    res.status(201).json(log);
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

module.exports = router;
