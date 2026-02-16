const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middlewares/isAuth');
const { getLeaderboardColumns, updateLeaderboardColumns } = require('../controllers/settings.controller');

// Public — leaderboard reads column config
router.get('/leaderboard-columns', getLeaderboardColumns);

// Admin only — update column config
router.put('/leaderboard-columns', authMiddleware, adminMiddleware, updateLeaderboardColumns);

module.exports = router;
