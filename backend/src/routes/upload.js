const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const uploadService = require('../services/upload.service');

// POST /api/upload – accepts base64 encoded file (image or PDF/EPUB)
router.post('/', verifyToken, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const result = await uploadService.saveUploadedFile(req.body);
    res.json(result);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(err.statusCode || 500).json({ error: 'Lỗi trong quá trình lưu tệp: ' + err.message });
  }
});

module.exports = router;
