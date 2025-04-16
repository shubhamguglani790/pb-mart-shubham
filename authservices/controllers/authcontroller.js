// controllers/authController.js
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const OtpRecord = require('../models/otpRecord');
const config = require('../config/config');

// Utility to mask mobile number (e.g., +91XXXXXXXXXX0790)
const maskMobile = (mobile) => {
  if (!mobile || mobile.length < 4) return 'XXXXXXXXXX****';

  // Detect country code (e.g., +91, +1) at the start
  let countryCode = '';
  const countryCodeMatch = mobile.match(/^(\+\d{1,3}\s?)/);
  let number = mobile;

  if (countryCodeMatch) {
    countryCode = countryCodeMatch[0].trim();
    number = mobile.slice(countryCode.length);
  }

  // Use 10 X's + last 4 digits
  if (number.length < 4) return countryCode + 'XXXXXXXXXX****';
  return countryCode + 'XXXXXXXXXX' + number.slice(-4);
};

// Utility to validate mobile number (10 digits after country code)
const validateMobile = (mobile) => {
  if (!mobile) return false;

  // Strip country code (e.g., +91, +1)
  const number = mobile.replace(/^(\+\d{1,3}\s?)/, '');

  // Check if exactly 10 digits
  return /^\d{10}$/.test(number);
};

// Utility to get next sellerId
const getNextSellerId = async () => {
  const lastUser = await User.findOne().sort({ sellerId: -1 }).select('sellerId');
  return lastUser && lastUser.sellerId ? lastUser.sellerId + 1 : 1;
};

// Utility to validate allowed fields
const validateFields = (body, allowedFields) => {
  const receivedFields = Object.keys(body);
  return receivedFields.every(field => allowedFields.includes(field)) &&
    receivedFields.length === allowedFields.length;
};

const authController = {
  // Signup: Register a new user
  async signup(req, res) {
    const allowedFields = ['name', 'mobile', 'businessName', 'businessAddress', 'businessType'];
    if (!validateFields(req.body, allowedFields)) {
      logger.error('Invalid fields provided', { body: req.body });
      return res.status(400).json({ error: 'Invalid fields provided' });
    }

    const { name, mobile, businessName, businessAddress, businessType } = req.body;

    // Validate mobile number
    if (!validateMobile(mobile)) {
      logger.error('Invalid mobile number', { mobile });
      return res.status(400).json({ error: 'Mobile number must be 10 digits' });
    }

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ mobile });
      if (existingUser) {
        logger.error('User already exists', { mobile });
        return res.status(400).json({ error: 'Mobile number already registered' });
      }

      // Generate sellerId
      const sellerId = await getNextSellerId();

      // Create new user
      await User.create({
        name,
        mobile,
        sellerId,
        businessName,
        businessAddress,
        businessType,
      });

      logger.info('User registered', { mobile: maskMobile(mobile), sellerId });
      res.status(201).json({
        message: `${name} registered successfully with mobile ${maskMobile(mobile)}`,
      });
    } catch (error) {
      logger.error('Failed to register user', { error: error.message });
      res.status(500).json({ error: 'Failed to register user' });
    }
  },

  // Generate OTP: Initiate login by storing mobile
  async generateOtp(req, res) {
    const allowedFields = ['mobile'];
    if (!validateFields(req.body, allowedFields)) {
      logger.error('Invalid fields provided', { body: req.body });
      return res.status(400).json({ error: 'Invalid fields provided' });
    }

    const { mobile } = req.body;

    // Validate mobile number
    if (!validateMobile(mobile)) {
      logger.error('Invalid mobile number', { mobile });
      return res.status(400).json({ error: 'Mobile number must be 10 digits' });
    }

    try {
      // Check if user exists
      const user = await User.findOne({ mobile });
      if (!user) {
        logger.error('User not found', { mobile });
        return res.status(404).json({ error: 'User not registered' });
      }

      // Store OTP request
      await OtpRecord.create({ mobile });

      logger.info('OTP request generated', { mobile: maskMobile(mobile) });
      res.status(200).json({
        message: `OTP sent for mobile ${maskMobile(mobile)}`,
      });
    } catch (error) {
      logger.error('Failed to generate OTP', { error: error.message });
      res.status(500).json({ error: 'Failed to generate OTP' });
    }
  },

  // Validate OTP: Check constant OTP and issue token
  async validateOtp(req, res) {
    const allowedFields = ['otp'];
    if (!validateFields(req.body, allowedFields)) {
      logger.error('Invalid fields provided', { body: req.body });
      return res.status(400).json({ error: 'Invalid fields provided' });
    }

    const { otp } = req.body;

    try {
      // Get the latest OTP record
      const otpRecord = await OtpRecord.findOne().sort({ createdAt: -1 });
      if (!otpRecord) {
        logger.error('No OTP request found');
        return res.status(400).json({ error: 'No OTP request found or expired' });
      }

      // Validate constant OTP
      if (otp !== '12345') {
        logger.error('Invalid OTP', { mobile: otpRecord.mobile });
        return res.status(401).json({ error: 'Invalid OTP' });
      }

      // Find user
      const user = await User.findOne({ mobile: otpRecord.mobile });
      if (!user) {
        logger.error('User not found', { mobile: otpRecord.mobile });
        return res.status(404).json({ error: 'User not registered' });
      }

      // Generate JWT token with all fields
      const token = jwt.sign(
        {
          sub: user.mobile,
          name: user.name,
          sellerId: user.sellerId,
          businessName: user.businessName,
          businessAddress: user.businessAddress,
          businessType: user.businessType,
        },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      // Delete OTP record
      await OtpRecord.deleteOne({ _id: otpRecord._id });

      logger.info('User logged in', { mobile: maskMobile(user.mobile), sellerId: user.sellerId });
      res.status(200).json({
        message: `${user.name} logged in successfully with mobile ${maskMobile(user.mobile)}`,
        token: token,
      });
    } catch (error) {
      logger.error('Failed to validate OTP', { error: error.message });
      res.status(500).json({ error: 'Failed to validate OTP' });
    }
  },

  // Verify JWT token
  async verifyToken(req, res) {
    const allowedFields = ['token'];
    if (!validateFields(req.body, allowedFields)) {
      logger.error('Invalid fields provided', { body: req.body });
      return res.status(400).json({ error: 'Invalid fields provided' });
    }

    const { token } = req.body;

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      logger.info('Token verified', { sub: decoded.sub, sellerId: decoded.sellerId });
      res.status(200).json({
        message: 'Token verified',
        user: {
          mobile: decoded.sub,
          name: decoded.name,
          sellerId: decoded.sellerId,
          businessName: decoded.businessName,
          businessAddress: decoded.businessAddress,
          businessType: decoded.businessType,
          iat: decoded.iat,
          exp: decoded.exp,
        },
      });
    } catch (error) {
      logger.error('Token verification failed', { error: error.message });
      res.status(401).json({ error: 'Invalid token' });
    }
  },
};

module.exports = authController;