const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authSeller } = require('../middleware/authSeller');

router.post('/', authSeller, productController.createProduct);
router.get('/', authSeller, productController.listProductsByCategory);

module.exports = router;