
const { BorrowRecord, BookCopy, Book, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const { createAuditLog } = require('./audit.service');

/**
 * Helper: Create an error with HTTP status code
 */
function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/**
 * Helper: Create audit entry
 */
function createAuditEntry(userId, action, description) {
  return createAuditLog({
    userId,
    action,
    description,
  });
}

/**
 * Common includes
 *
 * user: Reader who borrows the book
 * librarian: Staff who processes the borrow request
 */
const borrowIncludes = [
  {
    model: BookCopy,
    include: [
      {
        model: Book,
        attributes: ['id', 'title', 'isbn', 'coverImage'],
      },
    ],
  },
  {
    model: User,
    as: 'user',
    attributes: ['id', 'username', 'fullName', 'email', 'phone'],
  },
  {
    model: User,
    as: 'librarian',
    attributes: ['id', 'username', 'fullName'],
  },
];

/**
 * Reader requests to borrow a copy
 *
 * - Lock the book copy to prevent concurrent requests.
 * - Prevent multiple active requests for the same copy.
 * - Create a pending borrow record.
 */
async function requestBorrow({ userId, copyId, dueDate }) {
  let borrowRecord;

  try {
    // Validate due date
    const date = new Date(dueDate);

    if (
      !dueDate ||
      Number.isNaN(date.getTime()) ||
      date <= new Date()
    ) {
      throw createError('Invalid due date', 400);
    }

    // Start transaction
    borrowRecord = await sequelize.transaction(async (transaction) => {

      const copy = await BookCopy.findByPk(copyId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!copy) {
        throw createError('Copy not found', 404);
      }

      if (copy.status !== 'available') {
        throw createError('Copy not available', 400);
      }

      // Check whether this copy already has an active borrow request
      const existingRequest = await BorrowRecord.findOne({
        where: {
          copyId,
          status: {
            [Op.in]: ['pending', 'approved', 'borrowed'],
          },
        },
        transaction,
      });

      if (existingRequest) {
        throw createError(
          'This copy already has an active borrow request',
          409
        );
      }

      // Create borrow request
      return await BorrowRecord.create({
        userId,
        copyId,
        librarianId: null,
        borrowDate: null,
        dueDate: date,
        status: 'pending',
      }, { transaction });

    });

  } catch (error) {

    // Transaction failed -> ROLLBACK
    try {
      await createAuditEntry(
        userId,
        'borrow_request_failed',
        `Failed to request borrow for copy ID ${copyId}. Reason: ${error.message}`
      );
    } catch (auditError) {
      console.error('Failed to save audit log:', auditError);
    }

    throw error;
  }

  // Transaction successful -> COMMIT
  try {
    await createAuditEntry(
      userId,
      'borrow_request',
      `Successfully requested to borrow copy ID ${copyId}. Borrow record ID: ${borrowRecord.id}`
    );
  } catch (auditError) {
    console.error('Failed to save audit log:', auditError);
  }

  return borrowRecord;
}

/**
 * Admin or Librarian approves borrow request
 *
 * BookCopy: available -> borrowed (held for this reader)
 * BorrowRecord: pending -> approved
 */
async function approveBorrow(id, librarianId) {
  let record;

  try {
    record = await sequelize.transaction(async (transaction) => {

      const record = await BorrowRecord.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!record) {
        throw createError('Record not found', 404);
      }

      if (record.status !== 'pending') {
        throw createError('Record not pending', 400);
      }

      const copy = await BookCopy.findByPk(record.copyId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!copy || copy.status !== 'available') {
        throw createError('Book copy is not available', 409);
      }

      // Update book copy status
      await copy.update({
        status: 'borrowed',
      }, { transaction });

      // Update borrow record
      await record.update({
        status: 'approved',
        librarianId,
      }, { transaction });

      return record;
    });

  } catch (error) {

    // Transaction failed -> ROLLBACK
    try {
      await createAuditEntry(
        librarianId,
        'borrow_approve_failed',
        `Failed to approve borrow record ID ${id}. Reason: ${error.message}`
      );
    } catch (auditError) {
      console.error('Failed to save audit log:', auditError);
    }

    throw error;
  }

  // Transaction successful -> COMMIT
  try {
    await createAuditEntry(
      librarianId,
      'borrow_approve',
      `Successfully approved borrow record ID ${id}`
    );
  } catch (auditError) {
    console.error('Failed to save audit log:', auditError);
  }

  return record;
}

/**
 * Reject borrow request
 *
 * Can reject pending or approved requests.
 * If already approved, release the held copy.
 */
