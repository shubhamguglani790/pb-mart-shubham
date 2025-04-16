const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: 'info', // Base level for all logs
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}] : ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/success.log'),
      level: 'info', // Only info and above (success cases)
      handleExceptions: false, // Exceptions handled separately
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error', // Only error level (error cases)
      handleExceptions: true,
    }),
    new winston.transports.Console({
      level: 'debug', // Debug for console to see all logs
      handleExceptions: true,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(__dirname, '../logs/exceptions.log') }),
  ],
  exitOnError: false,
});

// Add a stream for custom logging if needed (optional)
logger.stream = {
  write: (message) => logger.info(message.trim()),
};

module.exports = logger;