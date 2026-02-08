const { body, param, query, validationResult } = require('express-validator');
const { ROLESENUM } = require('../../utils/ENUM');

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

// Update profile validation
const validateUpdateProfile = [
    body('name')
        .optional()
        .trim()
        .notEmpty().withMessage('Name cannot be empty')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
    
    body('batch')
        .optional()
        .trim()
        .notEmpty().withMessage('Batch cannot be empty')
        .matches(/^(19|20)\d{2}$/).withMessage('Batch must be a valid year (e.g., 2024)'),
    
    body('department')
        .optional()
        .trim()
        .notEmpty().withMessage('Department cannot be empty')
        .isLength({ min: 2, max: 100 }).withMessage('Department must be between 2 and 100 characters'),
    
    // Ensure at least one field is provided
    body()
        .custom((value, { req }) => {
            const { name, batch, department } = req.body;
            if (!name && !batch && !department) {
                throw new Error('At least one field (name, batch, or department) must be provided');
            }
            return true;
        }),
    
    handleValidationErrors
];

// Update LeetCode info validation
const validateUpdateLeetCodeInfo = [
    body('leetcodeUsername')
        .optional()
        .trim()
        .notEmpty().withMessage('LeetCode username cannot be empty')
        .isLength({ min: 1, max: 50 }).withMessage('LeetCode username must be between 1 and 50 characters')
        .matches(/^[a-zA-Z0-9_-]+$/).withMessage('LeetCode username can only contain letters, numbers, hyphens, and underscores'),
    
    body('leetcodeProfileURL')
        .optional()
        .trim()
        .notEmpty().withMessage('LeetCode profile URL cannot be empty')
        .isURL().withMessage('Please provide a valid URL')
        .custom((value) => {
            if (!value.includes('leetcode.com')) {
                throw new Error('URL must be a valid LeetCode profile URL');
            }
            return true;
        }),
    
    // Ensure at least one field is provided
    body()
        .custom((value, { req }) => {
            const { leetcodeUsername, leetcodeProfileURL } = req.body;
            if (!leetcodeUsername && !leetcodeProfileURL) {
                throw new Error('At least one field (leetcodeUsername or leetcodeProfileURL) must be provided');
            }
            return true;
        }),
    
    handleValidationErrors
];

// Delete account validation
const validateDeleteAccount = [
    body('password')
        .notEmpty().withMessage('Password is required to delete account'),
    
    handleValidationErrors
];

// User ID parameter validation
const validateUserId = [
    param('id')
        .notEmpty().withMessage('User ID is required')
        .isMongoId().withMessage('Invalid user ID format'),
    
    handleValidationErrors
];

// Update user role validation (Admin only)
const validateUpdateUserRole = [
    param('id')
        .notEmpty().withMessage('User ID is required')
        .isMongoId().withMessage('Invalid user ID format'),
    
    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(Object.values(ROLESENUM)).withMessage(`Role must be one of: ${Object.values(ROLESENUM).join(', ')}`),
    
    handleValidationErrors
];

// Get all users query validation (Admin only)
const validateGetAllUsers = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    
    query('batch')
        .optional()
        .trim()
        .matches(/^(19|20)\d{2}$/).withMessage('Batch must be a valid year (e.g., 2024)'),
    
    query('department')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Department must be between 2 and 100 characters'),
    
    query('role')
        .optional()
        .isIn(Object.values(ROLESENUM)).withMessage(`Role must be one of: ${Object.values(ROLESENUM).join(', ')}`),
    
    handleValidationErrors
];

module.exports = {
    validateUpdateProfile,
    validateUpdateLeetCodeInfo,
    validateDeleteAccount,
    validateUserId,
    validateUpdateUserRole,
    validateGetAllUsers
};