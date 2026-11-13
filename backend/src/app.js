const express = require('express');
const cors = require('cors');
const { sequelize } = require('./src/models');
const { verifyToken } = require('./src/middleware/auth');

// Route imports
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const bookRoutes = require('./src/routes/books');
const categoryRoutes = require('./src/routes/categories');
const authorRoutes = require('./src/routes/authors');
const copyRoutes = require('./src/routes/copies');
const borrowRoutes = require('./src/routes/borrow');
const reservationRoutes = require('./src/routes/reservations');
const auditRoutes = require('./src/routes/audit');
const previewRoutes = require('./src/routes/previews');

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
sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
});
