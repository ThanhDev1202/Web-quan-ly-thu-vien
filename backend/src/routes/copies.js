const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const copyService = require('../services/copy.service');

// POST /api/copies – add a single copy (admin or librarian)
router.post('/', verifyToken, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const copy = await copyService.createCopy(req.body);
    res.status(201).json(copy);
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

// POST /api/copies/batch – batch add copies (admin or librarian)
router.post('/batch', verifyToken, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const result = await copyService.createBatchCopies(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

// GET /api/copies – list all copies (public)
router.get('/', async (req, res) => {
  try {
    const copies = await copyService.getAllCopies();
    res.json(copies);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// GET /api/copies/book/:bookId – list copies of a book (public)
router.get('/book/:bookId', async (req, res) => {
  try {
    const copies = await copyService.getCopiesByBookId(req.params.bookId);
    res.json(copies);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// GET /api/copies/book/:bookId/borrowable – copies a reader can request now (public)
router.get('/book/:bookId/borrowable', async (req, res) => {
  try {
    const copies = await copyService.getBorrowableCopiesByBookId(req.params.bookId);
    res.json(copies);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// PUT /api/copies/:id – update copy status (admin or librarian)
router.put('/:id', verifyToken, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const copy = await copyService.updateCopyStatus(req.params.id, req.body.status);
    res.json(copy);
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message, error: err.message });
  }
});

// DELETE /api/copies/:id – delete a copy (admin or librarian)
router.delete('/:id', verifyToken, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const result = await copyService.deleteCopy(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message, error: err.message });
  }
});

module.exports = router;
