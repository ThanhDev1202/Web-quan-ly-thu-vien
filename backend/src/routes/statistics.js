
const express = require('express');
const router = express.Router();

const {
  sequelize,
  User,
  Book,
  BookCopy,
  BorrowRecord
} = require('../models');

const { authorize } = require('../middleware/auth');

// Chỉ Admin và Librarian được xem thống kê
router.use(authorize('admin', 'librarian'));

// ==========================================
// 1. TỔNG QUAN THƯ VIỆN
// GET /api/statistics/overview
// ==========================================
router.get('/overview', async (req, res) => {
  try {
    const [
      totalBooks,
      totalCopies,
      availableCopies,
      borrowedCopies,
      totalReaders,
      activeBorrows,
      totalReturns,
      overdueBooks
    ] = await Promise.all([
      Book.count(),

      BookCopy.count(),

      BookCopy.count({
        where: { status: 'available' }
      }),

      BookCopy.count({
        where: { status: 'borrowed' }
      }),

      User.count({
        where: { role: 'reader' }
      }),

      BorrowRecord.count({
        where: { status: 'borrowed' }
      }),

      BorrowRecord.count({
        where: { status: 'returned' }
      }),

      BorrowRecord.count({
        where: {
          status: 'borrowed',
          dueDate: {
            [require('sequelize').Op.lt]: new Date()
          }
        }
      })
    ]);

    res.json({
      totalBooks,
      totalCopies,
      availableCopies,
      borrowedCopies,
      totalReaders,
      activeBorrows,
      totalReturns,
      overdueBooks
    });

  } catch (error) {
    console.error('Statistics overview error:', error);
    res.status(500).json({
      message: 'Không thể tải thống kê tổng quan',
      error: error.message
    });
  }
});

// ==========================================
// 2. THỐNG KÊ MƯỢN / TRẢ THEO THỜI GIAN
// GET /api/statistics/borrowing?period=30
// ==========================================
router.get('/borrowing', async (req, res) => {
  try {
    const period = Number(req.query.period) || 30;

    if (![7, 30, 90, 365].includes(period)) {
      return res.status(400).json({
        message: 'Khoảng thời gian không hợp lệ. Chọn 7, 30, 90 hoặc 365 ngày.'
      });
    }

    const [borrowings, returns] = await Promise.all([
      sequelize.query(`
        SELECT
          DATE(borrow_date) AS date,
          COUNT(*) AS total
        FROM borrow_records
        WHERE status IN ('borrowed', 'returned')
          AND borrow_date >= DATE_SUB(CURDATE(), INTERVAL :period DAY)
        GROUP BY DATE(borrow_date)
        ORDER BY date ASC
      `, {
        replacements: { period },
        type: sequelize.QueryTypes.SELECT
      }),

      sequelize.query(`
        SELECT
          DATE(return_date) AS date,
          COUNT(*) AS total
        FROM borrow_records
        WHERE status = 'returned'
          AND return_date >= DATE_SUB(CURDATE(), INTERVAL :period DAY)
        GROUP BY DATE(return_date)
        ORDER BY date ASC
      `, {
        replacements: { period },
        type: sequelize.QueryTypes.SELECT
      })
    ]);

    res.json({
      period,
      borrowings,
      returns
    });

  } catch (error) {
    console.error('Borrowing statistics error:', error);
    res.status(500).json({
      message: 'Không thể tải thống kê mượn trả',
      error: error.message
    });
  }
});

// ==========================================
// 3. TOP 5 SÁCH ĐƯỢC MƯỢN NHIỀU NHẤT
// GET /api/statistics/top-books
// ==========================================
router.get('/top-books', async (req, res) => {
  try {
    const topBooks = await sequelize.query(`
      SELECT
        b.id,
        b.title,
        b.isbn,
        COUNT(br.id) AS borrowCount
      FROM borrow_records br
      INNER JOIN book_copies bc ON br.copy_id = bc.id
      INNER JOIN books b ON bc.book_id = b.id
      WHERE br.status IN ('borrowed', 'returned')
      GROUP BY b.id, b.title, b.isbn
      ORDER BY borrowCount DESC
      LIMIT 5
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json(topBooks);

  } catch (error) {
    console.error('Top books statistics error:', error);
    res.status(500).json({
      message: 'Không thể tải danh sách sách được mượn nhiều nhất',
      error: error.message
    });
  }
});

// ==========================================
// 4. DANH SÁCH SÁCH QUÁ HẠN
// GET /api/statistics/overdue
// ==========================================
router.get('/overdue', async (req, res) => {
  try {
    const overdueBooks = await BorrowRecord.findAll({
      where: {
        status: 'borrowed',
        dueDate: {
          [require('sequelize').Op.lt]: new Date()
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'phone']
        },
        {
          model: BookCopy,
          include: [
            {
              model: Book,
              attributes: ['id', 'title', 'isbn']
            }
          ]
        }
      ],
      order: [['dueDate', 'ASC']]
    });

    res.json(overdueBooks);

  } catch (error) {
    console.error('Overdue statistics error:', error);
    res.status(500).json({
      message: 'Không thể tải danh sách sách quá hạn',
      error: error.message
    });
  }
});

module.exports = router;
