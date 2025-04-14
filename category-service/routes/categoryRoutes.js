const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.post('/', categoryController.createCategory);
router.get('/:id', categoryController.getCategory);
router.post('/:id/subcategories', categoryController.addSubcategory);
router.post('/import', upload.single('file'), categoryController.importCategories);

module.exports = router;