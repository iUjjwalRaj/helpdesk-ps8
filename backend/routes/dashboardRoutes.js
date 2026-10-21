const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Dashboard metrics is protected for support staff
router.get('/stats', protect, authorizeRoles('support'), getDashboardStats);

module.exports = router;
