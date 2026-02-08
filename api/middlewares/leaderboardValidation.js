const { query, validationResult } = require('express-validator');

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

// Get leaderboard validation
const validateGetLeaderboard = [
    query('batch')
        .optional()
        .trim()
        .matches(/^(19|20)\d{2}$/).withMessage('Batch must be a valid year (e.g., 2024)'),
    
    query('department')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Department must be between 2 and 100 characters'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 500 }).withMessage('Limit must be between 1 and 500'),
    
    query('sortBy')
        .optional()
        .isIn(['totalSolved', 'easy', 'medium', 'hard', 'ranking'])
        .withMessage('sortBy must be one of: totalSolved, easy, medium, hard, ranking'),
    
    handleValidationErrors
];

// Get top performers validation
const validateGetTopPerformers = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    
    handleValidationErrors
];

module.exports = {
    validateGetLeaderboard,
    validateGetTopPerformers
};