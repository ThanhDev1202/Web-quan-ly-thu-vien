const express = require('express');
const router = express.Router();
const { Book, Author, Category, BookAuthor, BookCopy } = require('../models');
const { authorize } = require('../middleware/auth');

// Create a book – admin or librarian
router.post('/', authorize('admin','librarian'), async (req, res) => {
  const { title, isbn, publisher, publicationYear, description, coverImage, categoryId, authorIds } = req.body;
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
    if (authorIds && authorIds.length) {
      const authors = await Author.findAll({ where: { id: authorIds } });
      await book.addAuthors(authors);
    }
    res.status(201).json(book);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get all books with copies statistics – public
router.get('/', async (req, res) => {
  try {
    const books = await Book.findAll({
      include: [
        { model: Category, as: 'Category' },
        { model: Author, through: { attributes: [] } },
        { model: BookCopy },
      ],
      order: [['id', 'DESC']]
    });
    res.json(books);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get a single book with copies
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'Category' },
        { model: Author, through: { attributes: [] } },
        { model: BookCopy },
      ],
    });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update book – admin or librarian
router.put('/:id', authorize('admin','librarian'), async (req, res) => {
  const { title, isbn, publisher, publicationYear, description, coverImage, categoryId, authorIds } = req.body;
  const book = await Book.findByPk(req.params.id);
  if (!book) return res.status(404).json({ message: 'Book not found' });
  await book.update({ title, isbn, publisher, publicationYear, description, coverImage, categoryId });
  if (authorIds) {
    const authors = await Author.findAll({ where: { id: authorIds } });
    await book.setAuthors(authors);
  }
  res.json(book);
});

// Delete book – admin only
router.delete('/:id', authorize('admin'), async (req, res) => {
  const deleted = await Book.destroy({ where: { id: req.params.id } });
  if (!deleted) return res.status(404).json({ message: 'Book not found' });
  res.json({ message: 'Book removed' });
});

module.exports = router;
