const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// ────────── LOGIN ──────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                assignedWashrooms: user.assignedWashrooms
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ────────── GET CURRENT USER ──────────
router.get('/me', authMiddleware, async (req, res) => {
    res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            assignedWashrooms: req.user.assignedWashrooms
        }
    });
});

// ────────── REGISTER NODAL OFFICER (Super Admin only) ──────────
router.post('/register', authMiddleware, requireRole('MCD_SUPER_ADMIN'), async (req, res) => {
    try {
        const { name, email, password, role, assignedWashrooms } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User with this email already exists.' });
        }

        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password,
            role: role || 'NODAL_OFFICER',
            assignedWashrooms: assignedWashrooms || []
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: 'User created successfully.',
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                assignedWashrooms: newUser.assignedWashrooms
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ────────── LIST ALL USERS (Super Admin only) ──────────
router.get('/users', authMiddleware, requireRole('MCD_SUPER_ADMIN'), async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ────────── DELETE USER (Super Admin only) ──────────
router.delete('/users/:id', authMiddleware, requireRole('MCD_SUPER_ADMIN'), async (req, res) => {
    try {
        // Prevent admin from deleting themselves
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.status(200).json({ success: true, message: 'User deleted successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
