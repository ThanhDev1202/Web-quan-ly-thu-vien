const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const reservationService = require('../services/reservation.service');

// POST /api/reservations – create reservation (reader, librarian, admin)
router.post('/', authorize('reader', 'librarian', 'admin'), async (req, res) => {
  const { bookId, expirationDate } = req.body;
  try {
    const reservation = await reservationService.createReservation({
      userId: req.user.id,
      bookId,
      expirationDate,
    });
    res.status(201).json(reservation);
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

// GET /api/reservations – list reservations (reader: own, admin/librarian: all)
router.get('/', authorize('reader', 'librarian', 'admin'), async (req, res) => {
  try {
    const reservations = await reservationService.getReservations({
      userRole: req.user.role,
      userId: req.user.id,
    });
    res.json(reservations);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// PUT /api/reservations/:id – update reservation status (admin, librarian)
router.put('/:id', authorize('admin', 'librarian'), async (req, res) => {
  try {
    const reservation = await reservationService.updateReservationStatus(
      req.params.id,
      req.body.status
    );
    res.json(reservation);
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message, error: err.message });
  }
});

module.exports = router;
