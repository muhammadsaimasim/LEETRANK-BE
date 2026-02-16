const Settings = require('../models/settings.model');

const DEFAULT_LEADERBOARD_COLUMNS = {
    rollno: true,
    programme: true,
    batch: true,
    leetcodeRank: true,
    total: true,
    hard: true,
    medium: true,
};

// GET /settings/leaderboard-columns — public, anyone can read
const getLeaderboardColumns = async (req, res) => {
    try {
        const columns = await Settings.getSetting('leaderboardColumns', DEFAULT_LEADERBOARD_COLUMNS);
        res.status(200).json({ success: true, columns });
    } catch (error) {
        console.error('Get leaderboard columns error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch leaderboard column settings' });
    }
};

// PUT /settings/leaderboard-columns — admin only
const updateLeaderboardColumns = async (req, res) => {
    try {
        const { columns } = req.body;
        if (!columns || typeof columns !== 'object') {
            return res.status(400).json({ success: false, message: 'Invalid columns configuration' });
        }

        // Validate that only known keys are provided
        const allowedKeys = Object.keys(DEFAULT_LEADERBOARD_COLUMNS);
        const sanitized = {};
        for (const key of allowedKeys) {
            sanitized[key] = columns[key] !== undefined ? Boolean(columns[key]) : true;
        }

        await Settings.setSetting('leaderboardColumns', sanitized);
        res.status(200).json({ success: true, message: 'Leaderboard columns updated', columns: sanitized });
    } catch (error) {
        console.error('Update leaderboard columns error:', error);
        res.status(500).json({ success: false, message: 'Failed to update leaderboard column settings' });
    }
};

module.exports = { getLeaderboardColumns, updateLeaderboardColumns };
