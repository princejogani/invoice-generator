const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, updateUserProfile, adminCreateUser, getAllUsers, adminUpdateUser, getUserById } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/create-user', protect, admin, adminCreateUser);
router.get('/users', protect, admin, getAllUsers);
router.get('/user/:id', protect, admin, getUserById);
router.put('/user/:id', protect, admin, adminUpdateUser);

module.exports = router;
