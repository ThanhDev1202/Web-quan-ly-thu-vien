const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { verifyToken, authorize } = require('../middleware/auth');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// POST /api/upload - Accepts base64 encoded file (image or PDF/EPUB)
router.post('/', verifyToken, authorize('admin', 'librarian'), (req, res) => {
  try {
    const { fileName, fileData, fileType } = req.body;
    if (!fileData) {
      return res.status(400).json({ error: 'Không tìm thấy dữ liệu tệp tải lên' });
    }

    let base64Content = fileData;
    let extension = '';

    if (fileData.includes(';base64,')) {
      const parts = fileData.split(';base64,');
      const mime = parts[0].split(':')[1];
      base64Content = parts[1];
      if (mime.includes('pdf')) extension = '.pdf';
      else if (mime.includes('epub')) extension = '.epub';
      else if (mime.includes('jpeg') || mime.includes('jpg')) extension = '.jpg';
      else if (mime.includes('png')) extension = '.png';
      else if (mime.includes('webp')) extension = '.webp';
    }

    if (!extension && fileName) {
      extension = path.extname(fileName) || '.bin';
    }
    if (!extension) {
      extension = fileType === 'pdf' ? '.pdf' : '.jpg';
    }

    const safeBaseName = (fileName ? path.parse(fileName).name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'file');
    const uniqueName = `${safeBaseName}-${Date.now()}-${Math.round(Math.random() * 1e4)}${extension}`;
    const filePath = path.join(UPLOADS_DIR, uniqueName);

    const buffer = Buffer.from(base64Content, 'base64');
    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/${uniqueName}`;
    res.json({
      message: 'Tải lên tệp thành công!',
      fileUrl: relativeUrl,
      fileName: uniqueName,
      fileSize: buffer.length
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Lỗi trong quá trình lưu tệp: ' + err.message });
  }
});

module.exports = router;
