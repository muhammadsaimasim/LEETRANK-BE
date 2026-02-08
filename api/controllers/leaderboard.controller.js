const User = require('../models/user.model');
const { fetchLeetCodeStats } = require('../../utils/leetcodeService');

// Get leaderboard
const getLeaderboard = async (req, res) => {
    try {
        const { batch, department, limit = 100, sortBy = 'totalSolved' } = req.query;

        // Build filter
        const filter = {};
        if (batch) filter.batch = batch;
        if (department) filter.department = department;

        // Valid sort fields
        const validSortFields = ['totalSolved', 'easy', 'medium', 'hard', 'ranking'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'totalSolved';

        // Fetch users and sort
        const users = await User.find(filter)
            .select('-password')
            .sort({ [`stats.${sortField}`]: -1 })
            .limit(parseInt(limit));

        res.status(200).json({
            count: users.length,
            leaderboard: users
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ message: 'Failed to fetch leaderboard', error: error.message });
    }
};

// Update all users' stats (Admin only)
const updateAllStats = async (req, res) => {
    try {
        const users = await User.find();
        let successCount = 0;
        let failCount = 0;

        for (const user of users) {
            try {
                const leetcodeStats = await fetchLeetCodeStats(user.leetcodeUsername);
                user.stats = leetcodeStats;
                await user.save();
                successCount++;
            } catch (error) {
                console.error(`Failed to update stats for ${user.leetcodeUsername}`);
                failCount++;
            }
        }

        res.status(200).json({
            message: 'Stats update completed',
            success: successCount,
            failed: failCount,
            total: users.length
        });
    } catch (error) {
        console.error('Update all stats error:', error);
        res.status(500).json({ message: 'Failed to update stats', error: error.message });
    }
};

// Get top performers
const getTopPerformers = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const topUsers = await User.find()
            .select('-password')
            .sort({ 'stats.totalSolved': -1 })
            .limit(parseInt(limit));

        res.status(200).json({
            topPerformers: topUsers
        });
    } catch (error) {
        console.error('Top performers error:', error);
        res.status(500).json({ message: 'Failed to fetch top performers', error: error.message });
    }
};

// Get statistics overview
const getStatsOverview = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        
        const avgStats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    avgTotal: { $avg: '$stats.totalSolved' },
                    avgEasy: { $avg: '$stats.easy' },
                    avgMedium: { $avg: '$stats.medium' },
                    avgHard: { $avg: '$stats.hard' }
                }
            }
        ]);

        const topUser = await User.findOne()
            .select('-password')
            .sort({ 'stats.totalSolved': -1 });

        res.status(200).json({
            totalUsers,
            averageStats: avgStats[0] || {},
            topUser
        });
    } catch (error) {
        console.error('Stats overview error:', error);
        res.status(500).json({ message: 'Failed to fetch stats overview', error: error.message });
    }
};

module.exports = {
    getLeaderboard,
    updateAllStats,
    getTopPerformers,
    getStatsOverview
};