const express = require('express');
const router = express.Router();
const {
    sendSignupOTP,
    verifySignupOTP,
    sendForgotPasswordOTP,
    verifyForgotPasswordOTP,
    resetPassword,
    resendOTP,
} = require('../controllers/otp.controller');
const {
    validateSendSignupOTP,
    validateVerifyOTP,
    validateForgotPassword,
    validateResetPassword,
} = require('../middlewares/otpValidation');

// Signup OTP flow
router.post('/send-signup-otp', validateSendSignupOTP, sendSignupOTP);
router.post('/verify-signup-otp', validateVerifyOTP, verifySignupOTP);

// Forgot password OTP flow
router.post('/forgot-password', validateForgotPassword, sendForgotPasswordOTP);
router.post('/verify-forgot-otp', validateVerifyOTP, verifyForgotPasswordOTP);
router.post('/reset-password', validateResetPassword, resetPassword);

// Resend OTP (works for both flows)
router.post('/resend', resendOTP);

module.exports = router;
