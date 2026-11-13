const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BookPreview = sequelize.define('BookPreview', {
  bookId: { type: DataTypes.BIGINT, references: { model: 'books', key: 'id' } },
  fileUrl: { type: DataTypes.STRING(255), allowNull: false },
  fileType: { type: DataTypes.ENUM('pdf','epub'), allowNull: false },
  status: { type: DataTypes.ENUM('active','inactive'), defaultValue: 'active' },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  tableName: 'book_previews',
});

module.exports = BookPreview;
