/**
 * Custom Error Classes for better error handling
 */

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
        this.name = 'ValidationError';
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401);
        this.name = 'AuthenticationError';
    }
}

class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403);
        this.name = 'AuthorizationError';
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409);
        this.name = 'ConflictError';
    }
}

// class RateLimitError extends AppError {
//     constructor(message = 'Too many requests') {
//         super(message, 429);
//         this.name = 'RateLimitError';
//     }
// }

/**
 * Async handler wrapper to catch errors in async route handlers
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Send error response
 */
const sendErrorResponse = (res, error, statusCode = 500) => {
    return res.status(statusCode).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { 
            stack: error.stack,
            error: error 
        })
    });
};

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    catchAsync,
    sendErrorResponse
};