const cron = require('node-cron');
const User = require('../models/user.model');
const { fetchLeetCodeStats } = require('./leetcodeService');

const STALE_HOURS = 12;

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

            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`Stats update completed. Success: ${successCount}, Failed: ${failCount}`);
    } catch (error) {
        console.error('Error in scheduled stats update:', error);
    }
};

const coldStartSync = async () => {
    try {
        const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);
        const staleUsers = await User.find({
            role: 'student',
            isVerified: true,
            $or: [
                { 'stats.lastUpdated': { $lt: cutoff } },
                { 'stats.lastUpdated': { $exists: false } }
            ]
        });

        if (staleUsers.length === 0) {
            console.log('Cold-start sync: All stats are fresh, skipping.');
            return;
        }

        console.log(`Cold-start sync: Updating ${staleUsers.length} stale users...`);
        let successCount = 0;

        for (const user of staleUsers) {
            try {
                const leetcodeStats = await fetchLeetCodeStats(user.leetcodeUsername);
                user.stats = leetcodeStats;
                await user.save();
                successCount++;
            } catch (error) {
                console.error(`Cold-start sync failed for ${user.leetcodeUsername}:`, error.message);
            }

            // 5s delay between users (more conservative than the 2s in bulk update)
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        console.log(`Cold-start sync done. Updated ${successCount}/${staleUsers.length} users.`);
    } catch (error) {
        console.error('Cold-start sync error:', error.message);
    }
};

const initCronJobs = () => {
    cron.schedule('0 8 * * *', async () => {
        console.log('Running daily stats update cron job...');
        await updateAllUsersStats();
    });

    console.log('Cron jobs initialized');
};

module.exports = { initCronJobs, updateAllUsersStats, coldStartSync };



// const cron = require('node-cron');
// const User = require('../models/user.model');
// const { fetchLeetCodeStats } = require('./leetcodeService');

// const updateAllUsersStats = async () => {
//     try {
//         console.log('Starting scheduled stats update...');
//         const users = await User.find({ role: 'student', isVerified: true });
//         let successCount = 0;
//         let failCount = 0;

//         for (const user of users) {
//             try {
//                 const leetcodeStats = await fetchLeetCodeStats(user.leetcodeUsername);
//                 user.stats = leetcodeStats;
//                 await user.save();
//                 successCount++;
//                 console.log(`Updated stats for ${user.leetcodeUsername}`);
//             } catch (error) {
//                 console.error(`Failed to update stats for ${user.leetcodeUsername}:`, error.message);
//                 failCount++;
//             }
            
//             await new Promise(resolve => setTimeout(resolve, 2000));
//         }

//         console.log(`Stats update completed. Success: ${successCount}, Failed: ${failCount}`);
//     } catch (error) {
//         console.error('Error in scheduled stats update:', error);
//     }
// };

// const initCronJobs = () => {
//     cron.schedule('0 8 * * *', async () => {
//         console.log('Running daily stats update cron job...');
//         await updateAllUsersStats();
//     });

//     console.log('Cron jobs initialized');
// };

// module.exports = { initCronJobs, updateAllUsersStats };