const express = require('express');
const router = express.Router();
const { BookCopy } = require('../models');
const { authorize } = require('../middleware/auth');

// Add a copy – admin or librarian
router.post('/', authorize('admin','librarian'), async (req, res) => {
  const { bookId, accessionCode, status } = req.body;
  try {
    const copy = await BookCopy.create({ bookId, accessionCode, status });
    res.status(201).json(copy);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// List copies – public (or protected if you prefer)
router.get('/', async (req, res) => {
  const copies = await BookCopy.findAll();
  res.json(copies);
});

// Update copy status – admin/librarian
router.put('/:id', authorize('admin','librarian'), async (req, res) => {
  const { status } = req.body;
  const copy = await BookCopy.findByPk(req.params.id);
  if (!copy) return res.status(404).json({ message: 'Copy not found' });
  await copy.update({ status });
  res.json(copy);
});

module.exports = router;
