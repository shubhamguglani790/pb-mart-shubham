// services/authService.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const OtpRecord = require('../models/otpRecord');
const config = require('../config/config');

class AuthService {
  static generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  static async generateAndSaveOTP(email, username) {
    const otp = this.generateOTP();
    const otpRecord = new OtpRecord({ email, username, otp });
    await otpRecord.save();
    return otp;
  }

  static async validateOTP(email, otp) {
    const otpRecord = await OtpRecord.findOne({ email, otp });
    if (!otpRecord) return null;
    const username = otpRecord.username; // Get username from OTP record
    await OtpRecord.deleteOne({ _id: otpRecord._id });
    return { isValid: true, username }; // Return both validity and username
  }

  static generateJWT(email, username) {
    return jwt.sign({ email, username }, config.jwtSecret, { expiresIn: '7d' });
  }

  static verifyJWT(token) {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch (error) {
      return null;
    }
  }
}

module.exports = AuthService;