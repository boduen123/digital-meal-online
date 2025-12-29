const express = require('express');
const {
  getAllRestaurants,
  updateRestaurantDetails,
  updateRestaurantStatus
} = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/restaurants', [verifyToken, isAdmin], getAllRestaurants);
router.put('/restaurants/:id', [verifyToken, isAdmin], updateRestaurantDetails);
router.patch('/restaurants/:id/status', [verifyToken, isAdmin], updateRestaurantStatus);

module.exports = router;