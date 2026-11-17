const { BookPreview } = require('../models');

/**
 * Get active previews for a book
 */
async function getPreviewsByBookId(bookId) {
  return await BookPreview.findAll({
    where: { bookId, status: 'active' },
    order: [['created_at', 'DESC']],
  });
}

/**
 * Add book preview document
 */
async function createPreview({ bookId, fileUrl, fileType, status }) {
  if (!bookId || !fileUrl) {
    const error = new Error('bookId và fileUrl là bắt buộc');
    error.statusCode = 400;
    throw error;
  }

  return await BookPreview.create({
    bookId,
    fileUrl,
    fileType: fileType || (fileUrl.endsWith('.epub') ? 'epub' : 'pdf'),
    status: status || 'active',
  });
}

/**
 * Delete book preview
 */
async function deletePreview(id) {
  const deleted = await BookPreview.destroy({ where: { id } });
  if (!deleted) {
    const error = new Error('Không tìm thấy tài liệu xem trước');
    error.statusCode = 404;
    throw error;
  }

  return {
    message: 'Đã xóa tài liệu xem trước thành công',
  };
}

module.exports = {
  getPreviewsByBookId,
  createPreview,
  deletePreview,
};
