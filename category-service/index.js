const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const categoryRoutes = require('./routes/categoryRoutes');
const fs = require('fs');
const path = require('path');

dotenv.config();
const app = express();

app.use(express.json());
app.use('/categories', categoryRoutes);

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('MongoDB connected successfully'))
  .catch((err) => logger.error('MongoDB connection error', { error: err.message }));

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => logger.info(`Category Service running on port ${PORT}`));