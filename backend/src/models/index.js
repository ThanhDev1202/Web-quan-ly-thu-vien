const sequelize = require('../config/db');
const User = require('./user');
const Category = require('./category');
const Author = require('./author');
const Book = require('./book');
const BookAuthor = require('./bookAuthor');
const BookCopy = require('./bookCopy');
const BorrowRecord = require('./borrowRecord');
const Reservation = require('./reservation');
const AuditLog = require('./auditLog');
const BookPreview = require('./bookPreview');

// Associations
User.hasMany(BorrowRecord, { foreignKey: 'user_id' });
BorrowRecord.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

User.hasMany(Reservation, { foreignKey: 'user_id' });
Reservation.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(AuditLog, { foreignKey: 'user_id' });
AuditLog.belongsTo(User, { foreignKey: 'user_id' });

Category.hasMany(Book, { foreignKey: 'category_id' });
Book.belongsTo(Category, { foreignKey: 'category_id' });

Book.belongsToMany(Author, { through: BookAuthor, foreignKey: 'book_id', otherKey: 'author_id' });
Author.belongsToMany(Book, { through: BookAuthor, foreignKey: 'author_id', otherKey: 'book_id' });

Book.hasMany(BookCopy, { foreignKey: 'book_id' });
BookCopy.belongsTo(Book, { foreignKey: 'book_id' });

BookCopy.hasMany(BorrowRecord, { foreignKey: 'copy_id' });
BorrowRecord.belongsTo(BookCopy, { foreignKey: 'copy_id' });
BorrowRecord.belongsTo(User, { as: 'librarian', foreignKey: 'librarian_id' });

Book.hasMany(Reservation, { foreignKey: 'book_id' });
Reservation.belongsTo(Book, { foreignKey: 'book_id' });
Reservation.belongsTo(User, { foreignKey: 'user_id' });

Book.hasMany(BookPreview, { foreignKey: 'book_id' });
BookPreview.belongsTo(Book, { foreignKey: 'book_id' });

module.exports = {
  sequelize,
  User,
  Category,
  Author,
  Book,
  BookAuthor,
  BookCopy,
  BorrowRecord,
  Reservation,
  AuditLog,
  BookPreview,
};
