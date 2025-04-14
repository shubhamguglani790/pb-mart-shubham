// models/otpRecord.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  username: { type: String, required: true }, // Add username field
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }
});

module.exports = mongoose.model('OtpRecord', otpSchema);