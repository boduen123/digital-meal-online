const express = require('express');
const { getDashboardData, subscribeToPlan, placeOrder, topUpWallet, exchangeWallets, updateCardLockStatus, shareMeals } = require('../controllers/studentController');
const { verifyToken, isStudent } = require('../middleware/authMiddleware');

const router = express.Router();

// All student routes are protected and require a student role
router.use(verifyToken, isStudent);

router.get('/dashboard-data', getDashboardData);
router.post('/subscribe', subscribeToPlan);
router.post('/order', placeOrder);
router.post('/topup-wallet', topUpWallet);
router.post('/exchange-wallets', exchangeWallets);
router.patch('/card-lock-status', updateCardLockStatus);
router.post('/subscriptions/share', shareMeals);

module.exports = router;