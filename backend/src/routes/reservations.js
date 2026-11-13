const express = require('express');
const router = express.Router();
const { Reservation, Book } = require('../models');
const { authorize } = require('../middleware/auth');

// Create a reservation – reader or librarian
router.post('/', authorize('reader','librarian','admin'), async (req, res) => {
  const { bookId, expirationDate } = req.body;
  try {
    const reservation = await Reservation.create({
      userId: req.user.id,
      bookId,
      expirationDate,
      status: 'pending',
    });
    res.status(201).json(reservation);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// List reservations for current user – reader sees own, admin/librarian sees all
router.get('/', authorize('reader','librarian','admin'), async (req, res) => {
  const where = req.user.role === 'reader' ? { userId: req.user.id } : {};
  const reservations = await Reservation.findAll({ where, include: [{ model: Book }] });
  res.json(reservations);
});

// Update reservation status – admin/librarian
router.put('/:id', authorize('admin','librarian'), async (req, res) => {
  const { status } = req.body;
  const reservation = await Reservation.findByPk(req.params.id);
  if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
  await reservation.update({ status });
  res.json(reservation);
});

module.exports = router;
