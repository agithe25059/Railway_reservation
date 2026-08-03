const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { generateOTP, sendOTPEmail } = require('../services/emailService');

const router = express.Router();

// ── SEND OTP ──────────────────────────────────────────────
// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  const { email, full_name } = req.body;

  if (!email || !full_name) {
    return res.status(400).json({ message: 'Name and email are required.' });
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  try {
    // Check if email already registered
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Generate OTP and set 5-minute expiry
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing OTPs for this email
    await pool.query('DELETE FROM otp_verifications WHERE email = ?', [email]);

    // Store OTP in DB
    await pool.query(
      'INSERT INTO otp_verifications (email, otp, expires_at) VALUES (?, ?, ?)',
      [email, otp, expiresAt]
    );

    // Send OTP email
    await sendOTPEmail(email, otp, full_name);

    res.json({ message: `OTP sent to ${email}. Please check your inbox.` });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

// ── REGISTER (with OTP verification) ─────────────────────
// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { full_name, email, password, otp } = req.body;

  if (!full_name || !email || !password || !otp) {
    return res.status(400).json({ message: 'All fields including OTP are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    // Verify OTP
    const [otpRows] = await pool.query(
      'SELECT * FROM otp_verifications WHERE email = ? ORDER BY created_at DESC LIMIT 1',
      [email]
    );

    if (otpRows.length === 0) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }

    const otpRecord = otpRows[0];

    if (new Date() > new Date(otpRecord.expires_at)) {
      await pool.query('DELETE FROM otp_verifications WHERE email = ?', [email]);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (otpRecord.otp !== otp.toString().trim()) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // OTP valid — delete it
    await pool.query('DELETE FROM otp_verifications WHERE email = ?', [email]);

    // Check email not already registered (race condition guard)
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Hash password (salt rounds = 12)
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
      [full_name, email, password_hash]
    );

    // Generate JWT
    const token = jwt.sign(
      { id: result.insertId, email, full_name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: result.insertId, full_name, email },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// ── LOGIN ─────────────────────────────────────────────────
// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

module.exports = router;
