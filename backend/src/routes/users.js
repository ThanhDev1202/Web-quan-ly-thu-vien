const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// ─────────────────────────────────────────────────
// GET all users – admin only (with optional filters)
// ─────────────────────────────────────────────────
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const { role, status } = req.query;
    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;

    const users = await User.findAll({
      where,
      attributes: { exclude: ['passwordHash'] },
      order: [['created_at', 'DESC']],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────
// GET a single user by id
// ─────────────────────────────────────────────────
router.get('/:id', authorize('admin', 'librarian', 'reader'), async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'admin' && Number(id) !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const user = await User.findByPk(id, { attributes: { exclude: ['passwordHash'] } });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────
// POST create librarian / admin account – admin only
// ─────────────────────────────────────────────────
router.post('/', authorize('admin'), async (req, res) => {
  const { username, email, password, fullName, phone, role } = req.body;

  // Admin chỉ được tạo librarian hoặc admin
  const allowedRoles = ['librarian', 'admin'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Admin chỉ có thể tạo tài khoản librarian hoặc admin.' });
  }

  if (!username || !email || !password || !fullName) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ: username, email, mật khẩu và họ tên.' });
  }

  try {
    // Check duplicates
    const existing = await User.findOne({ where: { username } });
    if (existing) return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại.' });

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) return res.status(400).json({ error: 'Email đã được sử dụng.' });

    const user = await User.create({
      username,
      email,
      passwordHash: password,   // hook beforeCreate sẽ hash
      fullName,
      phone,
      role,
      status: 'active',
    });

    res.status(201).json({
      message: `Tạo tài khoản ${role} thành công!`,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────
// PATCH toggle status (active <-> locked) – admin only
// ─────────────────────────────────────────────────
router.patch('/:id/status', authorize('admin'), async (req, res) => {
  const { id } = req.params;

  // Prevent admin from locking their own account
  if (Number(id) === req.user.id) {
    return res.status(400).json({ error: 'Không thể thay đổi trạng thái tài khoản của chính mình.' });
  }

  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    const newStatus = user.status === 'active' ? 'locked' : 'active';
    await user.update({ status: newStatus });

    res.json({
      message: `Tài khoản "${user.username}" đã được ${newStatus === 'locked' ? 'khóa' : 'mở khóa'} thành công.`,
      status: newStatus,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────
// PUT update user – admin edits any, user edits own
// ─────────────────────────────────────────────────
router.put('/:id', authorize('admin', 'reader', 'librarian'), async (req, res) => {
  const { id } = req.params;
  const data = { ...req.body };
  if (req.user.role !== 'admin') {
    delete data.role;
    delete data.status;
  }
  if (Number(id) !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const [updated] = await User.update(data, { where: { id } });
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    res.json({ message: 'Cập nhật thành công.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────
// DELETE user – admin only
// ─────────────────────────────────────────────────
router.delete('/:id', authorize('admin'), async (req, res) => {
  const { id } = req.params;
  if (Number(id) === req.user.id) {
    return res.status(400).json({ error: 'Không thể xóa tài khoản của chính mình.' });
  }
  try {
    const deleted = await User.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    res.json({ message: 'Đã xóa tài khoản thành công.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
