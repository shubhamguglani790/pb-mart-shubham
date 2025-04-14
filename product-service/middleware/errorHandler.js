const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('Unhandled error', { error: err.message, path: req.path });
  res.status(500).json({ error: 'Something went wrong' });
}

module.exports = errorHandler;