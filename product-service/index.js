const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const productRoutes = require('./routes/productRoutes');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

dotenv.config();
const app = express();

// Enable CORS for all routes
app.use(cors());

// Increase payload size limit to 10MB (or adjust as needed)
app.use(express.json({ limit: '50mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'Uploads'))); // Serve Uploads directory
app.use('/', productRoutes);

const uploadsDir = path.join(__dirname, 'Uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('MongoDB connected successfully'))
  .catch((err) => logger.error('MongoDB connection error', { error: err.message }));

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => logger.info(`Product Service running on port ${PORT}`));