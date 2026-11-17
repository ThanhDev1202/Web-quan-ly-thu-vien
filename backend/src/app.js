const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');
const { verifyToken } = require('./middleware/auth');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const bookRoutes = require('./routes/books');
const categoryRoutes = require('./routes/categories');
const authorRoutes = require('./routes/authors');
const copyRoutes = require('./routes/copies');
const borrowRoutes = require('./routes/borrow');
const reservationRoutes = require('./routes/reservations');
const auditRoutes = require('./routes/audit');
const previewRoutes = require('./routes/previews');
const uploadRoutes = require('./routes/upload');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static uploads folder for cover images and preview documents
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Public & hybrid routes (controllers manage token permissions internally)
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/copies', copyRoutes);
app.use('/api/previews', previewRoutes);
app.use('/api/upload', uploadRoutes);

// Protected routes (strictly require valid JWT)
app.use('/api/users', verifyToken, userRoutes);
app.use('/api/borrow', verifyToken, borrowRoutes);
app.use('/api/reservations', verifyToken, reservationRoutes);
app.use('/api/audit', verifyToken, auditRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;

sequelize.sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database synchronization failed:', err);
  });
