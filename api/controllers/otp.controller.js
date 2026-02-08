const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const OTP = require('../models/otp.model');
const User = require('../models/user.model');
const { sendOTPEmail } = require('../../utils/emailService');
const { fetchLeetCodeStats, validateLeetCodeUsername } = require('../../utils/leetcodeService');

const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

const OTP_EXPIRY_MINUTES = 10;

// ─── Signup OTP Flow ──────────────────────────────────

const sendSignupOTP = async (req, res) => {
    try {
        const { name, email, password, leetcodeUsername, leetcodeProfileURL, batch, department } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { leetcodeUsername }]
        });

        if (existingUser) {
            if (existingUser.email === email.toLowerCase()) {
                return res.status(400).json({ success: false, message: 'User with this email already exists' });
            }
            if (existingUser.leetcodeUsername === leetcodeUsername) {
                return res.status(400).json({ success: false, message: 'This LeetCode username is already registered' });
            }
        }

        // Validate LeetCode username
        const isValidLeetCode = await validateLeetCodeUsername(leetcodeUsername);
        if (!isValidLeetCode) {
            return res.status(400).json({ success: false, message: 'Invalid LeetCode username or profile not found' });
        }

        // Delete any previous OTPs for this email + type
        await OTP.deleteMany({ email: email.toLowerCase(), type: 'signup' });

        // Generate OTP
        const otp = generateOTP();
        const salt = await bcrypt.genSalt(10);
        const hashedOTP = await bcrypt.hash(otp, salt);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Store OTP + registration data
        await OTP.create({
            email: email.toLowerCase(),
            otp: hashedOTP,
            type: 'signup',
            registrationData: {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                leetcodeUsername,
                leetcodeProfileURL,
                batch,
                department: department || 'Computer Science',
            },
            expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
        });

        // Send OTP email
        await sendOTPEmail(email, otp, 'signup');

        res.status(200).json({
            success: true,
            message: 'OTP sent to your email. Please verify to complete registration.',
        });
    } catch (error) {
        console.error('Send signup OTP error:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
    }
};

const verifySignupOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Find the OTP record
        const otpRecord = await OTP.findOne({
            email: email.toLowerCase(),
            type: 'signup',
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

        // Check again that user doesn't exist (race condition)
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }

        // Fetch LeetCode stats
        const data = otpRecord.registrationData;
        let leetcodeStats = {};
        try {
            leetcodeStats = await fetchLeetCodeStats(data.leetcodeUsername);
        } catch (e) {
            console.error('Could not fetch initial stats:', e.message);
        }

        // Create user
        const newUser = new User({
            name: data.name,
            email: data.email,
            password: data.password, // already hashed
            leetcodeUsername: data.leetcodeUsername,
            leetcodeProfileURL: data.leetcodeProfileURL,
            batch: data.batch,
            department: data.department,
            stats: leetcodeStats,
        });

        await newUser.save();

        // Cleanup OTP
        await OTP.deleteOne({ _id: otpRecord._id });

        // Create JWT
        const token = jwt.sign(
            { userId: newUser._id, email: newUser.email, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Email verified and account created successfully',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                leetcodeUsername: newUser.leetcodeUsername,
                leetcodeProfileURL: newUser.leetcodeProfileURL,
                batch: newUser.batch,
                department: newUser.department,
                stats: newUser.stats,
            },
        });
    } catch (error) {
        console.error('Verify signup OTP error:', error);
        res.status(500).json({ success: false, message: 'Failed to verify OTP', error: error.message });
    }
};

// ─── Forgot Password OTP Flow ─────────────────────────

const sendForgotPasswordOTP = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
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
        const salt = await bcrypt.genSalt(10);
        const hashedOTP = await bcrypt.hash(otp, salt);

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
        console.error('Send forgot password OTP error:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
    }
};

const verifyForgotPasswordOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

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

        const isMatch = await bcrypt.compare(otp, otpRecord.otp);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        // Generate a one-time reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedResetToken = await bcrypt.hash(resetToken, 10);

        // Mark verified and store reset token
        otpRecord.verified = true;
        otpRecord.resetToken = hashedResetToken;
        otpRecord.expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min for reset
        await otpRecord.save();

        res.status(200).json({
            success: true,
            message: 'OTP verified. Use the reset token to set a new password.',
            resetToken,
        });
    } catch (error) {
        console.error('Verify forgot password OTP error:', error);
        res.status(500).json({ success: false, message: 'Failed to verify OTP', error: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        // Find a verified forgot-password OTP with a reset token
        const otpRecords = await OTP.find({
            type: 'forgot-password',
            verified: true,
            resetToken: { $ne: null },
        });

        let matchedRecord = null;
        for (const record of otpRecords) {
            const isMatch = await bcrypt.compare(resetToken, record.resetToken);
            if (isMatch) {
                matchedRecord = record;
                break;
            }
        }

        if (!matchedRecord) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        if (new Date() > matchedRecord.expiresAt) {
            await OTP.deleteOne({ _id: matchedRecord._id });
            return res.status(400).json({ success: false, message: 'Reset token has expired. Please start over.' });
        }

        // Find user and update password
        const user = await User.findOne({ email: matchedRecord.email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        // Cleanup
        await OTP.deleteOne({ _id: matchedRecord._id });

        res.status(200).json({
            success: true,
            message: 'Password reset successfully. You can now log in with your new password.',
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
    }
};

// ─── Resend OTP ───────────────────────────────────────

const resendOTP = async (req, res) => {
    try {
        const { email, type } = req.body;

        if (!['signup', 'forgot-password'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid OTP type' });
        }

        // For signup, find existing OTP record with registration data
        const existingRecord = await OTP.findOne({
            email: email.toLowerCase(),
            type,
            verified: false,
        });

        if (type === 'signup' && !existingRecord) {
            return res.status(400).json({ success: false, message: 'No pending registration found. Please register again.' });
        }

        if (type === 'forgot-password') {
            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.status(200).json({ success: true, message: 'If an account exists, a new OTP has been sent.' });
            }
        }

        // Generate new OTP
        const otp = generateOTP();
        const salt = await bcrypt.genSalt(10);
        const hashedOTP = await bcrypt.hash(otp, salt);

        if (existingRecord) {
            existingRecord.otp = hashedOTP;
            existingRecord.expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
            existingRecord.verified = false;
            existingRecord.resetToken = null;
            await existingRecord.save();
        } else {
            await OTP.deleteMany({ email: email.toLowerCase(), type });
            await OTP.create({
                email: email.toLowerCase(),
                otp: hashedOTP,
                type,
                expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
            });
        }

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
    sendSignupOTP,
    verifySignupOTP,
    sendForgotPasswordOTP,
    verifyForgotPasswordOTP,
    resetPassword,
    resendOTP,
};
