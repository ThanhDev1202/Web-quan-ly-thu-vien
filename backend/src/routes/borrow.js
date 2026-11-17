const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const borrowService = require('../services/borrow.service');

// POST /api/borrow/request – reader requests borrow
router.post('/request', authorize('reader', 'librarian', 'admin'), async (req, res) => {
  const { copyId, dueDate } = req.body;
  try {
    const record = await borrowService.requestBorrow({
      userId: req.user.id,
      copyId,
      dueDate,
    });
    res.status(201).json(record);
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message, message: err.message });
  }
});

// POST /api/borrow/approve/:id – approve borrow (admin or librarian)
router.post('/approve/:id', authorize('admin', 'librarian'), async (req, res) => {
  try {
    const record = await borrowService.approveBorrow(req.params.id, req.user.id);
    res.json(record);
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message, message: err.message });
  }
});

// GET /api/borrow/all – get borrow records (reader: own, admin/librarian: all)
router.get('/all', authorize('reader', 'librarian', 'admin'), async (req, res) => {
  try {
    const records = await borrowService.getBorrowRecords({
      userRole: req.user.role,
      userId: req.user.id,
    });
    res.json(records);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// POST /api/borrow/return/:id – return a copy
router.post('/return/:id', authorize('reader', 'admin', 'librarian'), async (req, res) => {
  try {
    const record = await borrowService.returnCopy(req.params.id);
    res.json(record);
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message, message: err.message });
  }
});

module.exports = router;
