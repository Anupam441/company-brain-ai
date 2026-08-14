const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const { signup, login, verifyOtp, toggleTwoFactor } = require('../controllers/authController');
router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.patch('/two-factor', protect, toggleTwoFactor);
module.exports = router;
