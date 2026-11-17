const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const auditService = require('../services/audit.service');

// GET /api/audit – get audit logs (Admin only)
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const logs = await auditService.getAuditLogs();
    res.json(logs);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// POST /api/audit – create audit log entry
router.post('/', async (req, res) => {
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
