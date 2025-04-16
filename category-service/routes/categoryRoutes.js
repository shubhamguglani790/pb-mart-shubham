const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.get('/categories', categoryController.getAllCategories);
router.post('/add/categories', categoryController.createCategory);
router.post('/categories/import', categoryController.importCategories);
router.get('/categories/:id', categoryController.getCategory);
router.get('/categories/:id/subcategories', categoryController.getSubcategories);
router.post('/categories/:id/subcategories', categoryController.addSubcategory);

module.exports = router;