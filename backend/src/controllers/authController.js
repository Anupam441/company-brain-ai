const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
// SIGNUP
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword
    });
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        twoFactorEnabled: newUser.twoFactorEnabled
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Signup failed', error: error.message });
  }
};
// LOGIN (step 1: password check)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    // If 2FA is enabled, send OTP instead of logging in directly
    if (user.twoFactorEnabled) {
      const otp = generateOtp();
      user.otpCode = otp;
      user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      await user.save();
      // DEMO MODE: In production this would be emailed/texted, not returned in the response.
      return res.status(200).json({
        requiresOtp: true,
        message: 'Verification code sent',
        demoOtp: otp,
        email: user.email
      });
    }
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};
// VERIFY OTP (step 2)
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid request' });
    }
    if (!user.otpCode || user.otpCode !== otp) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    if (user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code expired. Please login again.' });
    }
    user.otpCode = null;
    user.otpExpires = null;
    await user.save();
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
};
// TOGGLE 2FA (from settings)
exports.toggleTwoFactor = async (req, res) => {
  try {
    const userId = req.user.id;
    const { enabled } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.twoFactorEnabled = !!enabled;
    await user.save();
    res.status(200).json({ message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'}`, twoFactorEnabled: user.twoFactorEnabled });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update two-factor setting', error: error.message });
  }
};
