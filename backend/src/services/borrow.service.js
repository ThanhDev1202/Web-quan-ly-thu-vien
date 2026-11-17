const { BorrowRecord, BookCopy, User } = require('../models');

/**
 * Reader requests to borrow a copy
 */
async function requestBorrow({ userId, copyId, dueDate }) {
  const copy = await BookCopy.findByPk(copyId);
  if (!copy) {
    const error = new Error('Copy not found');
    error.statusCode = 404;
    throw error;
  }

  if (copy.status !== 'available') {
    const error = new Error('Copy not available');
    error.statusCode = 400;
    throw error;
  }

  return await BorrowRecord.create({
    userId,
    copyId,
    librarianId: null,
    borrowDate: new Date(),
    dueDate,
    status: 'pending',
  });
}

/**
 * Admin or Librarian approves borrow request
 */
async function approveBorrow(id, librarianId) {
  const record = await BorrowRecord.findByPk(id);
  if (!record) {
    const error = new Error('Record not found');
    error.statusCode = 404;
    throw error;
  }

  if (record.status !== 'pending') {
    const error = new Error('Record not pending');
    error.statusCode = 400;
    throw error;
  }

  await BookCopy.update({ status: 'borrowed' }, { where: { id: record.copyId } });
  await record.update({ status: 'borrowed', librarianId, borrowDate: new Date() });
  return record;
}

/**
 * Get borrow records (readers see own records, librarian/admin see all)
 */
async function getBorrowRecords({ userRole, userId }) {
  const where = userRole === 'reader' ? { userId } : {};

  return await BorrowRecord.findAll({
    where,
    include: [{ model: BookCopy }],
    order: [['id', 'DESC']],
  });
}

/**
 * Return a borrowed copy
 */
async function returnCopy(id) {
  const record = await BorrowRecord.findByPk(id);
  if (!record) {
    const error = new Error('Record not found');
    error.statusCode = 404;
    throw error;
  }

  if (record.status !== 'borrowed') {
    const error = new Error('Not borrowed');
    error.statusCode = 400;
    throw error;
  }

  await BookCopy.update({ status: 'available' }, { where: { id: record.copyId } });
  await record.update({ status: 'returned', returnDate: new Date() });
  return record;
}

module.exports = {
  requestBorrow,
  approveBorrow,
  getBorrowRecords,
  returnCopy,
};
