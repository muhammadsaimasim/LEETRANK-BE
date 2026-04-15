const { updateAllUsersStats } = require('../../utils/cronjobs');

/**
 * Vercel Cron handler - updates all users' LeetCode stats.
 * Secured by CRON_SECRET to prevent unauthorized access.
 */
const handleCronUpdateStats = async (req, res) => {
    try {
        // Verify the request is from the authorized scheduler
        const cronSecret = process.env.CRON_SECRET;
        if (!cronSecret) {
            console.error('CRON_SECRET env var is not set');
            return res.status(500).json({ success: false, message: 'Server misconfiguration' });
        }
        const authHeader = req.headers['authorization'];
        if (authHeader !== `Bearer ${cronSecret}`) {
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
