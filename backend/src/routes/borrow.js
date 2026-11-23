
const express = require('express');
const router = express.Router();

const { authorize } = require('../middleware/auth');
const borrowService = require('../services/borrow.service');

/**
 * POST /api/borrow/request
 * Reader requests to borrow a book copy
 */
router.post(
  '/request',
  authorize('reader'),
  async (req, res) => {
    try {
      const { copyId, dueDate } = req.body;

      const record = await borrowService.requestBorrow({
        userId: req.user.id,
        copyId,
        dueDate,
      });

      res.status(201).json(record);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message,
      });
    }
  }
);

/**
 * POST /api/borrow/approve/:id
 * Admin or librarian approves a borrow request
 */
router.post(
  '/approve/:id',
  authorize('admin', 'librarian'),
  async (req, res) => {
    try {
      const record = await borrowService.approveBorrow(
        req.params.id,
        req.user.id
      );

      res.status(200).json(record);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message,
      });
    }
  }
);

/**
 * POST /api/borrow/reject/:id
 * Admin or librarian rejects a borrow request
 */
router.post(
  '/reject/:id',
  authorize('admin', 'librarian'),
  async (req, res) => {
    try {
      const record = await borrowService.rejectBorrow(
        req.params.id,
        req.user.id
      );

      res.status(200).json(record);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message,
      });
    }
  }
);

/**
 * POST /api/borrow/cancel/:id
 * Reader cancels their own pending request
 */
router.post(
  '/cancel/:id',
  authorize('reader'),
  async (req, res) => {
    try {
      const record = await borrowService.cancelBorrow(
        req.params.id,
        req.user.id
      );

      res.status(200).json(record);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message,
      });
    }
  }
);

/**
 * POST /api/borrow/handover/:id
 * Admin or librarian confirms handing the book to reader
 */
router.post(
  '/handover/:id',
  authorize('admin', 'librarian'),
  async (req, res) => {
    try {
      const record = await borrowService.confirmHandover(
        req.params.id,
        req.user.id
      );

      res.status(200).json(record);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message,
      });
    }
  }
);

/**
 * GET /api/borrow/all
 * Reader sees own records; admin/librarian see all records
 */
router.get(
  '/all',
  authorize('reader', 'admin', 'librarian'),
  async (req, res) => {
    try {
      const records = await borrowService.getBorrowRecords({
        userRole: req.user.role,
        userId: req.user.id,
      });

      res.status(200).json(records);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message,
      });
    }
  }
);

/**
 * POST /api/borrow/return/:id
 * Admin or librarian confirms book return
 */
router.post(
  '/return/:id',
  authorize('admin', 'librarian'),
  async (req, res) => {
    try {
      const record = await borrowService.returnCopy(
        req.params.id,
        {
          userId: req.user.id,
          userRole: req.user.role,
        }
      );

      res.status(200).json(record);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message,
      });
    }
  }
);

/**
 * GET /api/borrow/borrowing
 * Get currently borrowed books
 */
router.get(
  '/borrowing',
  authorize('reader', 'admin', 'librarian'),
  async (req, res) => {
    try {
      const records = await borrowService.getBorrowingRecords({
        userRole: req.user.role,
        userId: req.user.id,
      });

      res.status(200).json(records);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message,
      });
    }
  }
);

/**
 * GET /api/borrow/overdue
 * Admin or librarian gets overdue books
 */
router.get(
  '/overdue',
  authorize('admin', 'librarian'),
  async (req, res) => {
    try {
      const records = await borrowService.getOverdueBorrows();

      res.status(200).json(records);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message,
      });
    }
  }
);

/**
 * GET /api/borrow/overdue/details
 * Get overdue books with overdue days
 */
router.get(
  '/overdue/details',
  authorize('admin', 'librarian'),
  async (req, res) => {
    try {
      const records = await borrowService.getOverdueDetails();

      res.status(200).json(records);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message,
      });
    }
  }
);

/**
 * GET /api/borrow/history
 * Reader sees own history; admin/librarian see all history
 */
router.get(
  '/history',
  authorize('reader', 'admin', 'librarian'),
  async (req, res) => {
    try {
      const records = await borrowService.getBorrowHistory({
        userRole: req.user.role,
        userId: req.user.id,
      });

      res.status(200).json(records);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message,
      });
    }
  }
);

/**
 * PATCH /api/borrow/extend/:id
 * Admin or librarian extends borrowing period
 */
router.patch(
  '/extend/:id',
  authorize('admin', 'librarian'),
  async (req, res) => {
    try {
      const { newDueDate } = req.body;

      const record = await borrowService.extendBorrow(
        req.params.id,
        newDueDate
      );

      res.status(200).json(record);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message,
      });
    }
  }
);

/**
 * GET /api/borrow/statistics
 * Admin or librarian gets borrow statistics
 */
router.get(
  '/statistics',
  authorize('admin', 'librarian'),
  async (req, res) => {
    try {
      const statistics = await borrowService.getBorrowStatistics();

      res.status(200).json(statistics);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message,
      });
    }
  }
);

module.exports = router;
