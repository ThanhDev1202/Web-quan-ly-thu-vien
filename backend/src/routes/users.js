
const express = require('express');
const router = express.Router();

const userService = require('../services/user.services');
const { authorize } = require('../middleware/auth');

// Get all users – admin only
router.get('/', authorize('admin'), async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// Get user by id – admin or owner
router.get('/:id', authorize('admin', 'librarian', 'reader'), async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.id, req.user);

        if (user.forbidden) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        if (!user.data) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json(user.data);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// Update user – admin or owner
router.put('/:id', authorize('admin', 'reader', 'librarian'), async (req, res) => {
    try {
        const result = await userService.updateUser(
            req.params.id,
            req.body,
            req.user
        );

        if (result.forbidden) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        if (!result.updated) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ message: 'User updated' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// Delete user – admin only
router.delete('/:id', authorize('admin'), async (req, res) => {
    try {
        const deleted = await userService.deleteUser(req.params.id);

        if (!deleted) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ message: 'User removed' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});


// Add user – admin only
router.post('/', authorize('admin'), async (req, res) => {
    try {
        const result = await userService.createUser(req.body);

        if (result.error) {
            return res.status(400).json({
                message: result.error
            });
        }

        return res.status(201).json({
            message: 'User created successfully',
            user: result.data
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
});


module.exports = router;
