const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const categoryService = require('../services/category.service');

// POST /api/categories – create category (admin or librarian)
router.post('/', verifyToken, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const cat = await categoryService.createCategory(req.body);
    res.status(201).json(cat);
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

// GET /api/categories – get all categories (public)
router.get('/', async (req, res) => {
  try {
    const cats = await categoryService.getAllCategories();
    res.json(cats);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

module.exports = router;
