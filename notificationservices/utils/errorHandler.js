// utils/errorHandler.js
const logger = require('./logger');

const handleError = (res, error, message, statusCode = 500) => {
  const errorDetails = {
    message: message || 'An unexpected error occurred',
    error: error.message || error.toString(),
    timestamp: new Date().toISOString(),
  };

  if (error.code === 'ECONNREFUSED') {
    errorDetails.message = `${message} - Service unavailable`;
    statusCode = 503;
  }

  logger.error(errorDetails.message, { error: errorDetails.error });
  res.status(statusCode).json(errorDetails);
};

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  handleError(res, err, message, statusCode);
};

module.exports = { handleError, errorMiddleware };