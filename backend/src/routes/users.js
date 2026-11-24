
const express = require('express');
const router = express.Router();

const { authorize } = require('../middleware/auth');
const userService = require('../services/user.service');

/**
 * GET /api/users
 * Get all users with optional role and status filters
 * Admin only
 */
router.get(
  '/',
  authorize('admin'),
  async (req, res) => {
    try {
      const { role, status } = req.query;

      const users = await userService.getAllUsers({
        role,
        status,
      });

      res.status(200).json(users);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message,
      });
    }
  }
);

/**
 * GET /api/users/:id
 * Admin: view any user
 * Reader/Librarian: view own account only
 */
router.get(
  '/:id',
  authorize('admin', 'librarian', 'reader'),
  async (req, res) => {
    try {
      const user = await userService.getUserById(
        req.params.id,
        req.user
      );

      res.status(200).json(user);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message,
      });
    }
  }
);

/**
 * POST /api/users
 * Create librarian or admin account
 * Admin only
 */
router.post(
  '/',
  authorize('admin'),
  async (req, res) => {
    try {
      const user = await userService.createUser(
        req.body,
        req.user.id
      );

      res.status(201).json({
        message: `Tạo tài khoản ${user.role} thành công!`,
        data: user,
      });
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message,
      });
    }
  }
);

/**
 * PATCH /api/users/:id/status
 * Toggle user status: active <-> locked
 * Admin only
 */
router.patch(
  '/:id/status',
  authorize('admin'),
  async (req, res) => {
    try {
      const result = await userService.toggleUserStatus(
        req.params.id,
        req.user.id
      );

      res.status(200).json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message,
      });
    }
  }
);

/**
 * PUT /api/users/:id
 * Admin: update another user's information
 * Reader/Librarian: update own information only
 */
router.put(
  '/:id',
  authorize('admin', 'reader', 'librarian'),
  async (req, res) => {
    try {
      const result = await userService.updateUser(
        req.params.id,
        req.body,
        req.user
      );

      res.status(200).json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message,
      });
    }
  }
);

/**
 * DELETE /api/users/:id
 * Delete user account
 * Admin only
 */
router.delete(
  '/:id',
  authorize('admin'),
  async (req, res) => {
    try {
      const result = await userService.deleteUser(
        req.params.id,
        req.user.id
      );

      res.status(200).json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message,
      });
    }
  }
);

module.exports = router;
