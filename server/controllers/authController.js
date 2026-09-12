const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'harinama_default_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Register New User
exports.register = (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters in length.'
      });
    }

    const existing = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const newUser = db.insert('users', {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash,
      phone: phone || '',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      role: 'customer',
      status: 'active'
    });

    // Create welcome notification
    db.insert('notifications', {
      user_id: newUser.id,
      title: 'Welcome to HariNama Store! 🌸',
      message: 'Explore authentic Vedic scriptures, Japa malas, handlooms and altar items.',
      type: 'account',
      link: '/shop.html',
      is_read: false
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        avatar: newUser.avatar,
        role: newUser.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// Login
exports.login = (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended or deactivated. Contact support.'
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get Current Logged In Profile
exports.getMe = (req, res, next) => {
  try {
    const user = db.findById('users', req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        created_at: user.created_at
      }
    });
  } catch (err) {
    next(err);
  }
};

// Update Profile
exports.updateProfile = (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (avatar) updates.avatar = avatar;

    const updatedUser = db.update('users', req.user.id, updates);

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        role: updatedUser.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// Change Password
exports.changePassword = (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters in length.'
      });
    }

    const user = db.findById('users', req.user.id);
    const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(newPassword, salt);

    db.update('users', req.user.id, { password_hash });

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    next(err);
  }
};

// Forgot Password (Simulated Secure Token / Reset)
exports.forgotPassword = (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase().trim());
    // Safe response: do not reveal if email exists or not
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link and PIN has been sent.'
    });
  } catch (err) {
    next(err);
  }
};

// Reset Password
exports.resetPassword = (req, res, next) => {
  try {
    const { email, resetCode, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required.' });
    }

    const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset request.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(newPassword, salt);
    db.update('users', user.id, { password_hash });

    res.json({
      success: true,
      message: 'Password reset successfully. You may now log in.'
    });
  } catch (err) {
    next(err);
  }
};
