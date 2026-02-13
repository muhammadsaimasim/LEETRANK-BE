const crypto = require('crypto');
const User = require('../models/user.model');
const OTP = require('../models/otp.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { fetchLeetCodeStats, validateLeetCodeUsername } = require('../../utils/leetcodeService');
const { sendOTPEmail } = require('../../utils/emailService');

const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

const OTP_EXPIRY_MINUTES = 10;

// ─── Signup ───────────────────────────────────────────
// Admin → creates user with isVerified: true, returns token immediately
// Student → validates LeetCode, creates user with isVerified: false, sends OTP
const register = async (req, res) => {
    try {
        const { name, email, password, role, leetcodeUsername, leetcodeProfileURL, batch, department } = req.body;
        const isAdmin = role === 'admin';

        // Check if a verified user already exists with this email
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        
        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({ 
                success: false,
                message: 'User with this email already exists' 
            });
        }

        const existingUsername = await User.findOne({leetcodeUsername: leetcodeUsername});

        if(existingUsername){
            return res.status(400).json({
                success: false,
                message: 'User with this leetcode username already exists'
            })
        }

        if (!isAdmin && leetcodeUsername) {
            const lcExists = await User.findOne({ 
                leetcodeUsername, 
                isVerified: true 
            });
            if (lcExists) {
                return res.status(400).json({ 
                    success: false,
                    message: 'This LeetCode username is already registered' 
                });
            }
        }

        let leetcodeStats = {};

        // Only validate LeetCode for non-admin users
        if (!isAdmin) {
            const isValidLeetCode = await validateLeetCodeUsername(leetcodeUsername);
            if (!isValidLeetCode) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid LeetCode username or profile not found' 
                });
            }
            try {
                leetcodeStats = await fetchLeetCodeStats(leetcodeUsername);
            } catch (e) {
                console.error('Could not fetch initial stats:', e.message);
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Build user data
        const userData = {
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: isAdmin ? 'admin' : 'student',
            isVerified: isAdmin ? true : false,
        };

        // Add student-specific fields only for non-admin
        if (!isAdmin) {
            userData.leetcodeUsername = leetcodeUsername;
            userData.leetcodeProfileURL = leetcodeProfileURL;
            userData.batch = batch;
            userData.department = department || 'Computer Science';
            userData.stats = leetcodeStats;
        }

        let user;

        if (existingUser && !existingUser.isVerified) {
            // Update existing unverified user with new data
            Object.assign(existingUser, userData);
            await existingUser.save();
            user = existingUser;
        } else {
            // Create new user
            user = new User(userData);
            await user.save();
        }

        // ── Admin: return token immediately ──
        if (isAdmin) {
            const token = jwt.sign(
                { userId: user._id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            return res.status(201).json({ 
                success: true,
                message: 'Admin registered successfully',
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                }
            });
        }

        // ── Student: send OTP for email verification ──
        await OTP.deleteMany({ email: email.toLowerCase(), type: 'signup' });

        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);

        await OTP.create({
            email: email.toLowerCase(),
            otp: hashedOTP,
            type: 'signup',
            expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
        });

        await sendOTPEmail(email, otp, 'signup');

        res.status(201).json({ 
            success: true,
            message: 'OTP sent to your email. Please verify to complete registration.',
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

// ─── Signup Verification ──────────────────────────────
// Verifies the OTP and sets isVerified = true, returns JWT
const signupVerification = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Find the OTP record
        const otpRecord = await OTP.findOne({
            email: email.toLowerCase(),
            type: 'signup',
            verified: false,
        });

        if (!otpRecord) {
            return res.status(400).json({ 
                success: false, 
                message: 'OTP not found or expired. Please request a new one.' 
            });
        }

        if (new Date() > otpRecord.expiresAt) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ 
                success: false, 
                message: 'OTP has expired. Please request a new one.' 
            });
        }

        // Verify OTP (hashed comparison)
        const isMatch = await bcrypt.compare(otp, otpRecord.otp);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        // Find the user and mark as verified
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.isVerified = true;
        await user.save();

        // Cleanup OTP
        await OTP.deleteOne({ _id: otpRecord._id });

        // Create JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'Email verified and account activated successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                leetcodeUsername: user.leetcodeUsername,
                leetcodeProfileURL: user.leetcodeProfileURL,
                batch: user.batch,
                department: user.department,
                stats: user.stats,
            },
        });
    } catch (error) {
        console.error('Signup verification error:', error);
        res.status(500).json({ success: false, message: 'Failed to verify OTP', error: error.message });
    }
};

