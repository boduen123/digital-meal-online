const pool = require('../config/db');

// GET /api/public/stats
const getPublicStats = async (req, res) => {
    try {
        const [mealsResult] = await pool.execute('SELECT SUM(used_plates) as totalMealsServed FROM subscriptions');
        const [studentsResult] = await pool.execute(`SELECT COUNT(DISTINCT student_id) as activeStudents FROM subscriptions WHERE status = 'Active' AND expiry_date >= CURDATE()`);
        const [restaurantsResult] = await pool.execute("SELECT COUNT(id) as totalRestaurants FROM restaurants WHERE status = 'Approved'");

        res.json({
            totalMealsServed: mealsResult[0].totalMealsServed || 0,
            activeStudents: studentsResult[0].activeStudents || 0,
            totalRestaurants: restaurantsResult[0].totalRestaurants || 0,
        });
    } catch (error) {
        console.error("Public stats fetch error:", error);
        res.status(500).json({ message: 'Server error fetching public stats.' });
    }
};

// GET /api/restaurants
const getAllRestaurants = async (req, res) => {
    try {
        const [restaurants] = await pool.execute("SELECT * FROM restaurants WHERE status = 'Approved'");

        res.json(restaurants);
    } catch (error) {
        console.error("Fetch restaurants error:", error);
        res.status(500).json({ message: 'Server error fetching restaurants.' });
    }
};

module.exports = {
    getPublicStats,
    getAllRestaurants,
};