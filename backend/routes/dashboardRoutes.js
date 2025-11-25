const express = require('express');
const router = express.Router();
const { getAdminStats } = require('../controllers/dashboardController');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');

router.get('/dashboard/admin/stats', authMiddleware, adminOnly, getAdminStats);

module.exports = router;
