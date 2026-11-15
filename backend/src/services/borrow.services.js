
const { BorrowRecord, BookCopy } = require('../models');
const sequelize = require('../config/db');
const { Op } = require('sequelize');

// Request a borrow
async function requestBorrow(body, user) {
    const { copyId, dueDate } = body;

    // Validate copyId
    if (!copyId) {
        return {
            invalid: true,
            message: 'Copy ID is required'
        };
    }

    // Validate dueDate
    if (!dueDate) {
        return {
            invalid: true,
            message: 'Due date is required'
        };
    }

    const parsedDueDate = new Date(dueDate);

    if (
        Number.isNaN(parsedDueDate.getTime()) ||
        parsedDueDate <= new Date()
    ) {
        return {
            invalid: true,
            message: 'Due date must be a valid future date'
        };
    }

    return await sequelize.transaction(async (transaction) => {
        // Lock BookCopy
        const copy = await BookCopy.findByPk(copyId, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!copy) {
            return {
                notFound: true,
                message: 'Copy not found'
            };
        }

        if (copy.status !== 'available') {
            return {
                invalid: true,
                message: 'Copy not available'
            };
        }

        // Check active borrow requests
        const existingRequest = await BorrowRecord.findOne({
            where: {
                copyId,
                status: {
                    [Op.in]: ['pending', 'approved']
                }
            },
            transaction
        });

        if (existingRequest) {
            return {
                invalid: true,
                message: 'This copy already has an active borrow request'
            };
        }

        // Create borrow request
        const record = await BorrowRecord.create({
            userId: user.id,
            copyId,
            librarianId: null,
            borrowDate: null,
            dueDate: parsedDueDate,
            returnDate: null,
            status: 'pending'
        }, { transaction });

        return { data: record };
    });
}

// Approve borrow
async function approveBorrow(id) {
    return await sequelize.transaction(async (transaction) => {
        // Read record to get copyId
        const existingRecord = await BorrowRecord.findByPk(id, {
            transaction
        });

        if (!existingRecord) {
            return {
                notFound: true,
                message: 'Record not found'
            };
        }

        // Lock BookCopy first
        const copy = await BookCopy.findByPk(existingRecord.copyId, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!copy || copy.status !== 'available') {
            return {
                invalid: true,
                message: 'Copy not available'
            };
        }

        // Lock BorrowRecord
        const record = await BorrowRecord.findByPk(id, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!record) {
            return {
                notFound: true,
                message: 'Record not found'
            };
        }

        if (record.status !== 'pending') {
            return {
                invalid: true,
                message: 'Record is not pending'
            };
        }

        // Check other active requests
        const existingRequest = await BorrowRecord.findOne({
            where: {
                copyId: record.copyId,
                id: { [Op.ne]: record.id },
                status: {
                    [Op.in]: ['pending', 'approved']
                }
            },
            transaction
        });

        if (existingRequest) {
            return {
                invalid: true,
                message: 'Another active request already exists for this copy'
            };
        }

        await record.update({
            status: 'approved'
        }, { transaction });

        return { data: record };
    });
}

// Reject borrow
async function rejectBorrow(id) {
    return await sequelize.transaction(async (transaction) => {
        // Read record to get copyId
        const existingRecord = await BorrowRecord.findByPk(id, {
            transaction
        });

        if (!existingRecord) {
            return {
                notFound: true,
                message: 'Record not found'
            };
        }

        // Lock BookCopy first
        const copy = await BookCopy.findByPk(existingRecord.copyId, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!copy) {
            return {
                notFound: true,
                message: 'Copy not found'
            };
        }

        // Lock BorrowRecord
        const record = await BorrowRecord.findByPk(id, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!record) {
            return {
                notFound: true,
                message: 'Record not found'
            };
        }

        if (record.status !== 'pending') {
            return {
                invalid: true,
                message: 'Record is not pending'
            };
        }

        await record.update({
            status: 'rejected'
        }, { transaction });

        return { data: record };
    });
}

// Confirm handover
async function confirmHandover(id, user) {
    return await sequelize.transaction(async (transaction) => {
        // Read record to get copyId
        const existingRecord = await BorrowRecord.findByPk(id, {
            transaction
        });

        if (!existingRecord) {
            return {
                notFound: true,
                message: 'Record not found'
            };
        }

        // Lock BookCopy first
        const copy = await BookCopy.findByPk(existingRecord.copyId, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!copy || copy.status !== 'available') {
            return {
                invalid: true,
                message: 'Copy not available'
            };
        }

        // Lock BorrowRecord
        const record = await BorrowRecord.findByPk(id, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!record) {
            return {
                notFound: true,
                message: 'Record not found'
            };
        }

        if (record.status !== 'approved') {
            return {
                invalid: true,
                message: 'Record is not approved'
            };
        }

        // Update both tables in the same transaction
        await copy.update({
            status: 'borrowed'
        }, { transaction });

        await record.update({
            status: 'borrowed',
            librarianId: user.id,
            borrowDate: new Date()
        }, { transaction });

        return { data: record };
    });
}

// Get all borrow records
async function getAllBorrows(user) {
    const where = user.role === 'reader'
        ? { userId: user.id }
        : {};

    return await BorrowRecord.findAll({
        where,
        include: [{ model: BookCopy }],
        order: [['id', 'DESC']]
    });
}

// Return a copy
async function returnBorrow(id) {
    return await sequelize.transaction(async (transaction) => {
        // Read record to get copyId
        const existingRecord = await BorrowRecord.findByPk(id, {
            transaction
        });

        if (!existingRecord) {
            return {
                notFound: true,
                message: 'Record not found'
            };
        }

        // Lock BookCopy first
        const copy = await BookCopy.findByPk(existingRecord.copyId, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!copy) {
            return {
                notFound: true,
                message: 'Copy not found'
            };
        }

        // Lock BorrowRecord
        const record = await BorrowRecord.findByPk(id, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!record) {
            return {
                notFound: true,
                message: 'Record not found'
            };
        }

        if (record.status !== 'borrowed') {
            return {
                invalid: true,
                message: 'Record is not borrowed'
            };
        }

        await copy.update({
            status: 'available'
        }, { transaction });

        await record.update({
            status: 'returned',
            returnDate: new Date()
        }, { transaction });

        return { data: record };
    });
}

// Get overdue borrow records
async function getOverdueBorrows(user) {
    const where = {
        status: 'borrowed',
        dueDate: {
            [Op.lt]: new Date()
        }
    };

    if (user.role === 'reader') {
        where.userId = user.id;
    }

    return await BorrowRecord.findAll({
        where,
        include: [{ model: BookCopy }],
        order: [['dueDate', 'ASC']]
    });
}

// Get borrow history
async function getBorrowHistory(user) {
    const where = user.role === 'reader'
        ? { userId: user.id }
        : {};

    return await BorrowRecord.findAll({
        where,
        include: [{ model: BookCopy }],
        order: [['id', 'DESC']]
    });
}

module.exports = {
    requestBorrow,
    approveBorrow,
    rejectBorrow,
    confirmHandover,
    getAllBorrows,
    returnBorrow,
    getOverdueBorrows,
    getBorrowHistory
};
