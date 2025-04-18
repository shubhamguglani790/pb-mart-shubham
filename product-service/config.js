require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3,
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/indiamart',
  jwtPublicKey: process.env.JWT_PUBLIC_KEY || 'your_key',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost',
  categoryServiceUrl: process.env.CATEGORY_SERVICE_URL || 'http://localhost:3333',
};