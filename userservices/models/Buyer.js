const mongoose = require('mongoose');

const buyerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 100,
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    match: /^\+91[6-9][0-9]{9}$/
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    match: /^\S+@\S+\.\S+$/,
  },
  businessName: String,
  categories: {
    type: [String],
    required: true,
    validate: v => Array.isArray(v) && v.length >= 1 && v.length <= 5
  },
  businessAddress: String,
  gstin: {
    type: String,
    match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  },
  businessType: String,
  turnover: String,
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
  updatedAt: {
    type: Date,
    default: () => new Date(),
  }
});

module.exports = mongoose.model('Buyer', buyerSchema);
