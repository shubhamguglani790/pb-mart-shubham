// utils/errorHandler.js
const logger = require('./logger');

const errorMiddleware = (err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
};

module.exports = { errorMiddleware };