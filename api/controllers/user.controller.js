const User = require('../models/user.model');
const { fetchLeetCodeStats, validateLeetCodeUsername } = require('../../utils/leetcodeService');

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

const updateProfile = async (req, res) => {
    try {
        const { name, batch, rollno } = req.body;
        
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (batch !== undefined) updateFields.batch = batch;

        if (rollno) {
            const upperRollno = rollno.toUpperCase();
            const existing = await User.findOne({ rollno: upperRollno, _id: { $ne: user._id } });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'This roll number is already registered'
                });
            }
            updateFields.rollno = upperRollno;
            const prefix = upperRollno.split('-')[0];
            const { PROGRAMME_MAP } = require('../../utils/ENUM');
            updateFields.programme = PROGRAMME_MAP[prefix] || '';
        }

        const options = { new: true };
        if (rollno !== undefined) {
            options.runValidators = true;
        }

        const updatedUser = await User.findByIdAndUpdate(req.user.userId, updateFields, options);

        res.status(200).json({ 
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                batch: updatedUser.batch,
                department: updatedUser.department,
                rollno: updatedUser.rollno,
                programme: updatedUser.programme,
                leetcodeUsername: updatedUser.leetcodeUsername,
                role: updatedUser.role
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

            const isValid = await validateLeetCodeUsername(leetcodeUsername);
            if (!isValid) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid LeetCode username or profile not found' 
                });
            }

            user.leetcodeUsername = leetcodeUsername;
            
            const leetcodeStats = await fetchLeetCodeStats(leetcodeUsername);
            user.stats = leetcodeStats;
        }

        if (leetcodeProfileURL !== undefined) {
            user.leetcodeProfileURL = leetcodeProfileURL;
        }

        await await User.findByIdAndUpdate(req.user.userId, {
                        leetcodeUsername: user.leetcodeUsername,
                        leetcodeProfileURL: user.leetcodeProfileURL,
                        stats: user.stats
                    }, { new: true });

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

const syncLeetCodeStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        const leetcodeStats = await fetchLeetCodeStats(user.leetcodeUsername);
        
        user.stats = leetcodeStats;
        await User.findByIdAndUpdate(req.user.userId, { stats: leetcodeStats }, { new: true });

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

const deleteUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

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

        if (user._id.toString() === req.user.userId) {
            return res.status(403).json({ 
                success: false,
                message: 'You cannot change your own role' 
            });
        }

        user.role = role;
        // await user.findByIdAndUpdate();
        await User.findByIdAndUpdate(id, { role }, { new: true });

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