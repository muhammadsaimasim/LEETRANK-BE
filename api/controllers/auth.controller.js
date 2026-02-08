const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { fetchLeetCodeStats, validateLeetCodeUsername } = require('../../utils/leetcodeService');

// Register a new user
const register = async (req, res) => {
    try {
        const { name, email, password, leetcodeUsername, leetcodeProfileURL, batch, department } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { leetcodeUsername }] 
        });
        
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ 
                    success: false,
                    message: 'User with this email already exists' 
                });
            }
            if (existingUser.leetcodeUsername === leetcodeUsername) {
                return res.status(400).json({ 
                    success: false,
                    message: 'This LeetCode username is already registered' 
                });
            }
        }

        // Validate LeetCode username
        const isValidLeetCode = await validateLeetCodeUsername(leetcodeUsername);
        if (!isValidLeetCode) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid LeetCode username or profile not found' 
            });
        }

        // Fetch initial LeetCode stats
        const leetcodeStats = await fetchLeetCodeStats(leetcodeUsername);

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            leetcodeUsername,
            leetcodeProfileURL,
            batch,
            department: department || 'Computer Science',
            stats: leetcodeStats
        });

        await newUser.save();

        // Create JWT token
        const token = jwt.sign(
            { userId: newUser._id, email: newUser.email, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({ 
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                leetcodeUsername: newUser.leetcodeUsername,
                batch: newUser.batch,
                department: newUser.department
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during registration', 
            error: error.message 
        });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                leetcodeUsername: user.leetcodeUsername,
                batch: user.batch,
                department: user.department,
                stats: user.stats
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during login', 
            error: error.message 
        });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Get user
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: 'Current password is incorrect' 
            });
        }

        // Check if new password is same as current
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ 
                success: false,
                message: 'New password must be different from current password' 
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ 
            success: true,
            message: 'Password changed successfully' 
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while changing password', 
            error: error.message 
        });
    }
};

// Verify token (useful for frontend to check if token is still valid)
const verifyToken = async (req, res) => {
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
            message: 'Token is valid',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                leetcodeUsername: user.leetcodeUsername,
                batch: user.batch,
                department: user.department
            }
        });
    } catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

module.exports = {
    register,
    login,
    changePassword,
    verifyToken
};