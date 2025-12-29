const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        req.user = decoded; // Decoded payload: { id, role, email }
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
};

const isStudent = (req, res, next) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Access forbidden. Not a student.' });
    }
    next();
};

const isRestaurantOwner = async (req, res, next) => {
    if (req.user.role !== 'restaurant') {
        return res.status(403).json({ message: 'Access forbidden. Not a restaurant owner.' });
    }
    try {
        const [restaurants] = await pool.execute('SELECT id FROM restaurants WHERE owner_user_id = ?', [req.user.id]);
        if (restaurants.length === 0) {
            return res.status(404).json({ message: 'Restaurant not found for this user.' });
        }
        req.restaurantId = restaurants[0].id;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error verifying restaurant ownership.' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access forbidden. Not an admin.' });
    }
    next();
};

module.exports = {
    verifyToken,
    isStudent,
    isRestaurantOwner,
    isAdmin,
};