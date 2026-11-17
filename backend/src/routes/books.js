const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const bookService = require('../services/book.service');

// POST /api/books – create book (admin or librarian)
router.post('/', verifyToken, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const fullBook = await bookService.createBook(req.body);
    res.status(201).json(fullBook);
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

// GET /api/books – get all books (public)
router.get('/', async (req, res) => {
  try {
    const books = await bookService.getAllBooks();
    res.json(books);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// GET /api/books/:id – get single book (public)
router.get('/:id', async (req, res) => {
  try {
    const book = await bookService.getBookById(req.params.id);
    res.json(book);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message, error: err.message });
  }
});

// PUT /api/books/:id – update book (admin or librarian)
router.put('/:id', verifyToken, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const updated = await bookService.updateBook(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message, error: err.message });
  }
});

// DELETE /api/books/:id – delete book (admin only)
router.delete('/:id', verifyToken, authorize('admin'), async (req, res) => {
  try {
    const result = await bookService.deleteBook(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message, error: err.message });
  }
});

module.exports = router;
