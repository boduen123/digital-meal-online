const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { username, email, password, role, phone, description, campus, location_sector, location_district, category, logo_url, image_url, walk_time, contact_phone } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        if (!['student', 'restaurant'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role specified' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const [userResult] = await connection.execute(
            'INSERT INTO users (username, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, role, phone || null]
        );
        const newUserId = userResult.insertId;
        if (role === 'student') {
            await connection.execute('INSERT INTO student_profiles (user_id, card_locked) VALUES (?, ?)', [newUserId, true]);
        } else if (role === 'restaurant') {
            await connection.execute(
                `INSERT INTO restaurants (owner_user_id, name, contact_email, status, description, campus, location_sector, location_district, category, logo_url, image_url, walk_time, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [newUserId, username, email, 'Pending', description, campus, location_sector, location_district, category, logo_url, image_url, walk_time, contact_phone || phone]
            );
        }
        await connection.commit();
        res.status(201).json({ message: 'User registered successfully', userId: newUserId });
    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email or username already registered.' });
        res.status(500).json({ message: 'Server error during registration' });
    } finally {
        connection.release();
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ? OR username = ?', [username, username]);
        if (users.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
        
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        // On successful login, fetch full restaurant details if user is a restaurant owner
        let userPayload = { id: user.id, username: user.username, email: user.email, role: user.role, phone: user.phone };
        if (user.role === 'restaurant') {
            const [restaurants] = await pool.execute('SELECT * FROM restaurants WHERE owner_user_id = ?', [user.id]);
            if (restaurants.length > 0) {
                userPayload = { ...userPayload, ...restaurants[0] };
            }
        }

        const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '24h' });
        res.json({ message: 'Login successful', token, user: userPayload });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login' });
    }
});

module.exports = router;