const User = require('../models/user.model');
const { fetchLeetCodeStats, validateLeetCodeUsername } = require('../../utils/leetcodeService');

// Get user profile (own profile)
const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        res.status(200).json({ 
            success: true,
            user 
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Get user by ID (public profile view)
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        res.status(200).json({ 
            success: true,
            user 
        });
    } catch (error) {
        console.error('Get user error:', error);
        
        // Handle invalid ObjectId format
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid user ID format' 
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Update user profile (name, batch, department only - not leetcode info)
const updateProfile = async (req, res) => {
    try {
        const { name, batch, department } = req.body;
        
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Update only allowed fields
        if (name !== undefined) user.name = name;
        if (batch !== undefined) user.batch = batch;
        if (department !== undefined) user.department = department;

        await user.save();

        res.status(200).json({ 
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                batch: user.batch,
                department: user.department,
                leetcodeUsername: user.leetcodeUsername,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to update profile', 
            error: error.message 
        });
    }
};

// Update LeetCode credentials (username and profile URL)
const updateLeetCodeInfo = async (req, res) => {
    try {
        const { leetcodeUsername, leetcodeProfileURL } = req.body;
        
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Check if new username is already taken by another user
        if (leetcodeUsername && leetcodeUsername !== user.leetcodeUsername) {
            const existingUser = await User.findOne({ 
                leetcodeUsername,
                _id: { $ne: user._id }
            });
            
            if (existingUser) {
                return res.status(400).json({ 
                    success: false,
                    message: 'This LeetCode username is already registered by another user' 
                });
            }

            // Validate new LeetCode username
            const isValid = await validateLeetCodeUsername(leetcodeUsername);
            if (!isValid) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid LeetCode username or profile not found' 
                });
            }

            user.leetcodeUsername = leetcodeUsername;
            
            // Fetch and update stats for new username
            const leetcodeStats = await fetchLeetCodeStats(leetcodeUsername);
            user.stats = leetcodeStats;
        }

        if (leetcodeProfileURL !== undefined) {
            user.leetcodeProfileURL = leetcodeProfileURL;
        }

        await user.save();

        res.status(200).json({ 
            success: true,
            message: 'LeetCode information updated successfully',
            user: {
                leetcodeUsername: user.leetcodeUsername,
                leetcodeProfileURL: user.leetcodeProfileURL,
                stats: user.stats
            }
        });
    } catch (error) {
        console.error('Update LeetCode info error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to update LeetCode information', 
            error: error.message 
        });
    }
};

// Update user's LeetCode stats manually (sync with LeetCode)
const syncLeetCodeStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Fetch latest LeetCode stats
        const leetcodeStats = await fetchLeetCodeStats(user.leetcodeUsername);
        
        user.stats = leetcodeStats;
        await user.save();

        res.status(200).json({ 
            success: true,
            message: 'Stats synced successfully',
            stats: user.stats
        });
    } catch (error) {
        console.error('Sync stats error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to sync stats', 
            error: error.message 
        });
    }
};

// Get all users (Admin only - for management)
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 50, batch, department, role } = req.query;

        const filter = {};
        if (batch) filter.batch = batch;
        if (department) filter.department = department;
        if (role) filter.role = role;

        const users = await User.find(filter)
            .select('-password')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(filter);

        res.status(200).json({
            success: true,
            users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Delete user account (own account)
const deleteMyAccount = async (req, res) => {
    try {
        const { password } = req.body;

        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Verify password before deletion
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: 'Incorrect password' 
            });
        }

        await User.findByIdAndDelete(req.user.userId);

        res.status(200).json({ 
            success: true,
            message: 'Account deleted successfully' 
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to delete account', 
            error: error.message 
        });
    }
};

// Admin: Delete user by ID
const deleteUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Prevent deleting other admins
        if (user.role === 'admin' && req.user.userId !== user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                message: 'Cannot delete another admin account' 
            });
        }

        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({ 
            success: true,
            message: 'User deleted successfully' 
        });
    } catch (error) {
        console.error('Delete user error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid user ID format' 
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'Failed to delete user', 
            error: error.message 
        });
    }
};

// Admin: Update user role
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const { id } = req.params;

        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Prevent changing own role
        if (user._id.toString() === req.user.userId) {
            return res.status(403).json({ 
                success: false,
                message: 'You cannot change your own role' 
            });
        }

        user.role = role;
        await user.save();

        res.status(200).json({ 
            success: true,
            message: 'User role updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to update user role', 
            error: error.message 
        });
    }
};

module.exports = {
    getMyProfile,
    getUserById,
    updateProfile,
    updateLeetCodeInfo,
    syncLeetCodeStats,
    getAllUsers,
    deleteMyAccount,
    deleteUserById,
    updateUserRole
};