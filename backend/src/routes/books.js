const express = require('express');
const router = express.Router();
const { Book, Author, Category, BookAuthor } = require('../models');
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

// Get all books – public
router.get('/', async (req, res) => {
  const books = await Book.findAll({
    include: [
      { model: Category, as: 'Category' },
      { model: Author, through: { attributes: [] } },
    ],
  });
  res.json(books);
});

// Get a single book
router.get('/:id', async (req, res) => {
  const book = await Book.findByPk(req.params.id, {
    include: [
      { model: Category, as: 'Category' },
      { model: Author, through: { attributes: [] } },
    ],
  });
  if (!book) return res.status(404).json({ message: 'Book not found' });
  res.json(book);
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
