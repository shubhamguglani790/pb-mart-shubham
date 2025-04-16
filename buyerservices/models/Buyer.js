const mongoose = require('mongoose');

const buyerSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  fullName: { type: String, required: true },
  mobile: { type: String, unique: true, required: true },
  email: { type: String, unique: true, sparse: true },
  businessName: { type: String },
  panCardNumber: { type: String },
  categories: [{ type: String }],
  businessAddress: { type: String },
  gstin: { type: String },
  businessType: { type: String },
  turnover: { type: String },
  bankDetails: { type: String },
  accountNumber: { type: String },
  ifscCode: { type: String },
  nameOfBank: { type: String },
  placeOfBank: { type: String },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

const Buyer = mongoose.model('Buyer', buyerSchema);
module.exports = Buyer;