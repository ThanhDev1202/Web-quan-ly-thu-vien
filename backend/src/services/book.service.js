
const { Book, Author, Category, BookCopy, BookPreview } = require('../models');
const { findOrCreateAuthors } = require('./author.service');
const { createAuditLog } = require('./audit.service');

/**
 * Helper: Create an error with HTTP status code
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
}, userId) {
  let book;

  try {
    // Validate book title
    if (!title || !title.trim()) {
      throw createError('Tựa sách là bắt buộc.', 400);
    }

    // Create book
    book = await Book.create({
      title: title.trim(),
      isbn,
      publisher,
      publicationYear,
      description,
      coverImage,
      categoryId,
    });

    // Attach authors if provided
    if (authorNames) {
      const authors = await findOrCreateAuthors(
        authorNames,
        userId
      );

      if (authors.length > 0) {
        await book.addAuthors(authors);
      }
    }

    // Attach preview document if provided
    if (previewFileUrl) {
      await BookPreview.create({
        bookId: book.id,
        fileUrl: previewFileUrl,
        fileType: previewFileType ||
          (previewFileUrl.endsWith('.epub') ? 'epub' : 'pdf'),
        status: 'active',
      });
    }

    // Get complete book information
    book = await Book.findByPk(book.id, {
      include: bookIncludes,
    });

  } catch (error) {

    // Operation failed -> Write failure audit
    try {
      await createAuditEntry(
        userId,
        'book_create_failed',
        `Failed to create book "${title}". Reason: ${error.message}`
      );
    } catch (auditError) {
      console.error('Failed to save audit log:', auditError);
    }

    throw error;
  }

  // Operation successful -> Write success audit
  try {
    await createAuditEntry(
      userId,
      'book_create',
      `Successfully created book "${book.title}". Book ID: ${book.id}`
    );
  } catch (auditError) {
    console.error('Failed to save audit log:', auditError);
  }

  return book;
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
    throw createError('Không tìm thấy sách', 404);
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
}, userId) {
  let book;

  try {
    // Find existing book
    book = await Book.findByPk(id);

    if (!book) {
      throw createError('Không tìm thấy sách', 404);
    }

    // Update book information
    await book.update({
      title,
      isbn,
      publisher,
      publicationYear,
      description,
      coverImage: coverImage !== undefined
        ? coverImage
        : book.coverImage,
      categoryId,
    });

    // Update authors if provided
    if (authorNames !== undefined) {
      const authors = await findOrCreateAuthors(
        authorNames,
        userId
      );

      await book.setAuthors(authors);
    }

    // Attach new preview document if provided
    if (previewFileUrl) {
      await BookPreview.create({
        bookId: book.id,
        fileUrl: previewFileUrl,
        fileType: previewFileType ||
          (previewFileUrl.endsWith('.epub') ? 'epub' : 'pdf'),
        status: 'active',
      });
    }

    // Get updated book information
    book = await Book.findByPk(id, {
      include: bookIncludes,
    });

  } catch (error) {

    // Operation failed -> Write failure audit
    try {
      await createAuditEntry(
        userId,
        'book_update_failed',
        `Failed to update book ID ${id}. Reason: ${error.message}`
      );
    } catch (auditError) {
      console.error('Failed to save audit log:', auditError);
    }

    throw error;
  }

  // Operation successful -> Write success audit
  try {
    await createAuditEntry(
      userId,
      'book_update',
      `Successfully updated book "${book.title}". Book ID: ${id}`
    );
  } catch (auditError) {
    console.error('Failed to save audit log:', auditError);
  }

  return book;
}

/**
 * Delete a book
 */
async function deleteBook(id, userId) {
  try {
    const deleted = await Book.destroy({
      where: { id },
    });

    if (!deleted) {
      throw createError('Không tìm thấy sách', 404);
    }

  } catch (error) {

    // Operation failed -> Write failure audit
    try {
      await createAuditEntry(
        userId,
        'book_delete_failed',
        `Failed to delete book ID ${id}. Reason: ${error.message}`
      );
    } catch (auditError) {
      console.error('Failed to save audit log:', auditError);
    }

    throw error;
  }

  // Operation successful -> Write success audit
  try {
    await createAuditEntry(
      userId,
      'book_delete',
      `Successfully deleted book ID ${id}`
    );
  } catch (auditError) {
    console.error('Failed to save audit log:', auditError);
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
