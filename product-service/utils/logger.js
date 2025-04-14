const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.printf(({ level, message, ...metadata }) => {
        return `[${level.toUpperCase()}]: ${message} ${Object.keys(metadata).length ? JSON.stringify(metadata) : ''}`;
      }),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
    new winston.transports.File({
      filename: 'logs/success.log',
      level: 'info',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
  ],
});

module.exports = logger;