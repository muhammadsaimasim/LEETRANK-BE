const { body, validationResult } = require('express-validator');

// Validation error handler
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

// Register validation rules
const validateRegister = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail()
        .isLength({ max: 255 }).withMessage('Email is too long'),
    
    // body('password')
    //     .notEmpty().withMessage('Password is required')
    //     .isLength({ min: 6, max: 128 }).withMessage('Password must be between 6 and 128 characters')
    //     .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    //     .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'),
    
    body('leetcodeUsername')
        .trim()
        .notEmpty().withMessage('LeetCode username is required')
        .isLength({ min: 1, max: 50 }).withMessage('LeetCode username must be between 1 and 50 characters')
        .matches(/^[a-zA-Z0-9_-]+$/).withMessage('LeetCode username can only contain letters, numbers, hyphens, and underscores'),
    
    body('leetcodeProfileURL')
        .trim()
        .notEmpty().withMessage('LeetCode profile URL is required')
        .isURL().withMessage('Please provide a valid URL')
        .custom((value) => {
            if (!value.includes('leetcode.com')) {
                throw new Error('URL must be a valid LeetCode profile URL');
            }
            return true;
        }),
    
    body('batch')
        .trim()
        .notEmpty().withMessage('Batch is required')
        .matches(/^(19|20)\d{2}$/).withMessage('Batch must be a valid year (e.g., 2024)'),
    
    body('department')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Department must be between 2 and 100 characters'),
    
    handleValidationErrors
];

// Login validation rules
const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required'),
    
    handleValidationErrors
];

// Change password validation rules
const validateChangePassword = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),
    
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8, max: 128 }).withMessage('New password must be between 8 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)')
        .custom((value, { req }) => {
            if (value === req.body.currentPassword) {
                throw new Error('New password must be different from current password');
            }
            return true;
        }),
    
    handleValidationErrors
];

module.exports = {
    validateRegister,
    validateLogin,
    validateChangePassword
};