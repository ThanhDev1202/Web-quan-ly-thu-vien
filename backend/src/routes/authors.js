const express = require('express');
const router = express.Router();
const { Author } = require('../models');
const { authorize } = require('../middleware/auth');

// Create author – admin or librarian
router.post('/', authorize('admin','librarian'), async (req, res) => {
  const { name, biography } = req.body;
  try {
    const author = await Author.create({ name, biography });
    res.status(201).json(author);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get all authors – public
router.get('/', async (req, res) => {
  const authors = await Author.findAll();
  res.json(authors);
});

module.exports = router;
