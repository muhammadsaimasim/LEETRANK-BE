const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    changePassword,
    verifyToken
} = require('../controllers/auth.controller');
const { authMiddleware } = require('../middlewares/isAuth');
const { 
    validateRegister, 
    validateLogin, 
    validateChangePassword 
} = require('../middlewares/authValidation');

// Public routes
router.post('/signup', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.post('/change-password', authMiddleware, validateChangePassword, changePassword);
router.get('/verify', authMiddleware, verifyToken);

module.exports = router;