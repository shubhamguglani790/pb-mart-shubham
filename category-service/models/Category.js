const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String }, // Stores file path, e.g., /uploads/filename.jpg
  subcategories: { type: [subcategorySchema], required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Categories', categorySchema);