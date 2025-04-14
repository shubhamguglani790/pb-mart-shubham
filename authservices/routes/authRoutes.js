const express = require('express');
const otpQueue = require('../utils/otpQueue');
const logger = require('../utils/logger');
const { handleError } = require('../utils/errorHandler');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Generate OTP without sellerId in response
router.post('/generate-otp', async (req, res) => {
  const { email, username } = req.body;
  if (!email || !username) {
    logger.error('Missing email or username', { body: req.body });
    return res.status(400).json({ error: 'Email and username are required' });
  }

  try {
    const { otp } = await otpQueue.add(email, username);
    logger.info('OTP generated', { email });
    res.status(200).json({
      message: 'OTP generated',
      otp
    });
  } catch (error) {
    handleError(res, error, 'Failed to generate OTP');
  }
});

// Validate OTP and return JWT token without sellerId in response
router.post('/validate-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    logger.error('Missing email or OTP', { body: req.body });
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  try {
    const storedData = await otpQueue.getOtpByEmail(email);
    if (!storedData || storedData.otp !== otp) {
      logger.error('Invalid OTP', { email });
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // Use stored sellerId
    const { username, sellerId } = storedData;

    // Generate JWT token
    const token = jwt.sign(
      { sub: email, username, sellerId },
      process.env.JWT_SECRET || 'your_key',
      { expiresIn: '1h' }
    );

    logger.info('OTP validated, token issued', { email, sellerId });
    res.status(200).json({
      message: 'OTP validated',
      token
    });
  } catch (error) {
    handleError(res, error, 'Failed to validate OTP');
  }
});

// Verify Token and display email, username, and sellerId
router.post('/verify-token', (req, res) => {
  const { token } = req.body;
  if (!token) {
    logger.error('Missing token');
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_key');
    logger.info('Token verified', { sub: decoded.sub, sellerId: decoded.sellerId });
    res.status(200).json({
      message: 'Token verified',
      user: {
        email: decoded.sub,
        username: decoded.username,
        sellerId: decoded.sellerId,
        iat: decoded.iat,
        exp: decoded.exp
      }
    });
  } catch (error) {
    logger.error('Token verification failed', { error: error.message });
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;