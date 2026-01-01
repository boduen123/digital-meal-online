

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ====================================================================
// 1. GLOBAL MIDDLEWARE & CONFIG
// ====================================================================
app.use(cors());
app.use(express.json()); // Replaces bodyParser.json()

// ====================================================================
// 2. DATABASE CONNECTION POOL
// ====================================================================
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'igifu_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ====================================================================
// 3. AUTHENTICATION MIDDLEWARE
// ====================================================================
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        req.user = decoded; // Decoded payload: { id, role, email }
        next();
    } catch (error) {
        console.error("Token verification failed:", error.message);
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

// ====================================================================
// 4. AUTH ROUTES (LOGIN & REGISTER)
// ====================================================================
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, role, phone } = req.body;
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
            await connection.execute('INSERT INTO restaurants (owner_user_id, name, contact_email, status) VALUES (?, ?, ?, ?)', [newUserId, username, email, 'Pending']);
        }
        await connection.commit();
        res.status(201).json({ message: 'User registered successfully', userId: newUserId });
    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email or username already registered.' });
        }
        res.status(500).json({ message: 'Server error during registration' });
    } finally {
        connection.release();
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await pool.execute('SELECT id, username, email, password_hash, role FROM users WHERE email = ? OR username = ?', [username, username]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '24h' });
        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, username: user.username, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login' });
    }
});

// ====================================================================
// 5. PUBLIC ROUTES (STATS & RESTAURANT LIST)
// ====================================================================
app.get('/api/public/stats', async (req, res) => {
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
        res.status(500).json({ message: 'Server error fetching public stats.' });
    }
});

app.get('/api/restaurants', async (req, res) => {
    try {
        const [restaurants] = await pool.execute("SELECT * FROM restaurants WHERE status = 'Approved'");
        const [mealPlans] = await pool.execute("SELECT * FROM meal_plans WHERE is_active = TRUE");
        const plansByRestaurant = mealPlans.reduce((acc, plan) => {
            if (!acc[plan.restaurant_id]) acc[plan.restaurant_id] = [];
            acc[plan.restaurant_id].push(plan);
            return acc;
        }, {});
        const restaurantsWithPlans = restaurants.map(r => ({ ...r, plans: plansByRestaurant[r.id] || [] }));
        res.json(restaurantsWithPlans);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching restaurants.' });
    }
});

app.get('/api/transactions', verifyToken, async (req, res) => {
    try {
        // Fetch transactions for the logged-in user
        const [transactions] = await pool.execute('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching transactions' });
    }
});

// ====================================================================
// 6. STUDENT ROUTES
// ====================================================================
app.get('/api/student/dashboard-data', verifyToken, isStudent, async (req, res) => {
    try {
        const studentId = req.user.id;
        const [profiles] = await pool.execute('SELECT * FROM student_profiles WHERE user_id = ?', [studentId]);
        const studentProfile = profiles[0] || { meal_wallet_balance: 0, flexie_wallet_balance: 0, card_locked: true };
        const [subscriptions] = await pool.execute(
            `SELECT s.*, r.name as restaurantName, mp.name as planName, mp.type as planType, mp.tier as planTier
             FROM subscriptions s
             JOIN restaurants r ON s.restaurant_id = r.id
             JOIN meal_plans mp ON s.plan_id = mp.id
             WHERE s.student_id = ?`,
            [studentId]
        );
        for (let sub of subscriptions) {
            const [logs] = await pool.execute('SELECT meal_index FROM meal_usage_logs WHERE subscription_id = ?', [sub.id]);
            sub.usedMeals = logs.map(log => log.meal_index);
        }
        res.json({ profile: studentProfile, subscriptions });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching dashboard data.' });
    }
});

