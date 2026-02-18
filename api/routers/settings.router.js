const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middlewares/isAuth');
const { getLeaderboardColumns, updateLeaderboardColumns } = require('../controllers/settings.controller');

router.get('/leaderboard-columns', getLeaderboardColumns);

router.put('/leaderboard-columns', authMiddleware, adminMiddleware, updateLeaderboardColumns);

module.exports = router;
