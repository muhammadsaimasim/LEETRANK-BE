const User = require('../api/models/user.model');
const { fetchLeetCodeStats } = require('./leetcodeService');

/**
 * Update all users' LeetCode stats.
 * Called by Vercel Cron via /api/cron/update-stats endpoint.
 */
const updateAllUsersStats = async () => {
    const users = await User.find({ role: 'student', isVerified: true });
    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
        try {
            const leetcodeStats = await fetchLeetCodeStats(user.leetcodeUsername);
            user.stats = leetcodeStats;
            await user.save();
            successCount++;
            console.log(`Updated stats for ${user.leetcodeUsername}`);
        } catch (error) {
            console.error(`Failed to update stats for ${user.leetcodeUsername}:`, error.message);
            failCount++;
        }

        // Delay to avoid LeetCode rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return { success: successCount, failed: failCount, total: users.length };
};

module.exports = { updateAllUsersStats };