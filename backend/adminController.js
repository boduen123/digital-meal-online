const pool = require('../config/db');

// GET /admin/restaurants
const getAllRestaurants = async (req, res) => {
    try {
        const [restaurants] = await pool.execute(`SELECT r.*, u.username as owner_name FROM restaurants r LEFT JOIN users u ON r.owner_user_id = u.id ORDER BY r.created_at DESC`);
        res.json(restaurants);
    } catch (error) {
        console.error("Admin Fetch Restaurants Error:", error);
        res.status(500).json({ message: 'Server error fetching restaurants' });
    }
};

// GET /admin/transactions
const getAllTransactions = async (req, res) => {
    try {
        const [transactions] = await pool.execute(
            `SELECT t.*, u.username 
             FROM transactions t 
             JOIN users u ON t.user_id = u.id 
             ORDER BY t.created_at DESC`
        );
        res.json(transactions);
    } catch (error) {
        console.error("Admin Fetch Transactions Error:", error);
        res.status(500).json({ message: 'Server error fetching transactions' });
    }
};

// PATCH /admin/restaurants/:id/status
const updateRestaurantStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Approved', 'Rejected', 'Suspended'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }

    try {
        await pool.execute(
            'UPDATE restaurants SET status = ? WHERE id = ?',
            [status, id]
        );
        res.json({ message: `Restaurant status updated to ${status}` });
    } catch (error) {
        console.error("Admin Update Status Error:", error);
        res.status(500).json({ message: 'Server error updating status' });
    }
};

module.exports = {
    getAllRestaurants,
    getAllTransactions,
    updateRestaurantStatus,
};