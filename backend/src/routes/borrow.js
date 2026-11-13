const express = require('express');
const router = express.Router();
const { BorrowRecord, BookCopy } = require('../models');
const { authorize } = require('../middleware/auth');

// Request a borrow (reader)
router.post('/request', authorize('reader','librarian','admin'), async (req, res) => {
  const { copyId, dueDate } = req.body;
  try {
    const copy = await BookCopy.findByPk(copyId);
    if (!copy) return res.status(404).json({ message: 'Copy not found' });
    if (copy.status !== 'available') return res.status(400).json({ message: 'Copy not available' });

    const record = await BorrowRecord.create({
      userId: req.user.id,
      copyId,
      librarianId: null,
      borrowDate: new Date(),
      dueDate,
      status: 'pending',
    });
    res.status(201).json(record);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Approve borrow – admin/librarian
router.post('/approve/:id', authorize('admin','librarian'), async (req, res) => {
  const { id } = req.params;
  const record = await BorrowRecord.findByPk(id);
  if (!record) return res.status(404).json({ message: 'Record not found' });
  if (record.status !== 'pending') return res.status(400).json({ message: 'Record not pending' });

  await BookCopy.update({ status: 'borrowed' }, { where: { id: record.copyId } });
  await record.update({ status: 'borrowed', librarianId: req.user.id, borrowDate: new Date() });
  res.json(record);
});

// Get borrow records - readers see their own, librarian/admin see all
router.get('/all', authorize('reader', 'librarian', 'admin'), async (req, res) => {
  try {
    const where = req.user.role === 'reader' ? { userId: req.user.id } : {};
    const records = await BorrowRecord.findAll({
      where,
      include: [{ model: BookCopy }],
      order: [['id', 'DESC']]
    });
    res.json(records);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Return a copy
router.post('/return/:id', authorize('reader','admin','librarian'), async (req, res) => {
  const { id } = req.params;
  const record = await BorrowRecord.findByPk(id);
  if (!record) return res.status(404).json({ message: 'Record not found' });
  if (record.status !== 'borrowed') return res.status(400).json({ message: 'Not borrowed' });

  await BookCopy.update({ status: 'available' }, { where: { id: record.copyId } });
  await record.update({ status: 'returned', returnDate: new Date() });
  res.json(record);
});

module.exports = router;