async function rejectBorrow(id, librarianId) {
  let record;

  try {
    record = await sequelize.transaction(async (transaction) => {

      const record = await BorrowRecord.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!record) {
        throw createError('Record not found', 404);
      }

      if (!['pending', 'approved'].includes(record.status)) {
        throw createError('Cannot reject this request', 400);
      }

      // Release held copy if request was already approved
      if (record.status === 'approved') {
        const copy = await BookCopy.findByPk(record.copyId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!copy) {
          throw createError('Book copy not found', 404);
        }

        if (copy.status !== 'borrowed') {
          throw createError(
            'Book copy is not held for this request',
            409
          );
        }

        await copy.update({
          status: 'available',
        }, { transaction });
      }

      await record.update({
        status: 'rejected',
        librarianId,
      }, { transaction });

      return record;
    });

  } catch (error) {

    // Transaction failed -> ROLLBACK
    try {
      await createAuditEntry(
        librarianId,
        'borrow_reject_failed',
        `Failed to reject borrow record ID ${id}. Reason: ${error.message}`
      );
    } catch (auditError) {
      console.error('Failed to save audit log:', auditError);
    }

    throw error;
  }

  // Transaction successful -> COMMIT
  try {
    await createAuditEntry(
      librarianId,
      'borrow_reject',
      `Successfully rejected borrow record ID ${id}`
    );
  } catch (auditError) {
    console.error('Failed to save audit log:', auditError);
  }

  return record;
}

/**
 * Reader cancels their own pending borrow request
 */
async function cancelBorrow(id, userId) {
  let record;

  try {
    record = await sequelize.transaction(async (transaction) => {

      const record = await BorrowRecord.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!record) {
        throw createError('Record not found', 404);
      }

      if (String(record.userId) !== String(userId)) {
        throw createError('You cannot cancel this request', 403);
      }

      if (record.status !== 'pending') {
        throw createError('Cannot cancel this request', 400);
      }

      await record.update({
        status: 'cancelled',
      }, { transaction });

      return record;
    });

  } catch (error) {

    // Transaction failed -> ROLLBACK
    try {
      await createAuditEntry(
        userId,
        'borrow_cancel_failed',
        `Failed to cancel borrow record ID ${id}. Reason: ${error.message}`
      );
    } catch (auditError) {
      console.error('Failed to save audit log:', auditError);
    }

    throw error;
  }

  // Transaction successful -> COMMIT
  try {
    await createAuditEntry(
      userId,
      'borrow_cancel',
      `Successfully cancelled borrow record ID ${id}`
    );
  } catch (auditError) {
    console.error('Failed to save audit log:', auditError);
  }

  return record;
}

/**
 * Confirm handing the book to reader
 *
 * BookCopy: stays borrowed (already held since approval)
 * BorrowRecord: approved -> borrowed
 */
async function confirmHandover(id, librarianId) {
  let record;

  try {
    record = await sequelize.transaction(async (transaction) => {

      const record = await BorrowRecord.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!record) {
        throw createError('Record not found', 404);
      }

      if (record.status !== 'approved') {
        throw createError('Record is not approved', 400);
      }

      const copy = await BookCopy.findByPk(record.copyId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!copy || copy.status !== 'borrowed') {
        throw createError(
          'Book copy is not held for this request',
          409
        );
      }

      await record.update({
        status: 'borrowed',
        borrowDate: new Date(),
        librarianId,
      }, { transaction });

      return record;
    });

  } catch (error) {

    // Transaction failed -> ROLLBACK
    try {
      await createAuditEntry(
        librarianId,
        'borrow_handover_failed',
        `Failed to confirm handover for borrow record ID ${id}. Reason: ${error.message}`
      );
    } catch (auditError) {
      console.error('Failed to save audit log:', auditError);
    }

    throw error;
  }

  // Transaction successful -> COMMIT
  try {
    await createAuditEntry(
      librarianId,
      'borrow_handover',
      `Successfully confirmed handover for borrow record ID ${id}`
    );
  } catch (auditError) {
    console.error('Failed to save audit log:', auditError);
  }

  return record;
}

/**
 * Get all borrow records
 *
 * Reader: only their own records.
 * Admin/Librarian: all records.
 */
async function getBorrowRecords({ userRole, userId }) {
  const where = userRole === 'reader' ? { userId } : {};

  return await BorrowRecord.findAll({
    where,
    include: borrowIncludes,
    order: [['id', 'DESC']],
  });
}

/**
 * Confirm book return
 *
 * Only Admin/Librarian can confirm book return.
 */
async function returnCopy(id, { userId, userRole }) {
  let record;

  try {
    record = await sequelize.transaction(async (transaction) => {

      const record = await BorrowRecord.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!record) {
        throw createError('Record not found', 404);
      }

      if (!['admin', 'librarian'].includes(userRole)) {
        throw createError(
          'Only admin or librarian can confirm return',
          403
        );
      }

      if (record.status !== 'borrowed') {
        throw createError(
          'Book is not currently borrowed',
          400
        );
      }

      const copy = await BookCopy.findByPk(record.copyId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!copy) {
        throw createError('Book copy not found', 404);
      }

      if (copy.status !== 'borrowed') {
        throw createError(
          'Book copy is not in borrowed status',
          409
        );
      }

      await copy.update({
        status: 'available',
      }, { transaction });

      await record.update({
        status: 'returned',
        returnDate: new Date(),
      }, { transaction });

      return record;
    });

  } catch (error) {

    // Transaction failed -> ROLLBACK
    try {
      await createAuditEntry(
        userId,
        'borrow_return_failed',
        `Failed to return borrow record ID ${id}. Reason: ${error.message}`
      );
    } catch (auditError) {
      console.error('Failed to save audit log:', auditError);
    }

    throw error;
  }

  // Transaction successful -> COMMIT
  try {
    await createAuditEntry(
      userId,
      'borrow_return',
      `Successfully returned borrow record ID ${id}`
    );
  } catch (auditError) {
    console.error('Failed to save audit log:', auditError);
  }

  return record;
}

