// routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authcontroller');

const router = express.Router();

// Signup: Register a new user
router.post('/signup', authController.signup);

// Generate OTP: Initiate login
router.post('/login', authController.generateOtp);

// Validate OTP: Authenticate user
router.post('/validate-otp', authController.validateOtp);

// Verify Token
router.post('/verify-token', authController.verifyToken);

module.exports = router;