app.post('/api/student/subscribe', verifyToken, isStudent, async (req, res) => {
    const { planId, restaurantId, pricePaid, totalPlates, durationDays, paymentMethod, paymentPhone } = req.body;
    const studentId = req.user.id;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + durationDays);
        const [result] = await connection.execute(
            `INSERT INTO subscriptions (student_id, plan_id, restaurant_id, expiry_date, total_plates, price_paid, payment_method, payment_phone, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
            [studentId, planId, restaurantId, expiryDate, totalPlates, pricePaid, paymentMethod, paymentPhone]
        );
        await connection.execute(
            `INSERT INTO transactions (user_id, amount, type, method, status, reference_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [studentId, pricePaid, 'subscription_payment', paymentMethod, 'completed', `sub_${result.insertId}`]
        );
        await connection.execute(`UPDATE student_profiles SET meal_wallet_balance = meal_wallet_balance + ? WHERE user_id = ?`, [pricePaid, studentId]);
        await connection.commit();
        res.status(201).json({ message: 'Subscription successful!', subscriptionId: result.insertId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Server error during subscription.' });
    } finally {
        connection.release();
    }
});

app.post('/api/student/order', verifyToken, isStudent, async (req, res) => {
    const { restaurantId, subscriptionId, plates } = req.body;
    const studentId = req.user.id;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get Subscription Details & Calculate Cost
        const [subs] = await connection.execute('SELECT * FROM subscriptions WHERE id = ? AND student_id = ? FOR UPDATE', [subscriptionId, studentId]);
        if (subs.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Subscription not found.' });
        }
        const sub = subs[0];
        const platesToOrder = Number(plates);
        const costPerPlate = Number(sub.price_paid) / Number(sub.total_plates);
        const totalCost = costPerPlate * platesToOrder;
        const currentUsedPlates = sub.used_plates;

        // 2. Deduct Balance from student_profiles
        await connection.execute('UPDATE student_profiles SET meal_wallet_balance = meal_wallet_balance - ? WHERE user_id = ?', [totalCost, studentId]);

        // 3. Update Plates (Reduce available by increasing used)
        await connection.execute('UPDATE subscriptions SET used_plates = used_plates + ? WHERE id = ?', [platesToOrder, subscriptionId]);

        for (let i = 0; i < platesToOrder; i++) {
            await connection.execute(
                'INSERT INTO meal_usage_logs (subscription_id, student_id, restaurant_id, meal_index) VALUES (?, ?, ?, ?)',
                [subscriptionId, studentId, restaurantId, currentUsedPlates + i]
            );
        }

        // 4. Create Order
        const [result] = await pool.execute(
            'INSERT INTO orders (student_id, restaurant_id, subscription_id, plates, status) VALUES (?, ?, ?, ?, ?)',
            [studentId, restaurantId, subscriptionId, platesToOrder, 'pending']
        );

        await connection.commit();
        res.status(201).json({ message: 'Order placed successfully!', orderId: result.insertId });
    } catch (error) {
        await connection.rollback();
        console.error("Order error:", error);
        res.status(500).json({ message: 'Server error placing order.' });
    } finally {
        connection.release();
    }
});

// app.post('/api/student/topup-wallet', verifyToken, isStudent, async (req, res) => {
//     const { amount, walletType, paymentMethod, paymentPhone } = req.body;
//     const studentId = req.user.id;

//     // Ensure amount is a valid number
//     const topUpAmount = parseFloat(amount);
//     if (isNaN(topUpAmount) || topUpAmount <= 0) {
//         return res.status(400).json({ message: 'Invalid amount.' });
//     }

//     const walletColumn = walletType === 'meal' ? 'meal_wallet_balance' : 'flexie_wallet_balance';
//     const connection = await pool.getConnection();
//     try {
//         await connection.beginTransaction();
//         await connection.execute(`UPDATE student_profiles SET ${walletColumn} = ${walletColumn} + ? WHERE user_id = ?`, [topUpAmount, studentId]);
//         await connection.execute(`INSERT INTO transactions (user_id, amount, type, method, status, reference_id) VALUES (?, ?, 'topup', ?, 'completed', ?)`, [studentId, topUpAmount, paymentMethod, `topup_${Date.now()}`]);
//         await connection.commit();
//         res.json({ message: 'Wallet topped up successfully.' });
//     } catch (error) {
//         await connection.rollback();
//         console.error("Topup error:", error);
//         res.status(500).json({ message: 'Server error during top-up.' });
//     } finally {
//         connection.release();
//     }
// });

app.post('/api/student/exchange-wallets', verifyToken, isStudent, async (req, res) => {
    const { fromWallet, toWallet, amount } = req.body;
    const studentId = req.user.id;
    const fromCol = fromWallet === 'meal' ? 'meal_wallet_balance' : 'flexie_wallet_balance';
    const toCol = toWallet === 'meal' ? 'meal_wallet_balance' : 'flexie_wallet_balance';
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [profiles] = await connection.execute('SELECT * FROM student_profiles WHERE user_id = ? FOR UPDATE', [studentId]);
        if (profiles[0][fromCol] < amount) {
            throw new Error('Insufficient balance.');
        }
        await connection.execute(`UPDATE student_profiles SET ${fromCol} = ${fromCol} - ?, ${toCol} = ${toCol} + ? WHERE user_id = ?`, [amount, amount, studentId]);
        await connection.commit();
        res.json({ message: 'Exchange successful.' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message || 'Exchange failed.' });
    } finally {
        connection.release();
    }
});

