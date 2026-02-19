const express = require('express');
const router = express.Router();
const { handleCronUpdateStats } = require('../controllers/cron.controller');

// Vercel Cron hits this endpoint on schedule
router.get('/update-stats', handleCronUpdateStats);

module.exports = router;
