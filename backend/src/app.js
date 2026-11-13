const express = require('express');
const cors = require('cors');
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

const app = express();
app.use(cors());
app.use(express.json());

// Public
app.use('/api/auth', authRoutes);

// Protected – all following routes require JWT
app.use(verifyToken);
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/copies', copyRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/previews', previewRoutes);

// Global error handler (fallback)
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