app.patch('/api/student/card-lock-status', verifyToken, isStudent, async (req, res) => {
    const { isLocked } = req.body;
    const studentId = req.user.id;
    try {
        await pool.execute('UPDATE student_profiles SET card_locked = ? WHERE user_id = ?', [isLocked, studentId]);
        res.json({ message: 'Card status updated.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update card status.' });
    }
});

app.post('/api/student/subscriptions/share', verifyToken, isStudent, async (req, res) => {
    const { subscriptionId, recipientId, mealsToShare } = req.body;
    const senderId = req.user.id;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [senderSubs] = await connection.execute('SELECT * FROM subscriptions WHERE id = ? AND student_id = ? AND status = "Active" FOR UPDATE', [subscriptionId, senderId]);
        if (senderSubs.length === 0) throw new Error('Subscription not found or does not belong to user.');
        const senderSub = senderSubs[0];
        if (senderSub.used_plates + mealsToShare > senderSub.total_plates) throw new Error('Not enough unused meals to share.');
        const [recipientUsers] = await connection.execute('SELECT id, role FROM users WHERE id = ?', [recipientId]);
        if (recipientUsers.length === 0 || recipientUsers[0].role !== 'student') throw new Error('Recipient student not found.');
        const shareExpiryDate = new Date(Date.now() + senderSub.duration_days * 24 * 60 * 60 * 1000);
        const [newSubResult] = await connection.execute(
            `INSERT INTO subscriptions (student_id, plan_id, restaurant_id, start_date, expiry_date, total_plates, price_paid, payment_method, payment_phone) VALUES (?, ?, ?, NOW(), ?, ?, 0, 'transfer', 'transfer')`,
            [recipientId, senderSub.plan_id, senderSub.restaurant_id, shareExpiryDate, mealsToShare]
        );
        const newTotalPlates = senderSub.total_plates - mealsToShare;
        await connection.execute('UPDATE subscriptions SET total_plates = ? WHERE id = ?', [newTotalPlates, subscriptionId]);
        await connection.execute(
            `INSERT INTO transactions (user_id, amount, type, method, status, reference_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [senderId, mealsToShare, 'transfer', 'meal_share', 'completed', `share_${newSubResult.insertId}`]
        );
        await connection.commit();
        res.json({ message: `${mealsToShare} meals successfully shared.` });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message || 'Failed to share meals.' });
    } finally {
        connection.release();
    }
});

// ====================================================================
// 7. RESTAURANT ROUTES
// ====================================================================
app.get('/api/restaurant/dashboard-data', verifyToken, isRestaurantOwner, async (req, res) => {
    const restaurantId = req.restaurantId;
    try {
        const [orders] = await pool.execute(`SELECT o.*, u.username as student_name FROM orders o JOIN users u ON o.student_id = u.id WHERE o.restaurant_id = ? ORDER BY o.created_at DESC`, [restaurantId]);
        const [subscribers] = await pool.execute(`SELECT s.*, u.username as student_name, u.email as student_email, u.phone as student_phone, mp.name as plan_name FROM subscriptions s JOIN users u ON s.student_id = u.id JOIN meal_plans mp ON s.plan_id = mp.id WHERE s.restaurant_id = ?`, [restaurantId]);
        const [mealPlans] = await pool.execute('SELECT * FROM meal_plans WHERE restaurant_id = ?', [restaurantId]);
        res.json({ orders, subscribers, mealPlans });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching restaurant dashboard data.' });
    }
});

app.patch('/api/restaurant/orders/:orderId/status', verifyToken, isRestaurantOwner, async (req, res) => {
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
            }
        }
        await connection.commit();
        res.json({ message: `Order status updated to ${status}` });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Failed to update order status.' });
    } finally {
        connection.release();
    }
});

app.post('/api/restaurant/subscribers/search', verifyToken, isRestaurantOwner, async (req, res) => {
    const { searchQuery } = req.body;
    const restaurantId = req.restaurantId;
    try {
        const [subscribers] = await pool.execute(
            `SELECT s.*, u.username as student_name, u.phone as student_phone, mp.name as plan_name
             FROM subscriptions s JOIN users u ON s.student_id = u.id JOIN meal_plans mp ON s.plan_id = mp.id
             WHERE s.restaurant_id = ? AND (u.id = ? OR u.phone = ?) AND s.status = 'Active' AND s.expiry_date >= CURDATE()`,
            [restaurantId, searchQuery, searchQuery]
        );
        if (subscribers.length === 0) return res.status(404).json({ message: 'No active subscriber found.' });
        res.json(subscribers[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error during search.' });
    }
});

app.post('/api/restaurant/subscribers/use-meal', verifyToken, isRestaurantOwner, async (req, res) => {
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
        console.error("Meal usage error:", error); // Added for better debugging
        await connection.rollback();
        res.status(500).json({ message: error.message || 'Failed to use meal.' });
    } finally {
        connection.release();
    }
});

app.get('/api/restaurant/subscribers', verifyToken, isRestaurantOwner, async (req, res) => {
    const restaurantId = req.restaurantId;
    try {
        const [subscribers] = await pool.execute(`
            SELECT s.*, u.username as student_name, u.email as student_email, u.phone as student_phone, mp.name as plan_name
            FROM subscriptions s
            JOIN users u ON s.student_id = u.id
            JOIN meal_plans mp ON s.plan_id = mp.id
            WHERE s.restaurant_id = ?
            ORDER BY s.start_date DESC
        `, [restaurantId]);
        res.json(subscribers);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching subscribers.' });
    }
});

app.post('/api/restaurant/meal-plans', verifyToken, isRestaurantOwner, async (req, res) => {
    const { name, type, price, total_plates, duration_days } = req.body;
    try {
        const [result] = await pool.execute(
            'INSERT INTO meal_plans (restaurant_id, name, type, price, total_plates, duration_days, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.restaurantId, name, type, price, total_plates, duration_days, true]
        );
        res.status(201).json({ id: result.insertId, ...req.body, restaurant_id: req.restaurantId, is_active: true });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create meal plan.' });
    }
});

app.put('/api/restaurant/meal-plans/:planId', verifyToken, isRestaurantOwner, async (req, res) => {
    const { planId } = req.params;
    const { name, type, price, total_plates, duration_days, is_active } = req.body;
    try {
        await pool.execute(
            'UPDATE meal_plans SET name = ?, type = ?, price = ?, total_plates = ?, duration_days = ?, is_active = ? WHERE id = ? AND restaurant_id = ?',
            [name, type, price, total_plates, duration_days, is_active, planId, req.restaurantId]
        );
        res.json({ message: 'Meal plan updated successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update meal plan.' });
    }
});

app.put('/api/restaurant/profile', verifyToken, isRestaurantOwner, async (req, res) => {
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
        phone // This is the owner's phone from the users table
    } = req.body;
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
});

// ====================================================================
// 8. ADMIN ROUTES
// ====================================================================
app.get('/api/admin/restaurants', verifyToken, isAdmin, async (req, res) => {
    try {
        const [restaurants] = await pool.execute(`SELECT r.*, u.username as owner_name FROM restaurants r LEFT JOIN users u ON r.owner_user_id = u.id ORDER BY r.created_at DESC`);
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching restaurants' });
    }
});

app.get('/api/admin/transactions', verifyToken, isAdmin, async (req, res) => {
    try {
        const [transactions] = await pool.execute(`SELECT t.*, u.username FROM transactions t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC`);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching transactions' });
    }
});

app.patch('/api/admin/restaurants/:id/status', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await pool.execute('UPDATE restaurants SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: `Restaurant status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ message: 'Server error updating status' });
    }
});

