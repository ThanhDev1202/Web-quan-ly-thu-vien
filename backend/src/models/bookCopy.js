const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BookCopy = sequelize.define('BookCopy', {
  bookId: { type: DataTypes.BIGINT, references: { model: 'books', key: 'id' } },
  accessionCode: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  status: { type: DataTypes.ENUM('available','borrowed'), defaultValue: 'available' },
}, {
  timestamps: false,
  tableName: 'book_copies',
});

module.exports = BookCopy;
