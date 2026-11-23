
const { Category } = require('../models');
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
 * Create a new category
 */
async function createCategory({ name, description }, userId) {
  let category;

  try {
    if (!name || !name.trim()) {
      throw createError('Tên thể loại là bắt buộc.', 400);
    }

    // Create category
    category = await Category.create({
      name: name.trim(),
      description,
    });

  } catch (error) {

    // Create failed -> Write failure audit
    try {
      await createAuditEntry(
        userId,
        'category_create_failed',
        `Failed to create category "${name || 'unknown'}". Reason: ${error.message}`
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
      'category_create',
      `Successfully created category "${category.name}". Category ID: ${category.id}`
    );
  } catch (auditError) {
    console.error('Failed to save audit log:', auditError);
  }

  return category;
}

/**
 * Get all categories
 */
async function getAllCategories() {
  return await Category.findAll({
    order: [['name', 'ASC']],
  });
}

module.exports = {
  createCategory,
  getAllCategories,
};
