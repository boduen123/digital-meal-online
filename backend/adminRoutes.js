const express = require('express');
const { getAllRestaurants, getAllTransactions, updateRestaurantStatus } = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// All admin routes are protected and require an admin role
router.use(verifyToken, isAdmin);

router.get('/restaurants', getAllRestaurants);
router.get('/transactions', getAllTransactions);
router.patch('/restaurants/:id/status', updateRestaurantStatus);

module.exports = router;