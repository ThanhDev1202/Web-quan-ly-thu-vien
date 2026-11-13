const express = require('express');
const router = express.Router();
const { User, AuditLog } = require('../models');
const { authorize } = require('../middleware/auth');

// Get all users – admin only
router.get('/', authorize('admin'), async (req, res) => {
  const users = await User.findAll({ attributes: { exclude: ['passwordHash'] } });
  res.json(users);
});

// Get a user by id – admin or the user himself
router.get('/:id', authorize('admin','librarian','reader'), async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'admin' && Number(id) !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const user = await User.findByPk(id, { attributes: { exclude: ['passwordHash'] } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// Update user – admin can edit any, user can edit own profile (excluding role)
router.put('/:id', authorize('admin','reader','librarian'), async (req, res) => {
  const { id } = req.params;
  const data = { ...req.body };
  if (req.user.role !== 'admin') {
    // non‑admin cannot change role or status
    delete data.role;
    delete data.status;
  }
  if (Number(id) !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const [updated] = await User.update(data, { where: { id } });
  if (!updated) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User updated' });
});

// Delete user – admin only
router.delete('/:id', authorize('admin'), async (req, res) => {
  const { id } = req.params;
  const deleted = await User.destroy({ where: { id } });
  if (!deleted) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User removed' });
});

module.exports = router;
