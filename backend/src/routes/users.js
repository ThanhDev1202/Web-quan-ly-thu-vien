const express = require('express');
const router = express.Router();
const { authorize } = require('../middleware/auth');
const userService = require('../services/user.service');

// GET all users – admin only (with optional filters)
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const { role, status } = req.query;
    const users = await userService.getAllUsers({ role, status });
    res.json(users);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// GET a single user by id
router.get('/:id', authorize('admin', 'librarian', 'reader'), async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id, req.user);
    res.json(user);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message, error: err.message });
  }
});

// POST create librarian / admin account – admin only
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({
      message: `Tạo tài khoản ${req.body.role} thành công!`,
      data: user,
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

// PATCH toggle status (active <-> locked) – admin only
router.patch('/:id/status', authorize('admin'), async (req, res) => {
  try {
    const result = await userService.toggleUserStatus(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// PUT update user – admin edits any, user edits own
router.put('/:id', authorize('admin', 'reader', 'librarian'), async (req, res) => {
  try {
    const result = await userService.updateUser(req.params.id, req.body, req.user);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message, message: err.message });
  }
});

// DELETE user – admin only
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const result = await userService.deleteUser(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message, message: err.message });
  }
});

module.exports = router;
