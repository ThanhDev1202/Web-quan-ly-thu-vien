const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BorrowRecord = sequelize.define('BorrowRecord', {
  userId: { type: DataTypes.BIGINT, references: { model: 'users', key: 'id' } },
  copyId: { type: DataTypes.BIGINT, references: { model: 'book_copies', key: 'id' } },
  librarianId: { type: DataTypes.BIGINT, references: { model: 'users', key: 'id' } },
  borrowDate: { type: DataTypes.DATE },
  dueDate: { type: DataTypes.DATE },
  returnDate: { type: DataTypes.DATE },
  status: { type: DataTypes.ENUM('pending','approved','borrowed','returned','rejected','cancelled'), defaultValue: 'pending' },
}, {
  timestamps: false,
  tableName: 'borrow_records',
});

module.exports = BorrowRecord;
