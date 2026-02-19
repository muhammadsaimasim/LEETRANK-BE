const { updateAllUsersStats } = require('../../utils/cronjobs');

/**
 * Vercel Cron handler - updates all users' LeetCode stats.
 * Secured by CRON_SECRET to prevent unauthorized access.
 */
const handleCronUpdateStats = async (req, res) => {
    try {
        // Verify the request is from Vercel Cron
        const authHeader = req.headers['authorization'];
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        console.log('Vercel Cron: Starting stats update...');
        const result = await updateAllUsersStats();
        console.log(`Vercel Cron: Stats update completed.`, result);

        res.status(200).json({
            success: true,
            message: 'Stats update completed',
            ...result
        });
    } catch (error) {
        console.error('Vercel Cron error:', error);
        res.status(500).json({ success: false, message: 'Cron job failed', error: error.message });
    }
};

module.exports = { handleCronUpdateStats };
