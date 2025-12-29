const express = require('express');
const { getDashboardData, updateOrderStatus, searchSubscribers, useMealForSubscriber, createMealPlan, updateMealPlan, updateRestaurantProfile } = require('../controllers/restaurantController');
const { verifyToken, isRestaurantOwner } = require('../middleware/authMiddleware'); // Corrected path

const router = express.Router();

// All restaurant routes are protected and require a restaurant owner role
router.use(verifyToken, isRestaurantOwner);

router.get('/dashboard-data', getDashboardData);
router.patch('/orders/:orderId/status', updateOrderStatus);
router.post('/subscribers/search', searchSubscribers);
router.post('/subscribers/use-meal', useMealForSubscriber);
router.post('/meal-plans', createMealPlan);
router.put('/meal-plans/:planId', updateMealPlan);
router.put('/profile', updateRestaurantProfile);

module.exports = router;