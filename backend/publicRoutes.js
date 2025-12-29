const express = require('express');
const { getPublicStats, getAllRestaurants } = require('../controllers/publicController');

const router = express.Router();

router.get('/public/stats', getPublicStats);
router.get('/restaurants', getAllRestaurants);

module.exports = router;