
const { BookPreview } = require('../models');
const { createAuditLog } = require('./audit.service');

/**
 * Helper: Create error with HTTP status code
 */
function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/**
 * Helper: Create audit entry
 */
function createAuditEntry(userId, action, description) {
  return createAuditLog({
    userId,
    action,
    description,
  });
}

/**
 * Get active previews for a book
 */
async function getPreviewsByBookId(bookId) {
  return await BookPreview.findAll({
    where: {
      bookId,
      status: 'active',
    },
    order: [['created_at', 'DESC']],
  });
}

/**
 * Add book preview document
 */
async function createPreview({ bookId, fileUrl, fileType, status }, userId) {
  let preview;

  try {
    if (!bookId || !fileUrl) {
      throw createError(
        'bookId và fileUrl là bắt buộc',
        400
      );
    }

    // Create preview document
    preview = await BookPreview.create({
      bookId,
      fileUrl,
      fileType: fileType ||
        (fileUrl.endsWith('.epub') ? 'epub' : 'pdf'),
      status: status || 'active',
    });

  } catch (error) {

    // Create failed -> Write failure audit
    try {
      await createAuditEntry(
        userId,
        'preview_create_failed',
        `Failed to create preview for book ID ${bookId}. File: ${fileUrl || 'unknown'}. Reason: ${error.message}`
      );
    } catch (auditError) {
      console.error('Failed to save audit log:', auditError);
    }

    throw error;
  }

  // Create successful -> Write success audit
  try {
    await createAuditEntry(
      userId,
      'preview_create',
      `Successfully created preview ID ${preview.id} for book ID ${bookId}. File type: ${preview.fileType}`
    );
  } catch (auditError) {
    console.error('Failed to save audit log:', auditError);
  }

  return preview;
}

/**
 * Delete book preview
 */
async function deletePreview(id, userId) {
  let preview;

  try {
    // Find preview
    preview = await BookPreview.findByPk(id);

    if (!preview) {
      throw createError(
        'Không tìm thấy tài liệu xem trước',
        404
      );
    }

    // Delete preview
    await preview.destroy();

  } catch (error) {

    // Delete failed -> Write failure audit
    try {
      await createAuditEntry(
        userId,
        'preview_delete_failed',
        `Failed to delete preview ID ${id}. Reason: ${error.message}`
      );
    } catch (auditError) {
      console.error('Failed to save audit log:', auditError);
    }

    throw error;
  }

  // Delete successful -> Write success audit
  try {
    await createAuditEntry(
      userId,
      'preview_delete',
      `Successfully deleted preview ID ${id} for book ID ${preview.bookId}. File type: ${preview.fileType}`
    );
  } catch (auditError) {
    console.error('Failed to save audit log:', auditError);
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
