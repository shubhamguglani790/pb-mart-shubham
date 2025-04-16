const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Route for listing products by category (no authentication)
router.get('/products/by-category', productController.listProductsByCategory);

// Other routes
router.post('/add/products', productController.createProduct);
router.get('/products', productController.getAllProducts);
router.get('/products/by-seller-id', productController.getProductsBySellerId);

module.exports = router;