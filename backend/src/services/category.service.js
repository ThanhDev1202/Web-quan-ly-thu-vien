const { Category } = require('../models');

/**
 * Create a new category
 */
async function createCategory({ name, description }) {
  if (!name || !name.trim()) {
    const error = new Error('Tên thể loại là bắt buộc.');
    error.statusCode = 400;
    throw error;
  }
  return await Category.create({ name: name.trim(), description });
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