// ─── Login ────────────────────────────────────────────
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

        // Check if user is verified
        if (!user.isVerified) {
            return res.status(403).json({ 
                success: false,
                message: 'Please verify your email before logging in. Check your inbox for the OTP.' 
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
                department: user.department,
                stats: user.stats
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

// ─── Send Reset Password OTP ─────────────────────────
const sendResetPasswordOTP = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email: email.toLowerCase(), isVerified: true });
        if (!user) {
            // Don't reveal if user exists — always respond success
            return res.status(200).json({
                success: true,
                message: 'If an account with that email exists, an OTP has been sent.',
            });
        }

        // Delete previous OTPs
        await OTP.deleteMany({ email: email.toLowerCase(), type: 'forgot-password' });

        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);

        await OTP.create({
            email: email.toLowerCase(),
            otp: hashedOTP,
            type: 'forgot-password',
            expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
        });

        await sendOTPEmail(email, otp, 'forgot-password');

        res.status(200).json({
            success: true,
            message: 'If an account with that email exists, an OTP has been sent.',
        });
    } catch (error) {
        console.error('Send reset password OTP error:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
    }
};

// ─── Reset Password ──────────────────────────────────
// Takes email + otp + newPassword in a single call
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Find the OTP record
        const otpRecord = await OTP.findOne({
            email: email.toLowerCase(),
            type: 'forgot-password',
            verified: false,
        });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'OTP not found or expired. Please request a new one.' });
        }

        if (new Date() > otpRecord.expiresAt) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        // Verify OTP
        const isMatch = await bcrypt.compare(otp, otpRecord.otp);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        // Find user and update password
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        // Cleanup OTP
        await OTP.deleteOne({ _id: otpRecord._id });

        res.status(200).json({
            success: true,
            message: 'Password reset successfully. You can now log in with your new password.',
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
    }
};

// ─── Resend OTP ──────────────────────────────────────
const resendOTP = async (req, res) => {
    try {
        const { email, type } = req.body;

        if (!['signup', 'forgot-password'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid OTP type' });
        }

        if (type === 'signup') {
            // For signup, user must exist and be unverified
            const user = await User.findOne({ email: email.toLowerCase(), isVerified: false });
            if (!user) {
                return res.status(400).json({ success: false, message: 'No pending registration found. Please register again.' });
            }
        }

        if (type === 'forgot-password') {
            const user = await User.findOne({ email: email.toLowerCase(), isVerified: true });
            if (!user) {
                return res.status(200).json({ success: true, message: 'If an account exists, a new OTP has been sent.' });
            }
        }

        // Delete old OTPs and generate new one
        await OTP.deleteMany({ email: email.toLowerCase(), type });

        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);

        await OTP.create({
            email: email.toLowerCase(),
            otp: hashedOTP,
            type,
            expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
        });

        await sendOTPEmail(email, otp, type);

        res.status(200).json({
            success: true,
            message: 'A new OTP has been sent to your email.',
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ success: false, message: 'Failed to resend OTP', error: error.message });
    }
};

module.exports = {
    register,
    signupVerification,
    login,
    changePassword,
    verifyToken,
    sendResetPasswordOTP,
    resetPassword,
    resendOTP,
};