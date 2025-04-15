// models/otpRecord.js
const mongoose = require('mongoose');

const otpRecordSchema = new mongoose.Schema({
  mobile: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }, // Expires in 5 minutes
});

module.exports = mongoose.model('OtpRecord', otpRecordSchema);