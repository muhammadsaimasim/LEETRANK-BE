const express = require('express');
const router = express.Router();
const { 
    register, 
    signupVerification,
    login, 
    changePassword,
    verifyToken,
    sendResetPasswordOTP,
    resetPassword,
    resendOTP,
} = require('../controllers/auth.controller');
const { authMiddleware } = require('../middlewares/isAuth');
const { 
    validateRegister, 
    validateLogin, 
    validateChangePassword,
    validateVerifyOTP,
    validateForgotPassword,
    validateResetPassword,
    validateResendOTP,
} = require('../middlewares/authValidation');

// Public routes
router.post('/signup', validateRegister, register);
router.post('/signup-verification', validateVerifyOTP, signupVerification);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validateForgotPassword, sendResetPasswordOTP);
router.post('/reset-password', validateResetPassword, resetPassword);
router.post('/resend-otp', validateResendOTP, resendOTP);

// Protected routes
router.post('/change-password', authMiddleware, validateChangePassword, changePassword);
router.get('/verify', authMiddleware, verifyToken);

module.exports = router;