const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const productRoutes = require('./routes/productRoutes');
const fs = require('fs');
const path = require('path');

dotenv.config();
const app = express();

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'Uploads'))); // Serve Uploads directory
app.use('/', productRoutes);

const uploadsDir = path.join(__dirname, 'Uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('MongoDB connected successfully'))
  .catch((err) => logger.error('MongoDB connection error', { error: err.message }));

const PORT = process.env.PORT || 3222;
app.listen(PORT, () => logger.info(`Product Service running on port ${PORT}`));