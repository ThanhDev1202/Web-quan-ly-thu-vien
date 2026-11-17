const express = require('express');
const router = express.Router();
const { Book, Author, Category, BookAuthor, BookCopy, BookPreview } = require('../models');
const { verifyToken, authorize } = require('../middleware/auth');

// Tìm tác giả đã tồn tại hoặc tạo mới
const findOrCreateAuthors = async (authorNames) => {
  if (!authorNames || !authorNames.trim()) return [];

  const names = [...new Set(
    authorNames
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0)
  )];

  const authors = [];

  for (const name of names) {
    const [author] = await Author.findOrCreate({
      where: { name },
      defaults: { name }
    });

    authors.push(author);
  }

  return authors;
};
// Create a book – admin or librarian
router.post('/', verifyToken, authorize('admin', 'librarian'), async (req, res) => {
  const { title, isbn, publisher, publicationYear, description, coverImage, categoryId, authorNames, previewFileUrl, previewFileType } = req.body;
  try {
    const book = await Book.create({
      title,
      isbn,
      publisher,
      publicationYear,
      description,
      coverImage,
      categoryId,
    });

const authors = await findOrCreateAuthors(authorNames);

if (authors.length) {
  await book.addAuthors(authors);
}

    // Attach preview document if provided
    if (previewFileUrl) {
      await BookPreview.create({
        bookId: book.id,
        fileUrl: previewFileUrl,
        fileType: previewFileType || (previewFileUrl.endsWith('.epub') ? 'epub' : 'pdf'),
        status: 'active'
      });
    }

    const fullBook = await Book.findByPk(book.id, {
      include: [
        { model: Category, as: 'Category' },
        { model: Author, through: { attributes: [] } },
        { model: BookCopy },
        { model: BookPreview },
      ]
    });

    res.status(201).json(fullBook);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get all books with copies & previews – public
router.get('/', async (req, res) => {
  try {
    const books = await Book.findAll({
      include: [
        { model: Category, as: 'Category' },
        { model: Author, through: { attributes: [] } },
        { model: BookCopy },
        { model: BookPreview },
      ],
      order: [['id', 'DESC']]
    });
    res.json(books);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get a single book with copies & previews – public
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'Category' },
        { model: Author, through: { attributes: [] } },
        { model: BookCopy },
        { model: BookPreview },
      ],
    });
    if (!book) return res.status(404).json({ message: 'Không tìm thấy sách' });
    res.json(book);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update book – admin or librarian
router.put('/:id', verifyToken, authorize('admin', 'librarian'), async (req, res) => {
  const { title, isbn, publisher, publicationYear, description, coverImage, categoryId, authorNames, previewFileUrl, previewFileType } = req.body;
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) return res.status(404).json({ message: 'Không tìm thấy sách' });

    await book.update({
      title,
      isbn,
      publisher,
      publicationYear,
      description,
      coverImage: coverImage !== undefined ? coverImage : book.coverImage,
      categoryId
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
        status: 'active'
      });
    }

    const updated = await Book.findByPk(book.id, {
      include: [
        { model: Category, as: 'Category' },
        { model: Author, through: { attributes: [] } },
        { model: BookCopy },
        { model: BookPreview },
      ]
    });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Delete book – admin only
router.delete('/:id', verifyToken, authorize('admin'), async (req, res) => {
  try {
    const deleted = await Book.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy sách' });
    res.json({ message: 'Đã xóa sách thành công' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
