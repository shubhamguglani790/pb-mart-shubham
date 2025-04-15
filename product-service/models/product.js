const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  images: [{ type: String }],
  stock: { type: Number, required: true },
  sellerId: { type: String, required: true },
  categoryId: { type: String, required: true },
  subcategoryName: { type: String, default: '' },
});

module.exports = mongoose.model('Product', productSchema);