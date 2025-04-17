const logger = require('../utils/logger');
const Category = require('../models/Category');
const fs = require('fs').promises;
const csvParser = require('csv-parser');
const path = require('path');
const { Readable } = require('stream');
const mongoose = require('mongoose');

const categoryController = {
  createCategory: async (req, res) => {
    try {
      const { name, description, subcategories, imageBase64, parentId } = req.body;

      // Validate required fields
      if (!name || typeof name !== 'string' || name.trim() === '') {
        logger.error('Invalid name', { body: req.body });
        return res.status(400).json({ error: 'Name is required and must be a non-empty string' });
      }

      if (!description || typeof description !== 'string' || description.trim() === '') {
        logger.error('Invalid description', { body: req.body });
        return res.status(400).json({ error: 'Description is required and must be a non-empty string' });
      }

      if (!subcategories || !Array.isArray(subcategories) || subcategories.length === 0) {
        logger.error('Invalid subcategories', { subcategories });
        return res.status(400).json({ error: 'Subcategories must be a non-empty array' });
      }

      // Validate subcategories
      for (const sub of subcategories) {
        if (!sub || typeof sub !== 'object' || !sub.name || typeof sub.name !== 'string' || sub.name.trim() === '' || !sub.description || typeof sub.description !== 'string' || sub.description.trim() === '') {
          logger.error('Invalid subcategory', { sub });
          return res.status(400).json({ error: 'Each subcategory must have a non-empty name and description' });
        }
      }

      // Validate parentId if provided
      if (parentId) {
        if (!mongoose.isValidObjectId(parentId)) {
          logger.error('Invalid parentId format', { parentId });
          return res.status(400).json({ error: 'Invalid parentId format' });
        }
        const parentCategory = await Category.findOne({ parentId });
        if (!parentCategory) {
          logger.error('Parent category not found', { parentId });
          return res.status(404).json({ error: 'Parent category not found' });
        }
      }

      let imagePath = null;
      if (imageBase64) {
        // Validate Base64 string
        if (typeof imageBase64 !== 'string' || imageBase64.trim() === '') {
          logger.error('Invalid imageBase64 type', { type: typeof imageBase64 });
          return res.status(400).json({ error: 'ImageBase64 must be a non-empty string' });
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

        // Create upload directory
        const uploadDir = path.join(__dirname, '../Uploads');
        await fs.mkdir(uploadDir, { recursive: true });

        // Save image file with default .jpg extension
        const filename = `${Date.now()}.jpg`;
        const uploadPath = path.join(uploadDir, filename);
        await fs.writeFile(uploadPath, buffer);
        imagePath = `/Uploads/${filename}`;
      }

      // Create and save category
      const category = new Category({
        name: name.trim(),
        description: description.trim(),
        image: imagePath,
        parentId: parentId || undefined,
        subcategories: subcategories.map(sub => ({
          name: sub.name.trim(),
          description: sub.description.trim(),
        })),
      });

      try {
        await category.save();
      } catch (err) {
        if (imagePath) {
          await fs.unlink(path.join(__dirname, '..', imagePath)).catch(e => logger.error('Failed to delete file', { error: e.message }));
        }
        throw err;
      }

      const imageUrl = imagePath ? `${req.protocol}://${req.get('host')}${imagePath}` : null;
      logger.info('Category created', { id: category._id, name: category.name, parentId: category.parentId });
      res.status(201).json({
        id: category._id.toString(),
        name: category.name,
        description: category.description,
        image: imageUrl,
        parentId: category.parentId.toString(),
        subcategories: category.subcategories,
      });
    } catch (error) {
      logger.error('Create category failed', { error: error.message });
      res.status(500).json({ error: 'Failed to create category', details: error.message });
    }
  },

  getCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { fields } = req.query;
      const category = await Category.findById(id);
      if (!category) {
        logger.error('Category not found', { id });
        return res.status(404).json({ error: 'Category not found' });
      }

      let response = {};
      if (fields) {
        const requestedFields = fields.split(',').map(f => f.trim());
        if (requestedFields.includes('image')) {
          response.image = category.image ? `${req.protocol}://${req.get('host')}${category.image}` : null;
        }
        if (requestedFields.includes('name')) response.name = category.name;
        if (requestedFields.includes('description')) response.description = category.description;
        if (requestedFields.includes('subcategories')) response.subcategories = category.subcategories;
        if (requestedFields.includes('parentId')) {
          response.parentId = category.parentId.toString();
        }
      } else {
        response = {
          id: category._id.toString(),
          name: category.name,
          description: category.description,
          image: category.image ? `${req.protocol}://${req.get('host')}${category.image}` : null,
          parentId: category.parentId.toString(),
          subcategories: category.subcategories,
        };
      }

      logger.info('Category retrieved', { id, parentId: category.parentId });
      res.json(response);
    } catch (error) {
      logger.error('Get category failed', { error: error.message, id: req.params.id });
      res.status(400).json({ error: 'Invalid category ID' });
    }
  },

  addSubcategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Validate required fields
      if (!name || typeof name !== 'string' || name.trim() === '') {
        logger.error('Invalid subcategory name', { body: req.body });
        return res.status(400).json({ error: 'Subcategory name must be a non-empty string' });
      }
      if (!description || typeof description !== 'string' || description.trim() === '') {
        logger.error('Invalid subcategory description', { body: req.body });
        return res.status(400).json({ error: 'Subcategory description must be a non-empty string' });
      }

      // Validate category ID
      if (!mongoose.isValidObjectId(id)) {
        logger.error('Invalid category ID format', { id });
        return res.status(400).json({ error: 'Invalid category ID format' });
      }

      // Find the category
      const category = await Category.findById(id);
      if (!category) {
        logger.error('Category not found', { id });
        return res.status(404).json({ error: 'Category not found' });
      }

      // Check for duplicate subcategory name (case-insensitive)
      const trimmedName = name.trim();
      const exists = category.subcategories.some(
        sub => sub.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (exists) {
        logger.error('Subcategory name already exists', { categoryId: id, name: trimmedName });
        return res.status(400).json({ error: 'Subcategory with this name already exists' });
      }

      // Add new subcategory
      category.subcategories.push({ name: trimmedName, description: description.trim() });
      await category.save();

      logger.info('Subcategory added', { categoryId: id, subcategoryName: trimmedName });
      res.status(200).json({
        id: category._id.toString(),
        name: category.name,
        image: category.image ? `${req.protocol}://${req.get('host')}${category.image}` : null,
        parentId: category.parentId ? category.parentId.toString() : null,
        subcategories: category.subcategories,
      });
    } catch (error) {
      logger.error('Add subcategory failed', { error: error.message, id: req.params.id });
      res.status(500).json({ error: 'Failed to add subcategory', details: error.message });
    }
  },

  importCategories: async (req, res) => {
    try {
      const { csvBase64 } = req.body;
      if (!csvBase64 || typeof csvBase64 !== 'string') {
        logger.error('Missing CSV data');
        return res.status(400).json({ error: 'CSV data is required as a Base64 string' });
      }

      const matches = csvBase64.match(/^data:text\/csv;base64,(.+)$/);
      if (!matches || !matches[1]) {
        logger.error('Invalid CSV format', { csvBase64: csvBase64.substring(0, 50) + '...' });
        return res.status(400).json({ error: 'Invalid Base64 CSV format. Use data:text/csv;base64,[data]' });
      }

      const csvData = Buffer.from(matches[1], 'base64').toString('utf-8');
      const results = [];
      const errors = [];

      const stream = Readable.from(csvData).pipe(csvParser());
      for await (const row of stream) {
        results.push({
          categoryName: row.categoryName?.trim(),
          categoryDescription: row.categoryDescription?.trim(),
          subcategoryName: row.subcategoryName?.trim(),
          subcategoryDescription: row.subcategoryDescription?.trim(),
          image: row.image?.trim(),
          parentId: row.parentId?.trim(),
        });
      }

      for (const row of results) {
        const { categoryName, categoryDescription, subcategoryName, subcategoryDescription, image, parentId } = row;
        if (!categoryName || !categoryDescription || !subcategoryName || !subcategoryDescription) {
          errors.push(`Missing fields in row: ${JSON.stringify(row)}`);
          continue;
        }

        // Validate parentId if provided
        if (parentId) {
          if (!mongoose.isValidObjectId(parentId)) {
            errors.push(`Invalid parentId format in row: ${parentId}`);
            continue;
          }
          const parentCategory = await Category.findOne({ parentId });
          if (!parentCategory) {
            errors.push(`Parent category not found for parentId: ${parentId}`);
            continue;
          }
        }

        let category = await Category.findOne({ name: categoryName });
        if (!category) {
          category = new Category({
            name: categoryName,
            description: categoryDescription,
            image: image || null,
            parentId: parentId || undefined,
            subcategories: [],
          });
        }

        if (!category.subcategories.some(sub => sub.name === subcategoryName)) {
          category.subcategories.push({
            name: subcategoryName,
            description: subcategoryDescription,
          });
          await category.save();
        } else {
          errors.push(`Duplicate subcategory "${subcategoryName}" for "${categoryName}"`);
        }
      }

      logger.info('CSV import completed', { processed: results.length, errors: errors.length });
      res.status(200).json({
        message: 'CSV imported successfully',
        categoriesProcessed: results.length,
        errors,
      });
    } catch (error) {
      logger.error('Import failed', { error: error.message });
      res.status(500).json({ error: 'Failed to import categories', details: error.message });
    }
  },

  getAllCategories: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const categories = await Category.find()
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Category.countDocuments();
      if (!categories.length) {
        logger.info('No categories found');
        return res.status(404).json({ message: 'No categories found' });
      }

      const formattedCategories = categories.map(category => ({
        id: category._id.toString(),
        name: category.name,
        description: category.description,
        image: category.image ? `${req.protocol}://${req.get('host')}${category.image}` : null,
        parentId: category.parentId ? category.parentId.toString() : null,
        subcategories: category.subcategories,
      }));

      logger.info('Categories retrieved', { count: categories.length });
      res.status(200).json({
        categories: formattedCategories,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      logger.error('Get all categories failed', { error: error.message });
      res.status(500).json({ error: 'Failed to retrieve categories' });
    }
  },

  getSubcategories: async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        logger.error('Invalid category ID format', { id });
        return res.status(400).json({ error: 'Invalid category ID format' });
      }

      const category = await Category.findById(id);
      if (!category) {
        logger.error('Category not found', { id });
        return res.status(404).json({ error: 'Category not found' });
      }

      logger.info('Subcategories retrieved', { id, parentId: category.parentId });
      res.status(200).json(category.subcategories);
    } catch (error) {
      logger.error('Get subcategories failed', { error: error.message, id: req.params.id });
      res.status(400).json({ error: 'Invalid category ID' });
    }
  },
};

module.exports = categoryController;