const express = require('express');
const router = express.Router();
const { AuditLog, User } = require('../models');
const { authorize } = require('../middleware/auth');

// Get audit logs - Admin only
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      include: [{ model: User, attributes: ['id', 'username', 'fullName', 'role'] }],
      order: [['created_at', 'DESC']],
      limit: 100,
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create manual audit log entry
router.post('/', async (req, res) => {
  try {
    const { action, description } = req.body;
    const log = await AuditLog.create({
      userId: req.user ? req.user.id : null,
      action,
      description,
    });
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
