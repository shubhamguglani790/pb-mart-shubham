const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authSeller } = require('../middleware/authSeller');

router.post('/add/products', authSeller, productController.createProduct);
router.get('/products', productController.getAllProducts);
router.get('/products/category', authSeller, productController.listProductsByCategory);
router.get('/products/seller', authSeller, productController.getProductsBySeller);
router.get('/products/all', authSeller, productController.getAllProductsWithSellerVerification);

module.exports = router;