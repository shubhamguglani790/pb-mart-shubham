// index.js
const express = require('express');
const connectDB = require('./config/db');
const config = require('./config/config');
const authRoutes = require('./routes/authRoutes');
const logger = require('./utils/logger');
const { errorMiddleware } = require('./utils/errorHandler');

const app = express();

app.use(express.json());

// Connect to MongoDB
const startServer = async () => {
  try {
    await connectDB();
    logger.info('MongoDB connected successfully');
    app.listen(config.port, () => {
      logger.info(`Auth Service running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start Auth Service', { error: error.message });
    process.exit(1);
  }
};

// Routes
app.use('/api/auth', authRoutes);

// Global error middleware
app.use(errorMiddleware);

startServer();