const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Book = sequelize.define('Book', {
  categoryId: { type: DataTypes.BIGINT, references: { model: 'categories', key: 'id' } },
  title: { type: DataTypes.STRING(255), allowNull: false },
  isbn: { type: DataTypes.STRING(20), unique: true },
  publisher: { type: DataTypes.STRING(150) },
  publicationYear: { type: DataTypes.INTEGER },
  description: { type: DataTypes.TEXT },
  coverImage: { type: DataTypes.STRING(255) },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Book;
