const axios = require('axios');

const LEETCODE_GRAPHQL_API = 'https://leetcode.com/graphql';

/**
 * Fetch LeetCode user stats using official GraphQL API
 * @param {string} username - LeetCode username
 * @returns {Promise<Object>} User stats object
 */
const fetchLeetCodeStats = async (username) => {
    try {
        const query = `
            query getUserProfile($username: String!) {
                matchedUser(username: $username) {
                    username
                    submitStats {
                        acSubmissionNum {
                            difficulty
                            count
                        }
                    }
                    profile {
                        ranking
                    }
                }
            }
        `;

        const response = await axios.post(
            LEETCODE_GRAPHQL_API,
            {
                query: query,
                variables: { username: username }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Referer': 'https://leetcode.com'
                }
            }
        );

        // Check if user exists
        if (!response.data || !response.data.data || !response.data.data.matchedUser) {
            throw new Error('User not found');
        }

        const userData = response.data.data.matchedUser;
        const submissions = userData.submitStats.acSubmissionNum;

        // Parse submission stats by difficulty
        let totalSolved = 0;
        let easy = 0;
        let medium = 0;
        let hard = 0;

        submissions.forEach(item => {
            if (item.difficulty === 'All') {
                totalSolved = item.count;
            } else if (item.difficulty === 'Easy') {
                easy = item.count;
            } else if (item.difficulty === 'Medium') {
                medium = item.count;
            } else if (item.difficulty === 'Hard') {
                hard = item.count;
            }
        });

        return {
            totalSolved: totalSolved || 0,
            easy: easy || 0,
            medium: medium || 0,
            hard: hard || 0,
            ranking: userData.profile?.ranking || null,
            lastUpdated: new Date()
        };
    } catch (error) {
        console.error(`Error fetching LeetCode stats for ${username}:`, error.message);
        
        if (error.response) {
            console.error('API Response Error:', error.response.data);
        }
        
        throw new Error('Failed to fetch LeetCode statistics');
    }
};

/**
 * Validate if a LeetCode username exists
 * @param {string} username - LeetCode username
 * @returns {Promise<boolean>} True if user exists
 */
const validateLeetCodeUsername = async (username) => {
    try {
        await fetchLeetCodeStats(username);
        return true;
    } catch (error) {
        return false;
    }
};

module.exports = {
    fetchLeetCodeStats,
    validateLeetCodeUsername
};