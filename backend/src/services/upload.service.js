
const fs = require('fs');
const path = require('path');
const { createAuditLog } = require('./audit.service');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

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
 * Save base64-encoded file (image, PDF, EPUB, etc.)
 */
async function saveUploadedFile({ fileName, fileData, fileType }, userId) {
  let uploadResult;

  try {
    // Check file data
    if (!fileData) {
      throw createError(
        'Không tìm thấy dữ liệu tệp tải lên',
        400
      );
    }

    let base64Content = fileData;
    let extension = '';

    // Detect file extension from MIME type
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

    // Determine file extension
    if (!extension && fileName) {
      extension = path.extname(fileName) || '.bin';
    }

    if (!extension) {
      extension = fileType === 'pdf' ? '.pdf' : '.jpg';
    }

    // Generate unique file name
    const safeBaseName = fileName
      ? path.parse(fileName).name.replace(/[^a-zA-Z0-9_-]/g, '_')
      : 'file';

    const uniqueName = `${safeBaseName}-${Date.now()}-${Math.round(Math.random() * 1e4)}${extension}`;

    const filePath = path.join(UPLOADS_DIR, uniqueName);

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Content, 'base64');

    // Save file to uploads directory
    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/${uniqueName}`;

    uploadResult = {
      message: 'Tải lên tệp thành công!',
      fileUrl: relativeUrl,
      fileName: uniqueName,
      fileSize: buffer.length,
    };

  } catch (error) {

    // Upload failed -> Write failure audit
    try {
      await createAuditEntry(
        userId,
        'file_upload_failed',
        `Failed to upload file "${fileName || 'unknown'}". File type: ${fileType || 'unknown'}. Reason: ${error.message}`
      );
    } catch (auditError) {
      console.error('Failed to save audit log:', auditError);
    }

    throw error;
  }

  // Upload successful -> Write success audit
  try {
    await createAuditEntry(
      userId,
      'file_upload',
      `Successfully uploaded file "${uploadResult.fileName}". File type: ${fileType || 'unknown'}. File size: ${uploadResult.fileSize} bytes`
    );
  } catch (auditError) {
    console.error('Failed to save audit log:', auditError);
  }

  return uploadResult;
}

module.exports = {
  saveUploadedFile,
  UPLOADS_DIR,
};