app.put('/api/admin/restaurants/:id', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, description, campus, location_sector, location_district, category, contact_phone, contact_email } = req.body;
    try {
        await pool.execute(
            `UPDATE restaurants SET name=?, description=?, campus=?, location_sector=?, location_district=?, category=?, contact_phone=?, contact_email=? WHERE id=?`,
            [name, description, campus, location_sector, location_district, category, contact_phone, contact_email, id]
        );
        res.json({ message: 'Restaurant details updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error updating details' });
    }
});

// ====================================================================
// 9. SERVER INITIALIZATION
// ====================================================================
async function initializeDefaultAdmin() {
    const DEFAULT_ADMIN_USERNAME = 'admin';
    const DEFAULT_ADMIN_PASSWORD_RAW = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    let connection;
    try {
        connection = await pool.getConnection();
        const [admins] = await connection.execute('SELECT id FROM users WHERE username = ? AND role = "admin"', [DEFAULT_ADMIN_USERNAME]);
        if (admins.length === 0) {
            console.log("Default admin user 'admin' not found. Creating...");
            const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD_RAW, 10);
            await connection.execute(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                [DEFAULT_ADMIN_USERNAME, 'admin@igifu.com', hashedPassword, 'admin']
            );
            console.log("Default admin user 'admin' created successfully with password 'admin123'.");
        } else {
            console.log("Default admin user 'admin' already exists.");
        }
    } catch (error) {
        console.error("Could not initialize default admin:", error);
    } finally {
        if (connection) connection.release();
    }
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initializeDefaultAdmin();
});
