const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const authService = require('../services/auth.service');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const user = await authService.register(req.body);
    return res.status(201).json({
      message: 'Register successful',
      data: user,
    });
  } catch (err) {
    return res.status(err.statusCode || 400).json({
      error: err.message,
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.login({ email, password });
    return res.status(200).json({
      message: 'Login successful',
      token,
      user,
    });
  } catch (err) {
    return res.status(err.statusCode || 401).json({
      error: err.message,
    });
  }
});

// PUT /api/auth/changepassword
router.put('/changepassword', verifyToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await authService.changePassword(
      req.user.id,
      oldPassword,
      newPassword
    );
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 400).json({
      error: err.message,
    });
  }
});

module.exports = router;
