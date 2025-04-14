require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3333,
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/categories',
};