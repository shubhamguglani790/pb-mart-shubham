const logger = require('../utils/logger');
const Category = require('../models/Category');
const fs = require('fs');
const csvParser = require('csv-parser');
const multer = require('multer');

const categoryController = {
  createCategory: async (req, res) => {
    try {
      const { name, description, subcategories } = req.body;
      if (!name) {
        logger.error('Missing name for category', { body: req.body });
        return res.status(400).json({ error: 'Name is required' });
      }

      if (subcategories) {
        if (!Array.isArray(subcategories)) {
          logger.error('Subcategories must be an array', { subcategories });
          return res.status(400).json({ error: 'Subcategories must be an array' });
        }
        for (const sub of subcategories) {
          if (!sub.name) {
            logger.error('Missing name for subcategory', { sub });
            return res.status(400).json({ error: 'Subcategory name is required' });
          }
        }
      }

      const category = new Category({
        name,
        description,
        subcategories: subcategories || [],
      });

      await category.save();
      logger.info('Category created', { id: category._id, name, subcategories: subcategories?.length || 0 });
      res.status(201).json({
        id: category._id.toString(),
        name,
        description,
        subcategories: category.subcategories,
      });
    } catch (error) {
      logger.error('Failed to create category', { error: error.message, body: req.body });
      res.status(400).json({ error: error.message });
    }
  },

  getCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const category = await Category.findById(id);
      if (!category) {
        logger.error('Category not found', { id });
        return res.status(404).json({ error: 'Category not found' });
      }

      logger.info('Category retrieved', { id, name: category.name });
      res.json({
        id: category._id.toString(),
        name: category.name,
        description: category.description,
        subcategories: category.subcategories,
      });
    } catch (error) {
      logger.error('Failed to get category', { error: error.message, id: req.params.id });
      res.status(400).json({ error: error.message });
    }
  },

  addSubcategory: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      if (!name) {
        logger.error('Missing name for subcategory', { body: req.body });
        return res.status(400).json({ error: 'Subcategory name is required' });
      }

      const category = await Category.findById(id);
      if (!category) {
        logger.error('Category not found', { id });
        return res.status(404).json({ error: 'Category not found' });
      }

      category.subcategories.push({ name, description });
      await category.save();

      logger.info('Subcategory added', { categoryId: id, subcategoryName: name });
      res.status(200).json({
        id: category._id.toString(),
        name: category.name,
        subcategories: category.subcategories,
      });
    } catch (error) {
      logger.error('Failed to add subcategory', { error: error.message, id: req.params.id });
      res.status(400).json({ error: error.message });
    }
  },

  importCategories: async (req, res) => {
    try {
      if (!req.file) {
        logger.error('No CSV file uploaded');
        return res.status(400).json({ error: 'CSV file is required' });
      }

      const results = [];
      const errors = [];

      fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on('data', (row) => {
          results.push({
            categoryName: row.categoryName?.trim(),
            categoryDescription: row.categoryDescription?.trim(),
            subcategoryName: row.subcategoryName?.trim(),
            subcategoryDescription: row.subcategoryDescription?.trim(),
          });
        })
        .on('end', async () => {
          try {
            for (const row of results) {
              const { categoryName, categoryDescription, subcategoryName, subcategoryDescription } = row;

              if (!categoryName) {
                errors.push(`Missing categoryName in row: ${JSON.stringify(row)}`);
                continue;
              }

              let category = await Category.findOne({ name: categoryName });
              if (!category) {
                category = new Category({
                  name: categoryName,
                  description: categoryDescription || '',
                  subcategories: [],
                });
              }

              if (subcategoryName) {
                if (!category.subcategories.some((sub) => sub.name === subcategoryName)) {
                  category.subcategories.push({
                    name: subcategoryName,
                    description: subcategoryDescription || '',
                  });
                } else {
                  errors.push(`Duplicate subcategory "${subcategoryName}" for category "${categoryName}"`);
                }
              }

              await category.save();
            }

            fs.unlinkSync(req.file.path);

            logger.info('CSV import completed', { categoriesProcessed: results.length, errors: errors.length });
            res.status(200).json({
              message: 'CSV imported successfully',
              categoriesProcessed: results.length,
              errors,
            });
          } catch (error) {
            logger.error('Failed to process CSV', { error: error.message });
            res.status(500).json({ error: 'Failed to process CSV', details: error.message });
          }
        })
        .on('error', (error) => {
          logger.error('CSV parsing error', { error: error.message });
          res.status(400).json({ error: 'Invalid CSV format', details: error.message });
        });
    } catch (error) {
      logger.error('Import categories failed', { error: error.message });
      if (error instanceof multer.MulterError && error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: 'Unexpected field name. Use "file" as the field name.' });
      }
      res.status(500).json({ error: 'Import failed', details: error.message });
    }
  },
};

module.exports = categoryController;