const cron = require('node-cron');
const User = require('../models/user.model');
const { fetchLeetCodeStats } = require('./leetcodeService');

/**
 * Update all users' LeetCode stats
 */
const updateAllUsersStats = async () => {
    try {
        console.log('Starting scheduled stats update...');
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
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`Stats update completed. Success: ${successCount}, Failed: ${failCount}`);
    } catch (error) {
        console.error('Error in scheduled stats update:', error);
    }
};

/**
 * Initialize cron jobs
 * Runs every day at 8 AM
 */
const initCronJobs = () => {
    // Update all users' stats daily at 8 AM
    cron.schedule('0 8 * * *', async () => {
        console.log('Running daily stats update cron job...');
        await updateAllUsersStats();
    });

    console.log('Cron jobs initialized');
};

module.exports = { initCronJobs, updateAllUsersStats };