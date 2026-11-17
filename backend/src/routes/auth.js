const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const {verifyToken} = require('../middleware/auth');
require('dotenv').config();


const authService = require('../services/auth.services');


// REGISTER
router.post('/register', async (req, res) => {
    try {
        const user = await authService.register(req.body);

        return res.status(201).json({
            message: 'Register successful',
            data: user
        });

    } catch (e) {
        return res.status(400).json({
            error: e.message
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { token, user } = await authService.login({ email, password });

        return res.status(200).json({
            message: 'Login successful',
            token,
            user
        });
    } catch (e) {
        return res.status(401).json({
            error: e.message
        });
    }
});
// Change Password
router.put('/changepassword', verifyToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        const userID = req.user.id;

        const result = await authService.ChangePassword(
            userID,
            oldPassword,
            newPassword
        );

        return res.status(200).json(result);

    } catch (e) {
        return res.status(400).json({
            error: e.message
        });
    }
});



module.exports = router;
