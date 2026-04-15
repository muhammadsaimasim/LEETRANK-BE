const User = require('../api/models/user.model');
const { fetchLeetCodeStats } = require('./leetcodeService');

/**
 * Update all users' LeetCode stats.
 * Called by Vercel Cron via /api/cron/update-stats endpoint.
 */
/**
 * Update a batch of users' LeetCode stats.
 * Called by Vercel Cron via /api/cron/update-stats endpoint.
 * Limited to a small batch to stay within Vercel's 10s serverless timeout.
 */
const updateAllUsersStats = async () => {
    const BATCH_SIZE = 5; // Safely fits within 10s with 1s delays
    
    // Find verified students who haven't been updated recently (or ever)
    const users = await User.find({ role: 'student', isVerified: true })
        .sort({ 'stats.lastUpdated': 1 }) // Oldest first (null values come first)
        .limit(BATCH_SIZE);

    let successCount = 0;
    let failCount = 0;

    console.log(`Processing batch of ${users.length} users...`);

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

        // Reduced delay to 1s to ensure batch fits in 10s window
        if (users.indexOf(user) < users.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    return { 
        success: successCount, 
        failed: failCount, 
        processed: users.length,
        batchSize: BATCH_SIZE
    };
};

module.exports = { updateAllUsersStats };