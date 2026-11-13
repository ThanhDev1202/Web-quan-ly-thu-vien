const sequelize = require('./config/db');
const User = require('./models/user');
const Category = require('./models/category');
const Author = require('./models/author');
const Book = require('./models/book');
const BookAuthor = require('./models/bookAuthor');
const BookCopy = require('./models/bookCopy');
const BorrowRecord = require('./models/borrowRecord');
const Reservation = require('./models/reservation');
const AuditLog = require('./models/auditLog');
const BookPreview = require('./models/bookPreview');

// Associations
User.hasMany(BorrowRecord, { foreignKey: 'user_id' });
User.hasMany(Reservation, { foreignKey: 'user_id' });
User.hasMany(AuditLog, { foreignKey: 'user_id' });
User.hasMany(BookCopy, { foreignKey: 'librarian_id' }); // optional

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
