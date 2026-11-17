const authService = require('./auth.service');
const userService = require('./user.service');
const bookService = require('./book.service');
const categoryService = require('./category.service');
const authorService = require('./author.service');
const copyService = require('./copy.service');
const borrowService = require('./borrow.service');
const reservationService = require('./reservation.service');
const auditService = require('./audit.service');
const previewService = require('./preview.service');
const uploadService = require('./upload.service');

module.exports = {
  authService,
  userService,
  bookService,
  categoryService,
  authorService,
  copyService,
  borrowService,
  reservationService,
  auditService,
  previewService,
  uploadService,
};
