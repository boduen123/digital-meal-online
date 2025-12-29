const pool = require('../config/db');

// GET /restaurant/dashboard-data
const getDashboardData = async (req, res) => {
    const restaurantId = req.restaurantId;
    try {
        const [orders] = await pool.execute(`SELECT o.*, u.username as student_name FROM orders o JOIN users u ON o.student_id = u.id WHERE o.restaurant_id = ? ORDER BY o.created_at DESC`, [restaurantId]);
        const [subscribers] = await pool.execute(`SELECT s.*, u.username as student_name, u.email as student_email, u.phone as student_phone, mp.name as plan_name FROM subscriptions s JOIN users u ON s.student_id = u.id JOIN meal_plans mp ON s.plan_id = mp.id WHERE s.restaurant_id = ?`, [restaurantId]);
        const [mealPlans] = await pool.execute('SELECT * FROM meal_plans WHERE restaurant_id = ?', [restaurantId]);
        res.json({ orders, subscribers, mealPlans });
    } catch (error) {
        console.error("Restaurant dashboard data fetch error:", error);
        res.status(500).json({ message: 'Server error fetching dashboard data.' });
    }
};

// PATCH /restaurant/orders/:orderId/status
const updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    const restaurantId = req.restaurantId;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.execute('UPDATE orders SET status = ? WHERE id = ? AND restaurant_id = ?', [status, orderId, restaurantId]);
        
        if (status === 'served') {
            const [orders] = await connection.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
            const order = orders[0];
            if (order.subscription_id) {
                await connection.execute('UPDATE subscriptions SET used_plates = used_plates + ? WHERE id = ?', [order.plates, order.subscription_id]);
                // You could add a meal_usage_log entry here as well
            }
        }
        await connection.commit();
        res.json({ message: `Order status updated to ${status}` });
    } catch (error) {
        await connection.rollback();
        console.error("Update order status error:", error);
        res.status(500).json({ message: 'Failed to update order status.' });
    } finally {
        connection.release();
    }
};

// POST /restaurant/subscribers/search
const searchSubscribers = async (req, res) => {
    const { searchQuery } = req.body;
    const restaurantId = req.restaurantId;
    try {
        const [subscribers] = await pool.execute(
            `SELECT s.*, u.username as student_name, u.phone as student_phone, mp.name as plan_name
             FROM subscriptions s
             JOIN users u ON s.student_id = u.id
             JOIN meal_plans mp ON s.plan_id = mp.id
             WHERE s.restaurant_id = ? AND (u.id = ? OR u.phone = ?) AND s.status = 'Active' AND s.expiry_date >= CURDATE()`,
            [restaurantId, searchQuery, searchQuery]
        );
        if (subscribers.length === 0) {
            return res.status(404).json({ message: 'No active subscriber found.' });
        }
        res.json(subscribers[0]);
    } catch (error) {
        console.error("Subscriber search error:", error);
        res.status(500).json({ message: 'Server error during search.' });
    }
};

// POST /restaurant/subscribers/use-meal
const useMealForSubscriber = async (req, res) => {
    const { subscriptionId } = req.body;
    const restaurantId = req.restaurantId;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [subs] = await connection.execute('SELECT * FROM subscriptions WHERE id = ? AND restaurant_id = ? FOR UPDATE', [subscriptionId, restaurantId]);
        if (subs.length === 0) throw new Error('Subscription not found.');
        const sub = subs[0];
        if (sub.used_plates >= sub.total_plates) throw new Error('No plates left.');

        const newUsedPlates = sub.used_plates + 1;
        await connection.execute('UPDATE subscriptions SET used_plates = ? WHERE id = ?', [newUsedPlates, subscriptionId]);
        await connection.execute('INSERT INTO meal_usage_logs (subscription_id, student_id, restaurant_id, meal_index) VALUES (?, ?, ?, ?)', [subscriptionId, sub.student_id, restaurantId, newUsedPlates - 1]);
        
        if (newUsedPlates >= sub.total_plates) {
            await connection.execute('UPDATE subscriptions SET status = "Depleted" WHERE id = ?', [subscriptionId]);
        }
        await connection.commit();
        res.json({ message: 'Meal successfully recorded.' });
    } catch (error) {
        await connection.rollback();
        console.error("Meal usage error:", error);
        res.status(500).json({ message: error.message || 'Failed to use meal.' });
    } finally {
        connection.release();
    }
};

// Other restaurant controller functions (meal plans)...
const createMealPlan = async (req, res) => {
    res.status(501).json({ message: 'Not Implemented: createMealPlan' });
};

const updateMealPlan = async (req, res) => {
    res.status(501).json({ message: 'Not Implemented: updateMealPlan' });
};

// PUT /restaurant/profile
const updateRestaurantProfile = async (req, res) => {
    const restaurantId = req.restaurantId;
    const {
        name,
        description,
        campus,
        location_sector,
        location_district,
        category,
        logo_url,
        image_url,
        walk_time,
        contact_phone,
    } = req.body;

    // The user's primary phone and email are updated on the `users` table
    const { phone } = req.body;
    const userId = req.user.id;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Update the restaurants table
        await connection.execute(
            `UPDATE restaurants SET name=?, description=?, campus=?, location_sector=?, location_district=?, category=?, logo_url=?, image_url=?, walk_time=?, contact_phone=? WHERE id=?`,
            [name, description, campus, location_sector, location_district, category, logo_url, image_url, walk_time, contact_phone, restaurantId]
        );

        // Update the users table for the owner's primary phone
        await connection.execute(`UPDATE users SET phone=? WHERE id=?`, [phone, userId]);

        await connection.commit();
        res.json({ message: 'Profile updated successfully.' });
    } catch (error) {
        await connection.rollback();
        console.error("Restaurant profile update error:", error);
        res.status(500).json({ message: 'Server error updating profile.' });
    } finally {
        connection.release();
    }
};

module.exports = {
    getDashboardData,
    updateOrderStatus,
    searchSubscribers,
    useMealForSubscriber,
    createMealPlan,
    updateMealPlan,
    updateRestaurantProfile,
};