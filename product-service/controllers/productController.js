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
        logger.error('No token provided for createProduct');
        return res.status(401).json({ error: 'No token provided' });
      }

      let decoded;
      try {
        logger.info('Decoding token', { token: token.slice(0, 10) + '...' });
        decoded = jwt.verify(token, process.env.JWT_PUBLIC_KEY || 'your-very-secure-secret-key');
        logger.info('Token decoded', { sub: decoded.sub, sellerId: decoded.sellerId, name: decoded.name });
      } catch (error) {
        logger.error('Token verification failed', { error: error.message });
        return res.status(401).json({ error: 'Invalid token' });
      }

      const sellerId = decoded.sellerId;
      const sellerName = decoded.name || 'Unknown';
      const userId = decoded.sub;
      if (!sellerId) {
        logger.error('Missing sellerId in token', { decoded });
        return res.status(401).json({ error: 'Missing sellerId' });
      }

      const { name, price, stock, categoryId, subcategoryName } = req.body;
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

        if (subcategoryName) {
          const subcategories = response.data.subcategories || [];
          const subcategoryExists = subcategories.some(sub => sub.name === subcategoryName);
          if (!subcategoryExists) {
            logger.error('Subcategory not found', { categoryId, subcategoryName });
            return res.status(404).json({ error: 'Subcategory not found' });
          }
        }
        logger.info('Category and subcategory validated', { categoryId, subcategoryName });
      } catch (error) {
        logger.error('Category service error', { error: error.message, categoryId });
        return res.status(503).json({ error: 'Category service unavailable' });
      }

      const product = new Product({
        name,
        description: req.body.description || '',
        price,
        images: req.body.images || [],
        stock,
        sellerId,
        categoryId,
        subcategoryName: subcategoryName || '',
      });

      await product.save();
      const productData = {
        id: product._id.toString(),
        sellerId: product.sellerId,
        sellerName,
        message: 'Product added successfully',
      };
      logger.info('Product created via POST /add/products', {
        id: productData.id,
        sellerId,
        sellerName,
        userId,
        categoryId,
        subcategoryName,
      });
      publishEvent('created', { ...productData, name, price, stock, categoryId, subcategoryName });
      res.status(201).json(productData);
    } catch (error) {
      logger.error('Failed to create product', {
        error: error.message || 'Unknown error',
        body: req.body,
        categoryId: req.body.categoryId,
        subcategoryName: req.body.subcategoryName,
      });
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
        sellerName: req.user?.name || 'Unknown',
        name: product.name,
        price: product.price,
        stock: product.stock,
        categoryId: product.categoryId,
        subcategoryName: product.subcategoryName,
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

      try {
        const response = await axios.get(`${config.categoryServiceUrl}/categories/${categoryId}`);
        if (!response.data.id) {
          logger.error('Category validation failed', { categoryId });
          return res.status(404).json({ error: 'Category not found' });
        }

        if (subcategoryName) {
          const subcategories = response.data.subcategories || [];
          const subcategoryExists = subcategories.some(sub => sub.name === subcategoryName);
          if (!subcategoryExists) {
            logger.error('Subcategory not found', { categoryId, subcategoryName });
            return res.status(404).json({ error: 'Subcategory not found' });
          }
        }
        logger.info('Category and subcategory validated for listing', { categoryId, subcategoryName });
      } catch (error) {
        logger.error('Category service error', { error: error.message, categoryId });
        return res.status(503).json({ error: 'Category service unavailable' });
      }

      const query = { categoryId };
      if (subcategoryName) {
        query.subcategoryName = subcategoryName;
      }

      const products = await Product.find(query);
      if (!products.length) {
        logger.info('No products found', { categoryId, subcategoryName });
      }

      const productData = products.map((product) => ({
        id: product._id.toString(),
        sellerId: product.sellerId,
        sellerName: req.user?.name || 'Unknown',
        name: product.name,
        price: product.price,
        stock: product.stock,
        subcategoryName: product.subcategoryName,
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

  getProductsBySeller: async (req, res) => {
    try {
      const sellerId = req.user?.sellerId; // Extracted from JWT by authSeller middleware
      if (!sellerId) {
        logger.error('Seller ID not found in token');
        return res.status(401).json({ error: 'Unauthorized: Seller ID missing' });
      }

      // Fetch only products matching the sellerId
      const products = await Product.find({ sellerId }).lean();

      if (!products.length) {
        logger.info('No products found for seller', { sellerId });
        return res.status(200).json({ message: 'No products found', products: [] });
      }

      // Fetch category details for each product
      const categoryPromises = products.map(async (product) => {
        if (product.categoryId) {
          try {
            const categoryResponse = await axios.get(`${config.categoryServiceUrl}/categories/${product.categoryId}`);
            product.category = categoryResponse.data; // Include category details
          } catch (categoryError) {
            logger.error('Failed to fetch category', { categoryId: product.categoryId, error: categoryError.message });
            product.category = { name: 'Unknown', error: 'Category not found' };
          }
        }
        product.sellerName = req.user?.name || 'Unknown'; // Use token's name
        return product;
      });

      const productsWithCategories = await Promise.all(categoryPromises);

      logger.info('Products fetched successfully', { sellerId, count: productsWithCategories.length });
      res.status(200).json({
        message: 'Products fetched successfully',
        products: productsWithCategories,
      });
    } catch (error) {
      logger.error('Error fetching products', { error: error.message });
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  },

  getAllProductsWithSellerVerification: async (req, res) => {
    try {
      const sellerId = req.user?.sellerId; // Extracted from JWT by authSeller middleware
      if (!sellerId) {
        logger.error('Seller ID not found in token');
        return res.status(401).json({ error: 'Unauthorized: Seller ID missing' });
      }

      // Fetch all products
      const products = await Product.find().lean();

      if (!products.length) {
        logger.info('No products found');
        return res.status(200).json({ message: 'No products found', products: [] });
      }

      // Verify each product's sellerId against the token
      const verifiedProducts = products.filter(product => product.sellerId === sellerId);

      if (!verifiedProducts.length) {
        logger.info('No products match the seller ID', { sellerId });
        return res.status(200).json({ message: 'No matching products found', products: [] });
      }

      // Fetch category details for verified products
      const categoryPromises = verifiedProducts.map(async (product) => {
        if (product.categoryId) {
          try {
            const categoryResponse = await axios.get(`${config.categoryServiceUrl}/categories/${product.categoryId}`);
            product.category = categoryResponse.data; // Include category details
          } catch (categoryError) {
            logger.error('Failed to fetch category', { categoryId: product.categoryId, error: categoryError.message });
            product.category = { name: 'Unknown', error: 'Category not found' };
          }
        }
        product.sellerName = req.user?.name || 'Unknown'; // Use token's name
        return product;
      });

      const productsWithCategories = await Promise.all(categoryPromises);

      logger.info('All products verified and fetched successfully', { sellerId, count: productsWithCategories.length });
      res.status(200).json({
        message: 'All products verified and fetched successfully',
        products: productsWithCategories,
      });
    } catch (error) {
      logger.error('Error fetching and verifying products', { error: error.message });
      res.status(500).json({ error: 'Failed to fetch and verify products' });
    }
  },
};

module.exports = productController;