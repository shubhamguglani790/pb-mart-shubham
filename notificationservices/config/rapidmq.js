// config/rabbitmq.js
require('dotenv').config();

module.exports = {
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  queue: process.env.RABBITMQ_QUEUE || 'sms_notifications',
};