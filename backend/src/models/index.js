
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

// =====================================
// USER - BORROW RECORD
// =====================================

// User who borrows the book
User.hasMany(BorrowRecord, {
    as: 'borrowRecords',
    foreignKey: 'userId',
});

BorrowRecord.belongsTo(User, {
    as: 'user',
    foreignKey: 'userId',
});

// Librarian who processes the borrow request
User.hasMany(BorrowRecord, {
    as: 'processedBorrowRecords',
    foreignKey: 'librarianId',
});

BorrowRecord.belongsTo(User, {
    as: 'librarian',
    foreignKey: 'librarianId',
});


// =====================================
// USER - RESERVATION
// =====================================

User.hasMany(Reservation, {
    foreignKey: 'userId',
});

Reservation.belongsTo(User, {
    foreignKey: 'userId',
});


// =====================================
// USER - AUDIT LOG
// =====================================

User.hasMany(AuditLog, {
    foreignKey: 'userId',
});

AuditLog.belongsTo(User, {
    foreignKey: 'userId',
});


// =====================================
// CATEGORY - BOOK
// =====================================

Category.hasMany(Book, {
    foreignKey: 'categoryId',
});

Book.belongsTo(Category, {
    foreignKey: 'categoryId',
});


// =====================================
// BOOK - AUTHOR
// =====================================

Book.belongsToMany(Author, {
    through: BookAuthor,
    foreignKey: 'bookId',
    otherKey: 'authorId',
});

Author.belongsToMany(Book, {
    through: BookAuthor,
    foreignKey: 'authorId',
    otherKey: 'bookId',
});


// =====================================
// BOOK - BOOK COPY
// =====================================

Book.hasMany(BookCopy, {
    foreignKey: 'bookId',
});

BookCopy.belongsTo(Book, {
    foreignKey: 'bookId',
});


// =====================================
// BOOK COPY - BORROW RECORD
// =====================================

BookCopy.hasMany(BorrowRecord, {
    foreignKey: 'copyId',
});

BorrowRecord.belongsTo(BookCopy, {
    foreignKey: 'copyId',
});


// =====================================
// BOOK - RESERVATION
// =====================================

Book.hasMany(Reservation, {
    foreignKey: 'bookId',
});

Reservation.belongsTo(Book, {
    foreignKey: 'bookId',
});


// =====================================
// BOOK - BOOK PREVIEW
// =====================================

Book.hasMany(BookPreview, {
    foreignKey: 'bookId',
});

BookPreview.belongsTo(Book, {
    foreignKey: 'bookId',
});


// =====================================
// EXPORT MODELS
// =====================================

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
