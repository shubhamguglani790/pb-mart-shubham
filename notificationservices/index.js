// index.js
require('dotenv').config();
const express = require('express');
const notificationRoutes = require('./routes/notifications');
const rabbitmqService = require('./services/rabbitmqService');
const logger = require('./utils/logger');
const { handleError, errorMiddleware } = require('./utils/errorHandler');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use('/notifications', notificationRoutes);

app.use((req, res, next) => {
  logger.info('Registered routes:', {
    routes: app._router.stack
      .filter(r => r.route)
      .map(r => `${r.route.path} (${Object.keys(r.route.methods).join(', ')})`),
  });
  next();
});

// Global error middleware (catches unhandled errors)
app.use(errorMiddleware);

const startServer = async () => {
  try {
    await rabbitmqService.connect();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message }); // Log directly since no res object
    process.exit(1);
  }
};

startServer();

process.on('SIGTERM', async () => {
  logger.info('Shutting down...');
  await rabbitmqService.close();
  process.exit(0);
});