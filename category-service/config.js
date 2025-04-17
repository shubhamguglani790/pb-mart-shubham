require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3003,
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/indiamart',
};