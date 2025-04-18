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
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    default: () => new mongoose.Types.ObjectId() // Auto-generate unique ObjectId
  },
  subcategories: { type: [subcategorySchema], required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Categories', categorySchema);