const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Reservation = sequelize.define('Reservation', {
  userId: { type: DataTypes.BIGINT, references: { model: 'users', key: 'id' } },
  bookId: { type: DataTypes.BIGINT, references: { model: 'books', key: 'id' } },
  reservationDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  expirationDate: { type: DataTypes.DATE },
  status: { type: DataTypes.ENUM('pending','ready','completed','cancelled','expired'), defaultValue: 'pending' },
}, {
  timestamps: false,
  tableName: 'reservation',
});

module.exports = Reservation;
