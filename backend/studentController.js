const pool = require('../config/db');

// GET /student/dashboard-data
const getDashboardData = async (req, res) => {
    try {
        const studentId = req.user.id;
        const [profiles] = await pool.execute('SELECT * FROM student_profiles WHERE user_id = ?', [studentId]);
        const studentProfile = profiles[0] || { meal_wallet_balance: 0, flexie_wallet_balance: 0, card_locked: true };

        const [subscriptions] = await pool.execute(
            `SELECT s.*, r.name as restaurantName, mp.name as planName, mp.type as planType, mp.tier as planTier
             FROM subscriptions s
             JOIN restaurants r ON s.restaurant_id = r.id
             JOIN meal_plans mp ON s.plan_id = mp.id
             WHERE s.student_id = ? AND s.status = 'Active'`,
            [studentId]
        );

        for (let sub of subscriptions) {
            const [logs] = await pool.execute('SELECT meal_index FROM meal_usage_logs WHERE subscription_id = ?', [sub.id]);
            sub.usedMeals = logs.map(log => log.meal_index);
        }

        res.json({ profile: studentProfile, subscriptions });
    } catch (error) {
        console.error("Student dashboard data fetch error:", error);
        res.status(500).json({ message: 'Server error fetching dashboard data.' });
    }
};

// POST /student/subscribe
const subscribeToPlan = async (req, res) => {
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

        await connection.commit();
        res.status(201).json({ message: 'Subscription successful!', subscriptionId: result.insertId });
    } catch (error) {
        await connection.rollback();
        console.error("Subscription error:", error);
        res.status(500).json({ message: 'Server error during subscription.' });
    } finally {
        connection.release();
    }
};

// POST /student/order
const placeOrder = async (req, res) => {
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

        // 3. Update Plates
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
        console.error("Place order error:", error);
        res.status(500).json({ message: 'Server error placing order.' });
    } finally {
        connection.release();
    }
};

// Other student controller functions...
const topUpWallet = async (req, res) => {
    const { amount, walletType, paymentMethod, paymentPhone } = req.body;
    const studentId = req.user.id;
    const walletColumn = walletType === 'meal' ? 'meal_wallet_balance' : 'flexie_wallet_balance';
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.execute(`UPDATE student_profiles SET ${walletColumn} = ${walletColumn} + ? WHERE user_id = ?`, [amount, studentId]);
        await connection.execute(`INSERT INTO transactions (user_id, amount, type, method, status) VALUES (?, ?, 'topup', ?, 'completed')`, [studentId, amount, paymentMethod]);
        await connection.commit();
        res.json({ message: 'Wallet topped up successfully.' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Server error during top-up.' });
    } finally {
        connection.release();
    }
};

const exchangeWallets = async (req, res) => {
    const { fromWallet, toWallet, amount } = req.body;
    const studentId = req.user.id;
    const fromCol = fromWallet === 'meal' ? 'meal_wallet_balance' : 'flexie_wallet_balance';
    const toCol = toWallet === 'meal' ? 'meal_wallet_balance' : 'flexie_wallet_balance';
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [profiles] = await connection.execute('SELECT meal_wallet_balance, flexie_wallet_balance FROM student_profiles WHERE user_id = ? FOR UPDATE', [studentId]);
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
};

const updateCardLockStatus = async (req, res) => {
    const { isLocked } = req.body;
    const studentId = req.user.id;
    try {
        await pool.execute('UPDATE student_profiles SET card_locked = ? WHERE user_id = ?', [isLocked, studentId]);
        res.json({ message: 'Card status updated.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update card status.' });
    }
};

// SHARE MEALS BETWEEN STUDENTS (for Student Dashboard)
const shareMeals = async (req, res) => {
    const { subscriptionId, recipientId, mealsToShare } = req.body;
    const senderId = req.user.id;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get the sender's subscription and lock the row for update
        const [senderSubs] = await connection.execute(
            'SELECT * FROM subscriptions WHERE id = ? AND student_id = ? AND status = "Active" FOR UPDATE',
            [subscriptionId, senderId]
        );

        if (senderSubs.length === 0) {
            throw new Error('Subscription not found or does not belong to user.');
        }

        const senderSub = senderSubs[0];

        if (senderSub.used_plates + mealsToShare > senderSub.total_plates) {
            throw new Error('Not enough unused meals to share.');
        }

        // 2. Verify recipient exists and is a student
        const [recipientUsers] = await connection.execute(
            'SELECT id, role FROM users WHERE id = ?',
            [recipientId]
        );
        if (recipientUsers.length === 0 || recipientUsers[0].role !== 'student') { // Fix: access role from first element
            throw new Error('Recipient student not found.');
        }

        // 3. Calculate the new expiry date for the shared meals.  It will be dated from the time of sharing.
        const shareExpiryDate = new Date(Date.now() + senderSub.duration_days * 24 * 60 * 60 * 1000);

        // 4. Create a new subscription for the recipient
        const [newSubResult] = await connection.execute(
            `INSERT INTO subscriptions (student_id, plan_id, restaurant_id, start_date, expiry_date, total_plates, price_paid, payment_method, payment_phone) 
             VALUES (?, ?, ?, NOW(), ?, ?, 0, 'transfer', 'transfer')`,
            [recipientId, senderSub.plan_id, senderSub.restaurant_id, shareExpiryDate, mealsToShare]
        );

        // 5. Update the sender's subscription (reduce total_plates)
        const newTotalPlates = senderSub.total_plates - mealsToShare;
        await connection.execute(
            'UPDATE subscriptions SET total_plates = ? WHERE id = ?',
            [newTotalPlates, subscriptionId]
        );

        // Record transaction for the share
        await connection.execute(
            `INSERT INTO transactions (user_id, amount, type, method, status, reference_id) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [senderId, mealsToShare, 'transfer', 'meal_share', 'completed', `share_${newSubResult.insertId}`]
        );

        await connection.commit();
        res.json({ message: `${mealsToShare} meals successfully shared.` });

    } catch (error) {
        await connection.rollback();
        console.error("Meal sharing error:", error);
        res.status(500).json({ message: error.message || 'Failed to share meals.' });
    } finally {
        connection.release();
    }
};

module.exports = {
    getDashboardData,
    subscribeToPlan,
    placeOrder,
    topUpWallet,
    exchangeWallets,
    updateCardLockStatus,
    shareMeals,
};