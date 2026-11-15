
const express = require('express');
const router = express.Router();

const borrowService = require('../services/borrow.services');
const { authorize } = require('../middleware/auth');

// Request a borrow - reader/librarian/admin
router.post('/request', authorize('reader', 'librarian', 'admin'), async (req, res) => {
    try {
        const result = await borrowService.requestBorrow(req.body, req.user);

        if (result.notFound) {
            return res.status(404).json({ message: result.message });
        }

        if (result.invalid) {
            return res.status(400).json({ message: result.message });
        }

        return res.status(201).json(result.data);
    } catch (e) {
        return res.status(400).json({ error: e.message });
    }
});

// Approve borrow - admin/librarian
router.post('/approve/:id', authorize('admin', 'librarian'), async (req, res) => {
    try {
        const result = await borrowService.approveBorrow(req.params.id);

        if (result.notFound) {
            return res.status(404).json({ message: result.message });
        }

        if (result.invalid) {
            return res.status(400).json({ message: result.message });
        }

        return res.json(result.data);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// Reject borrow - admin/librarian
router.post('/reject/:id', authorize('admin', 'librarian'), async (req, res) => {
    try {
        const result = await borrowService.rejectBorrow(req.params.id);

        if (result.notFound) {
            return res.status(404).json({ message: result.message });
        }

        if (result.invalid) {
            return res.status(400).json({ message: result.message });
        }

        return res.json(result.data);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// Confirm handover - admin/librarian
router.post('/handover/:id', authorize('admin', 'librarian'), async (req, res) => {
    try {
        const result = await borrowService.confirmHandover(
            req.params.id,
            req.user
        );

        if (result.notFound) {
            return res.status(404).json({ message: result.message });
        }

        if (result.invalid) {
            return res.status(400).json({ message: result.message });
        }

        return res.json(result.data);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// Get all borrow records
router.get('/all', authorize('reader', 'librarian', 'admin'), async (req, res) => {
    try {
        const records = await borrowService.getAllBorrows(req.user);
        return res.json(records);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// Get overdue borrow records
router.get('/overdue', authorize('reader', 'librarian', 'admin'), async (req, res) => {
    try {
        const records = await borrowService.getOverdueBorrows(req.user);
        return res.json(records);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// Get borrow history
router.get('/history', authorize('reader', 'librarian', 'admin'), async (req, res) => {
    try {
        const records = await borrowService.getBorrowHistory(req.user);
        return res.json(records);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// Return a copy
router.post('/return/:id', authorize('reader', 'admin', 'librarian'), async (req, res) => {
    try {
        const result = await borrowService.returnBorrow(req.params.id);

        if (result.notFound) {
            return res.status(404).json({ message: result.message });
        }

        if (result.invalid) {
            return res.status(400).json({ message: result.message });
        }

        return res.json(result.data);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

module.exports = router;
