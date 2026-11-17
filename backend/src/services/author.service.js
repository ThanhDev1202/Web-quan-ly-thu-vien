const { Author } = require('../models');

/**
 * Find or create authors from a comma-separated list of author names
 * @param {string} authorNames
 * @returns {Promise<Array>}
 */
async function findOrCreateAuthors(authorNames) {
  if (!authorNames || !authorNames.trim()) return [];

  const names = [
    ...new Set(
      authorNames
        .split(',')
        .map((name) => name.trim())
        .filter((name) => name.length > 0)
    ),
  ];

  const authors = [];
  for (const name of names) {
    const [author] = await Author.findOrCreate({
      where: { name },
      defaults: { name },
    });
    authors.push(author);
  }

  return authors;
}

/**
 * Create a new author
 */
async function createAuthor({ name, biography }) {
  if (!name || !name.trim()) {
    const error = new Error('Tên tác giả là bắt buộc.');
    error.statusCode = 400;
    throw error;
  }
  return await Author.create({ name: name.trim(), biography });
}

/**
 * Get all authors
 */
async function getAllAuthors() {
  return await Author.findAll({
    order: [['name', 'ASC']],
  });
}

module.exports = {
  findOrCreateAuthors,
  createAuthor,
  getAllAuthors,
};
