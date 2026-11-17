const express = require('express');
const router = express.Router();
const { BookPreview, Book } = require('../models');
const { verifyToken, authorize } = require('../middleware/auth');

// Get previews for a book (Public / Reader)
router.get('/book/:bookId', async (req, res) => {
  try {
    const previews = await BookPreview.findAll({
      where: { bookId: req.params.bookId, status: 'active' },
      order: [['created_at', 'DESC']],
    });
    res.json(previews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add book preview - admin / librarian
router.post('/', verifyToken, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const { bookId, fileUrl, fileType, status } = req.body;
    if (!bookId || !fileUrl) {
      return res.status(400).json({ error: 'bookId và fileUrl là bắt buộc' });
    }
    const preview = await BookPreview.create({
      bookId,
      fileUrl,
      fileType: fileType || (fileUrl.endsWith('.epub') ? 'epub' : 'pdf'),
      status: status || 'active',
    });
    res.status(201).json(preview);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete book preview - admin / librarian
router.delete('/:id', verifyToken, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const deleted = await BookPreview.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy tài liệu xem trước' });
    res.json({ message: 'Đã xóa tài liệu xem trước thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
