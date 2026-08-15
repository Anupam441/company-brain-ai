const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const {
  signup, login, verifyOtp, toggleTwoFactor, updateProfile, changePassword,
  forgotPassword, resetPassword
} = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.patch('/two-factor', protect, toggleTwoFactor);
router.patch('/profile', protect, updateProfile);
router.patch('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
