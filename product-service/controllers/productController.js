const logger = require('../utils/logger');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const config = require('../config');
const { publishEvent } = require('../utils/rabbitmq');
const fs = require('fs').promises;
const path = require('path');

const productController = {
  createProduct: async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        logger.error('No token provided for createProduct');
        return res.status(401).json({ error: 'No token provided' });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-very-secure-secret-key');
        logger.info('Token decoded', { sellerId: decoded.sellerId, name: decoded.name });
      } catch (error) {
        logger.error('Token verification failed', { error: error.message });
        return res.status(401).json({ error: 'Invalid token' });
      }

      const sellerId = decoded.sellerId;
      const sellerName = decoded.name || 'Unknown';
      if (!sellerId) {
        logger.error('Missing sellerId in token', { decoded });
        return res.status(401).json({ error: 'Missing sellerId' });
      }

      const { name, price, stock, categoryId, subcategoryName, description, images } = req.body;

      // Validate required fields
      if (!name || typeof name !== 'string' || name.trim() === '') {
        logger.error('Invalid name', { body: req.body });
        return res.status(400).json({ error: 'Name is required and must be a non-empty string' });
      }

      if (!description || typeof description !== 'string' || description.trim() === '') {
        logger.error('Invalid description', { body: req.body });
        return res.status(400).json({ error: 'Description is required and must be a non-empty string' });
      }

      if (!categoryId || typeof categoryId !== 'string' || categoryId.trim() === '') {
        logger.error('Invalid categoryId', { body: req.body });
        return res.status(400).json({ error: 'CategoryId is required and must be a non-empty string' });
      }

      if (!subcategoryName || typeof subcategoryName !== 'string' || subcategoryName.trim() === '') {
        logger.error('Invalid subcategoryName', { body: req.body });
        return res.status(400).json({ error: 'SubcategoryName is required and must be a non-empty string' });
      }

      if (!price || typeof price !== 'number' || price <= 0) {
        logger.error('Invalid price', { body: req.body });
        return res.status(400).json({ error: 'Price is required and must be a positive number' });
      }

      if (!stock || typeof stock !== 'number' || stock < 0) {
        logger.error('Invalid stock', { body: req.body });
        return res.status(400).json({ error: 'Stock is required and must be a non-negative number' });
      }

      if (!images || !Array.isArray(images) || images.length === 0) {
        logger.error('Invalid images', { images });
        return res.status(400).json({ error: 'Images must be a non-empty array' });
      }

      // Validate images array
      for (const imageBase64 of images) {
        if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.trim() === '') {
          logger.error('Invalid imageBase64', { imageBase64 });
          return res.status(400).json({ error: 'Each image must be a non-empty string' });
        }

        // Check size limit (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (Buffer.byteLength(imageBase64) > maxSize) {
          logger.error('Image size exceeds limit', { size: Buffer.byteLength(imageBase64) });
          return res.status(400).json({ error: 'Image size exceeds 5MB limit' });
        }

        // Decode raw Base64
        let buffer;
        try {
          buffer = Buffer.from(imageBase64, 'base64');
        } catch (err) {
          logger.error('Invalid Base64 encoding', { error: err.message });
          return res.status(400).json({ error: 'Invalid Base64 string' });
        }
      }

      let imagePaths = [];
      if (images && Array.isArray(images)) {
        for (const imageBase64 of images) {
          // Create upload directory
          const uploadDir = path.join(__dirname, '../Uploads');
          await fs.mkdir(uploadDir, { recursive: true });

          // Save image file with default .jpg extension
          const filename = `${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
          const uploadPath = path.join(uploadDir, filename);
          const buffer = Buffer.from(imageBase64, 'base64');
          await fs.writeFile(uploadPath, buffer);
          imagePaths.push(`/uploads/${filename}`);
        }
      }

      const product = new Product({
        name: name.trim(),
        description: description.trim(),
        price,
        images: imagePaths,
        stock,
        sellerId,
        sellerName,
        categoryId: categoryId.trim(),
        subcategoryName: subcategoryName.trim(),
      });

      await product.save();
      const productData = {
        id: product._id.toString(),
        sellerId: product.sellerId,
        sellerName: product.sellerName,
        message: 'Product added successfully',
      };
      logger.info('Product created via POST /add/products', {
        id: productData.id,
        sellerId,
        sellerName,
        categoryId,
        subcategoryName,
      });
      publishEvent('created', { ...productData, name, price, stock, categoryId, subcategoryName, description });
      res.status(201).json(productData);
    } catch (error) {
      logger.error('Failed to create product', {
        error: error.message || 'Unknown error',
        body: req.body,
        categoryId: req.body.categoryId,
        subcategoryName: req.body.subcategoryName,
      });
      if (imagePaths.length > 0) {
        for (const imagePath of imagePaths) {
          await fs.unlink(path.join(__dirname, '..', imagePath)).catch(e => logger.error('Failed to delete file', { error: e.message }));
        }
      }
      const status = error.message.includes('not found') ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  },

  getAllProducts: async (req, res) => {
    try {
      const products = await Product.find();
      if (!products.length) {
        logger.info('No products found for GET /products');
        return res.status(200).json([]);
      }

      const productData = products.map((product) => ({
        id: product._id.toString(),
        sellerId: product.sellerId,
        sellerName: product.sellerName || 'Unknown',
        name: product.name,
        price: product.price,
        stock: product.stock,
        categoryId: product.categoryId,
        subcategoryName: product.subcategoryName,
        description: product.description,
        images: product.images.map(image => image ? `${req.protocol}://${req.get('host')}${image}` : null),
      }));

      logger.info('All products retrieved', { count: productData.length });
      res.status(200).json(productData);
    } catch (error) {
      logger.error('Failed to get all products', { error: error.message });
      res.status(500).json({ error: 'Failed to retrieve products' });
    }
  },

  listProductsByCategory: async (req, res) => {
    try {
      const { categoryId, subcategoryName } = req.query;
      if (!categoryId) {
        logger.error('No categoryId provided for listProductsByCategory');
        return res.status(400).json({ error: 'Category ID is required' });
      }

      const query = { categoryId };
      if (subcategoryName) {
        query.subcategoryName = subcategoryName;
      }

      const products = await Product.find(query);
      if (!products.length) {
        logger.info('No products found', { categoryId, subcategoryName });
        return res.status(200).json([]);
      }

      const productData = products.map((product) => ({
        id: product._id.toString(),
        sellerId: product.sellerId,
        sellerName: product.sellerName || 'Unknown',
        name: product.name,
        price: product.price,
        stock: product.stock,
        subcategoryName: product.subcategoryName,
        description: product.description,
        images: product.images.map(image => image ? `${req.protocol}://${req.get('host')}${image}` : null),
      }));

      logger.info('Products listed via GET /products/by-category', {
        categoryId,
        subcategoryName,
        count: productData.length,
      });
      res.json(productData);
    } catch (error) {
      logger.error('Failed to list products', {
        error: error.message,
        categoryId: req.query.categoryId,
        subcategoryName: req.query.subcategoryName,
      });
      res.status(400).json({ error: error.message });
    }
  },

  getProductsBySellerId: async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        logger.error('No token provided for getProductsBySellerId');
        return res.status(401).json({ error: 'No token provided' });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-very-secure-secret-key');
        logger.info('Token decoded', { sellerId: decoded.sellerId, name: decoded.name });
      } catch (error) {
        logger.error('Token verification failed', { error: error.message });
        return res.status(401).json({ error: 'Invalid token' });
      }

      const sellerId = decoded.sellerId;
      if (!sellerId) {
        logger.error('Missing sellerId in token', { decoded });
        return res.status(401).json({ error: 'Missing sellerId' });
      }

      const products = await Product.find({ sellerId }).lean();
      if (!products.length) {
        logger.info('No products found for seller', { sellerId });
        return res.status(200).json({ message: 'No products found', products: [] });
      }

      const productData = products.map((product) => ({
        id: product._id.toString(),
        sellerId: product.sellerId,
        sellerName: decoded.name || 'Unknown',
        name: product.name,
        price: product.price,
        stock: product.stock,
        categoryId: product.categoryId,
        subcategoryName: product.subcategoryName,
        description: product.description,
        images: product.images.map(image => image ? `${req.protocol}://${req.get('host')}${image}` : null),
      }));

      logger.info('Products listed by sellerId', { sellerId, count: productData.length });
      res.status(200).json(productData);
    } catch (error) {
      logger.error('Failed to get products by sellerId', { error: error.message, sellerId: decoded?.sellerId });
      res.status(500).json({ error: 'Failed to retrieve products' });
    }
  },
};

module.exports = productController;