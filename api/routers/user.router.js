const express = require('express');
const router = express.Router();
const { 
    getMyProfile,
    getUserById,
    updateProfile,
    updateLeetCodeInfo,
    syncLeetCodeStats,
    getAllUsers,
    deleteMyAccount,
    deleteUserById,
    updateUserRole
} = require('../controllers/user.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/isAuth');
const { 
    validateUpdateProfile,
    validateUpdateLeetCodeInfo,
    validateDeleteAccount,
    validateUserId,
    validateUpdateUserRole,
    validateGetAllUsers
} = require('../middlewares/userValidation');

// Admin only routes
router.get('/', authMiddleware, adminMiddleware, validateGetAllUsers, getAllUsers);

// Protected routes (authenticated users)
router.get('/profile/me', authMiddleware, getMyProfile);
router.put('/profile/update', authMiddleware, validateUpdateProfile, updateProfile);
router.put('/leetcode/update', authMiddleware, validateUpdateLeetCodeInfo, updateLeetCodeInfo);
router.post('/stats/sync', authMiddleware, syncLeetCodeStats);
router.delete('/account/delete', authMiddleware, validateDeleteAccount, deleteMyAccount);

// Public routes (keep /:id LAST so it doesn't match named routes like /profile)
router.get('/:id', validateUserId, getUserById);

// Admin only routes (with :id param)
router.delete('/:id', authMiddleware, adminMiddleware, validateUserId, deleteUserById);
router.put('/:id/role', authMiddleware, adminMiddleware, validateUpdateUserRole, updateUserRole);

module.exports = router;