/**
 * Get books that are currently borrowed
 *
 * Sorted by due date so staff can monitor upcoming deadlines.
 */
async function getBorrowingRecords({ userRole, userId }) {
  const where = {
    status: 'borrowed',
    ...(userRole === 'reader' ? { userId } : {}),
  };

  return await BorrowRecord.findAll({
    where,
    include: borrowIncludes,
    order: [['dueDate', 'ASC']],
  });
}

/**
 * Get overdue borrow records
 */
async function getOverdueBorrows() {
  return await BorrowRecord.findAll({
    where: {
      status: 'borrowed',
      dueDate: {
        [Op.lt]: new Date(),
      },
    },
    include: borrowIncludes,
    order: [['dueDate', 'ASC']],
  });
}

/**
 * Get overdue records with overdue days
 */
async function getOverdueDetails() {
  const records = await getOverdueBorrows();

  return records.map((record) => {
    const data = record.toJSON();

    const overdueDays = Math.floor(
      (Date.now() - new Date(record.dueDate).getTime()) /
      (1000 * 60 * 60 * 24)
    );

    return {
      ...data,
      overdueDays,
    };
  });
}

/**
 * Get borrow history
 *
 * Reader: own history.
 * Admin/Librarian: all history.
 */
async function getBorrowHistory({ userRole, userId }) {
  // History = completed transactions only (distinct from "all")
  const where = {
    status: {
      [Op.in]: ['returned', 'rejected', 'cancelled'],
    },
    ...(userRole === 'reader' ? { userId } : {}),
  };

  return await BorrowRecord.findAll({
    where,
    include: borrowIncludes,
    order: [['id', 'DESC']],
  });
}

/**
 * Extend borrowing period
 *
 * Only borrowed records can be extended.
 * New due date must be later than the current due date.
 */
async function extendBorrow(id, newDueDate, userId) {
  let record;

  try {
    record = await sequelize.transaction(async (transaction) => {

      const record = await BorrowRecord.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!record) {
        throw createError('Record not found', 404);
      }

      if (record.status !== 'borrowed') {
        throw createError('Cannot extend this borrow', 400);
      }

      const date = new Date(newDueDate);

      if (
        !newDueDate ||
        Number.isNaN(date.getTime()) ||
        date <= new Date(record.dueDate)
      ) {
        throw createError('Invalid extension date', 400);
      }

      await record.update({
        dueDate: date,
      }, { transaction });

      return record;
    });

  } catch (error) {

    // Transaction failed -> ROLLBACK
    try {
      await createAuditEntry(
        userId,
        'borrow_extend_failed',
        `Failed to extend borrow record ID ${id}. Reason: ${error.message}`
      );
    } catch (auditError) {
      console.error('Failed to save audit log:', auditError);
    }

    throw error;
  }

  // Transaction successful -> COMMIT
  try {
    await createAuditEntry(
      userId,
      'borrow_extend',
      `Successfully extended due date for borrow record ID ${id}`
    );
  } catch (auditError) {
    console.error('Failed to save audit log:', auditError);
  }

  return record;
}

/**
 * Get borrow statistics
 *
 * Count borrow records by status and total overdue records.
 */
async function getBorrowStatistics() {
  const rows = await BorrowRecord.findAll({
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    group: ['status'],
    raw: true,
  });

  const statistics = {
    total: 0,
    pending: 0,
    approved: 0,
    borrowed: 0,
    returned: 0,
    rejected: 0,
    cancelled: 0,
    overdue: 0,
  };

  for (const row of rows) {
    const count = Number(row.count);

    if (Object.prototype.hasOwnProperty.call(statistics, row.status)) {
      statistics[row.status] = count;
    }

    statistics.total += count;
  }

  statistics.overdue = await BorrowRecord.count({
    where: {
      status: 'borrowed',
      dueDate: {
        [Op.lt]: new Date(),
      },
    },
  });

  return statistics;
}

module.exports = {
  requestBorrow,
  approveBorrow,
  rejectBorrow,
  cancelBorrow,
  confirmHandover,
  getBorrowRecords,
  returnCopy,
  getBorrowingRecords,
  getOverdueBorrows,
  getOverdueDetails,
  getBorrowHistory,
  extendBorrow,
  getBorrowStatistics,
};
