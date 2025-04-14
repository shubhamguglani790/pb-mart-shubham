const logger = require('../utils/logger');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const config = require('../config');
const { publishEvent } = require('../utils/rabbitmq');

const productController = {
  createProduct: async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        logger.error('No token provided');
        return res.status(401).json({ error: 'No token provided' });
      }

      let decoded;
      try {
        logger.info('Decoding token', { token: token.slice(0, 10) + '...' });
        decoded = jwt.verify(token, process.env.JWT_PUBLIC_KEY || 'your-very-secure-secret-key');
        logger.info('Token decoded', { sub: decoded.sub, sellerId: decoded.sellerId });
      } catch (error) {
        logger.error('Token verification failed', { error: error.message });
        return res.status(401).json({ error: 'Invalid token' });
      }

      const sellerId = decoded.sellerId;
      const sellerName = decoded.username || 'Unknown';
      const userId = decoded.sub;
      if (!sellerId) {
        logger.error('Missing sellerId in token', { decoded });
        return res.status(401).json({ error: 'Missing sellerId' });
      }

      const { name, price, stock, categoryId } = req.body;
      if (!name || price <= 0 || stock < 0 || !categoryId) {
        logger.error('Invalid input for createProduct', { body: req.body });
        return res.status(400).json({ error: 'Invalid input' });
      }

      try {
        const response = await axios.get(`${config.categoryServiceUrl}/categories/${categoryId}`);
        if (!response.data.id) {
          logger.error('Category validation failed', { categoryId });
          return res.status(404).json({ error: 'Category not found' });
        }
        logger.info('Category validated', { categoryId });
      } catch (error) {
        logger.error('Category service error', { error: error.message, categoryId });
        return res.status(503).json({ error: 'Category service unavailable' });
      }

      const product = new Product({
        name,
        description: req.body.description,
        price,
        images: req.body.images || [],
        stock,
        sellerId,
        categoryId,
      });

      await product.save();
      const productData = {
        id: product._id.toString(),
        sellerId: product.sellerId,
        sellerName,
      };
      logger.info('Product created', { id: productData.id, sellerId, sellerName, userId, categoryId });
      publishEvent('created', { ...productData, name, price, stock, categoryId });
      res.status(201).json(productData);
    } catch (error) {
      logger.error('Failed to create product', {
        error: error.message || 'Unknown error',
        body: req.body,
        categoryId: req.body.categoryId,
      });
      const status = error.message.includes('not found') ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  },
  listProductsByCategory: async (req, res) => {
    try {
      const { categoryId } = req.query;
      if (!categoryId) {
        logger.error('No categoryId provided');
        return res.status(400).json({ error: 'Category ID is required' });
      }

      try {
        const response = await axios.get(`${config.categoryServiceUrl}/categories/${categoryId}`);
        if (!response.data.id) {
          logger.error('Category validation failed', { categoryId });
          return res.status(404).json({ error: 'Category not found' });
        }
        logger.info('Category validated for listing', { categoryId });
      } catch (error) {
        logger.error('Category service error', { error: error.message, categoryId });
        return res.status(503).json({ error: 'Category service unavailable' });
      }

      const products = await Product.find({ categoryId });
      if (!products.length) {
        logger.info('No products found for category', { categoryId });
      }

      const productData = products.map((product) => ({
        id: product._id.toString(),
        sellerId: product.sellerId,
        sellerName: req.user?.username || 'Unknown',
        name: product.name,
        price: product.price,
        stock: product.stock,
      }));

      logger.info('Products listed for category', { categoryId, count: productData.length });
      res.json(productData);
    } catch (error) {
      logger.error('Failed to list products by category', { error: error.message, categoryId: req.query.categoryId });
      res.status(400).json({ error: error.message });
    }
  },
};

module.exports = productController;