const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const previewService = require('../services/preview.service');

// GET /api/previews/book/:bookId – get active previews for a book (Public / Reader)
router.get('/book/:bookId', async (req, res) => {
  try {
    const previews = await previewService.getPreviewsByBookId(req.params.bookId);
    res.json(previews);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// POST /api/previews – add book preview (admin or librarian)
router.post('/', verifyToken, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const preview = await previewService.createPreview(req.body);
    res.status(201).json(preview);
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

// DELETE /api/previews/:id – delete book preview (admin or librarian)
router.delete('/:id', verifyToken, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const result = await previewService.deletePreview(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message, error: err.message });
  }
});

module.exports = router;
