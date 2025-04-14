require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const config = require('./config');
const productRoutes = require('./routes/productRoutes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
app.use(express.json());

const startServer = async () => {
  try {
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB connected successfully');
    app.listen(config.port, () => {
      logger.info(`Product Service running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start Product Service', { error: error.message });
    process.exit(1);
  }
};

app.use('/products', productRoutes);
app.use(errorHandler);

startServer();