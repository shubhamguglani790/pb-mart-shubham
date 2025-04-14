// utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    // Console for all levels
    new winston.transports.Console(),
    // app.log for info and warn (excluding errors)
    new winston.transports.File({
      filename: 'logs/app.log',
      level: 'info',
      handleExceptions: false,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // error.log for errors only
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      handleExceptions: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

module.exports = logger;