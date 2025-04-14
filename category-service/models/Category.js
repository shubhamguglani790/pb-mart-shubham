const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  subcategories: [subcategorySchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Category', categorySchema);