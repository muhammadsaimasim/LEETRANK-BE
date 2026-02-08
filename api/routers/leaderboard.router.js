const express = require('express');
const router = express.Router();
const { 
    getLeaderboard, 
    updateAllStats, 
    getTopPerformers,
    getStatsOverview 
} = require('../controllers/leaderboard.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/isAuth');
const { 
    validateGetLeaderboard,
    validateGetTopPerformers
} = require('../middlewares/leaderboardValidation');

// Public routes
router.get('/', validateGetLeaderboard, getLeaderboard);
router.get('/top', validateGetTopPerformers, getTopPerformers);
router.get('/stats/overview', getStatsOverview);

// Admin only routes
router.post('/update-all', authMiddleware, adminMiddleware, updateAllStats);

module.exports = router;