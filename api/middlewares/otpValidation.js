const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path || err.param,
                message: err.msg
            }))
        });
    }
    next();
};

const validateSendSignupOTP = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),

    body('leetcodeUsername')
        .trim()
        .notEmpty().withMessage('LeetCode username is required'),

    body('leetcodeProfileURL')
        .trim()
        .notEmpty().withMessage('LeetCode profile URL is required')
        .isURL().withMessage('Please provide a valid URL'),

    body('batch')
        .trim()
        .notEmpty().withMessage('Batch is required'),

    handleValidationErrors
];

const validateVerifyOTP = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('otp')
        .trim()
        .notEmpty().withMessage('OTP is required')
        .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
        .isNumeric().withMessage('OTP must contain only numbers'),

    handleValidationErrors
];

const validateForgotPassword = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),

    handleValidationErrors
];

const validateResetPassword = [
    body('resetToken')
        .trim()
        .notEmpty().withMessage('Reset token is required'),

    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters'),

    handleValidationErrors
];

module.exports = {
    validateSendSignupOTP,
    validateVerifyOTP,
    validateForgotPassword,
    validateResetPassword
};
