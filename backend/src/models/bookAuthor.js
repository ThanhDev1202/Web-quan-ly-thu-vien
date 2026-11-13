const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BookAuthor = sequelize.define('BookAuthor', {
  bookId: { type: DataTypes.BIGINT, references: { model: 'books', key: 'id' } },
  authorId: { type: DataTypes.BIGINT, references: { model: 'authors', key: 'id' } },
}, {
  timestamps: false,
  tableName: 'book_authors',
});

module.exports = BookAuthor;
