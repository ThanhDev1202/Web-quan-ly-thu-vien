const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const authorService = require('../services/author.service');

// POST /api/authors – create author (admin or librarian)
router.post('/', verifyToken, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const author = await authorService.createAuthor(req.body);
    res.status(201).json(author);
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

// GET /api/authors – get all authors (public)
router.get('/', async (req, res) => {
  try {
    const authors = await authorService.getAllAuthors();
    res.json(authors);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

module.exports = router;
