const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true }, // Changed to required
  price: { type: Number, required: true, min: 0 },
  images: { type: [String], default: [] },
  stock: { type: Number, required: true, min: 0 },
  sellerId: { type: String, required: true, index: true },
  sellerName: { type: String, required: true, trim: true },
  categoryId: { type: String, required: true },
  subcategoryName: { type: String, default: '', trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);