const { Reservation, Book } = require('../models');

/**
 * Create a reservation (reader or librarian)
 */
async function createReservation({ userId, bookId, expirationDate }) {
  if (!bookId) {
    const error = new Error('bookId là bắt buộc.');
    error.statusCode = 400;
    throw error;
  }

  return await Reservation.create({
    userId,
    bookId,
    expirationDate,
    status: 'pending',
  });
}

/**
 * List reservations (readers see own, librarian/admin see all)
 */
async function getReservations({ userRole, userId }) {
  const where = userRole === 'reader' ? { userId } : {};

  return await Reservation.findAll({
    where,
    include: [{ model: Book }],
    order: [['id', 'DESC']],
  });
}

/**
 * Update reservation status (admin or librarian)
 */
async function updateReservationStatus(id, status) {
  const reservation = await Reservation.findByPk(id);
  if (!reservation) {
    const error = new Error('Reservation not found');
    error.statusCode = 404;
    throw error;
  }

  await reservation.update({ status });
  return reservation;
}

module.exports = {
  createReservation,
  getReservations,
  updateReservationStatus,
};
