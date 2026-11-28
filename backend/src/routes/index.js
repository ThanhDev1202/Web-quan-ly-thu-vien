const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const bookRoutes = require('./books');
const categoryRoutes = require('./categories');
const authorRoutes = require('./authors');
const copyRoutes = require('./copies');
const borrowRoutes = require('./borrow');
const auditRoutes = require('./audit');
const previewRoutes = require('./previews');
const uploadRoutes = require('./upload');

// Public & hybrid routes (controllers/services manage permissions internally)
router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/categories', categoryRoutes);
router.use('/authors', authorRoutes);
router.use('/copies', copyRoutes);
router.use('/previews', previewRoutes);
router.use('/upload', uploadRoutes);
router.use('/rag', require('./rag')); // chat public; status/sync/stop admin-only

// Protected routes (require valid JWT)
router.use('/users', verifyToken, userRoutes);
router.use('/borrow', verifyToken, borrowRoutes);
router.use('/audit', verifyToken, auditRoutes);

module.exports = router;
