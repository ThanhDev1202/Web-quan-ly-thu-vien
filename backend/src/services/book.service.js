const { Book, Author, Category, BookCopy, BookPreview } = require('../models');
const { findOrCreateAuthors } = require('./author.service');

const bookIncludes = [
  { model: Category, as: 'Category' },
  { model: Author, through: { attributes: [] } },
  { model: BookCopy },
  { model: BookPreview },
];

/**
 * Create a new book with optional authors and preview document
 */
async function createBook({
  title,
  isbn,
  publisher,
  publicationYear,
  description,
  coverImage,
  categoryId,
  authorNames,
  previewFileUrl,
  previewFileType,
}) {
  if (!title || !title.trim()) {
    const error = new Error('Tựa sách là bắt buộc.');
    error.statusCode = 400;
    throw error;
  }

  const book = await Book.create({
    title: title.trim(),
    isbn,
    publisher,
    publicationYear,
    description,
    coverImage,
    categoryId,
  });

  if (authorNames) {
    const authors = await findOrCreateAuthors(authorNames);
    if (authors.length > 0) {
      await book.addAuthors(authors);
    }
  }

  // Attach preview document if provided
  if (previewFileUrl) {
    await BookPreview.create({
      bookId: book.id,
      fileUrl: previewFileUrl,
      fileType: previewFileType || (previewFileUrl.endsWith('.epub') ? 'epub' : 'pdf'),
      status: 'active',
    });
  }

  return await Book.findByPk(book.id, {
    include: bookIncludes,
  });
}

/**
 * Get all books with category, authors, copies, and previews
 */
async function getAllBooks() {
  return await Book.findAll({
    include: bookIncludes,
    order: [['id', 'DESC']],
  });
}

/**
 * Get a single book by id
 */
async function getBookById(id) {
  const book = await Book.findByPk(id, {
    include: bookIncludes,
  });

  if (!book) {
    const error = new Error('Không tìm thấy sách');
    error.statusCode = 404;
    throw error;
  }

  return book;
}

/**
 * Update an existing book
 */
async function updateBook(id, {
  title,
  isbn,
  publisher,
  publicationYear,
  description,
  coverImage,
  categoryId,
  authorNames,
  previewFileUrl,
  previewFileType,
}) {
  const book = await Book.findByPk(id);
  if (!book) {
    const error = new Error('Không tìm thấy sách');
    error.statusCode = 404;
    throw error;
  }

  await book.update({
    title,
    isbn,
    publisher,
    publicationYear,
    description,
    coverImage: coverImage !== undefined ? coverImage : book.coverImage,
    categoryId,
  });

  if (authorNames !== undefined) {
    const authors = await findOrCreateAuthors(authorNames);
    await book.setAuthors(authors);
  }

  if (previewFileUrl) {
    await BookPreview.create({
      bookId: book.id,
      fileUrl: previewFileUrl,
      fileType: previewFileType || (previewFileUrl.endsWith('.epub') ? 'epub' : 'pdf'),
      status: 'active',
    });
  }

  return await Book.findByPk(book.id, {
    include: bookIncludes,
  });
}

/**
 * Delete a book
 */
async function deleteBook(id) {
  const deleted = await Book.destroy({ where: { id } });
  if (!deleted) {
    const error = new Error('Không tìm thấy sách');
    error.statusCode = 404;
    throw error;
  }

  return {
    message: 'Đã xóa sách thành công',
  };
}

module.exports = {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
};
