const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

// Specific routes first
router.get('/categories', categoryController.getAllCategories);
router.post('/add/categories', categoryController.createCategory);
router.post('/categories/import', upload.single('file'), categoryController.importCategories);

// Dynamic routes after specific routes
router.get('/categories/:id', categoryController.getCategory);
router.get('/categories/:id/subcategories', categoryController.getSubcategories);
router.post('/categories/:id/subcategories', categoryController.addSubcategory);

module.exports = router;