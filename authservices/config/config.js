// config/config.js
require('dotenv').config();

const config = {
  port: process.env.PORT || 3111,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/authDB',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-key',
  nodeEnv: process.env.NODE_ENV || 'development'
};

module.exports = config;