const express = require('express');
const router = express.Router();
const { Category } = require('../models');
const { verifyToken, authorize } = require('../middleware/auth');

// Create category – admin or librarian
router.post('/', verifyToken, authorize('admin','librarian'), async (req, res) => {
  const { name, description } = req.body;
  try {
    const cat = await Category.create({ name, description });
    res.status(201).json(cat);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get all categories – public
router.get('/', async (req, res) => {
  try {
    const cats = await Category.findAll();
    res.json(cats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
