// utils/logger.js
const logger = {
  info: (message, data = {}) => console.log(`INFO: ${message}`, data),
  error: (message, data = {}) => console.error(`ERROR: ${message}`, data),
};

module.exports = logger;