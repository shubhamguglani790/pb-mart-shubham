// controllers/notificationController.js
const rabbitmqService = require('../services/rabbitmqService');
const logger = require('../utils/logger');
const { handleError } = require('../utils/errorHandler');

const getNotifications = async (req, res) => {
  try {
    const messages = await rabbitmqService.getAllMessages();
    logger.info('Fetched all notifications', { count: messages.length });
    res.status(200).json({ status: 'success', notifications: messages });
  } catch (error) {
    handleError(res, error, 'Failed to fetch notifications');
  }
};

const getHealth = async (req, res) => {
  try {
    if (!rabbitmqService.connection) {
      await rabbitmqService.connect();
    }
    await rabbitmqService.channel.assertQueue(rabbitmqService.queue, { durable: true });

    logger.info('Health check passed');
    res.status(200).json({
      status: 'healthy',
      service: 'notification-retriever',
      timestamp: new Date().toISOString(),
      rabbitmq: 'connected',
    });
  } catch (error) {
    handleError(res, error, 'Health check failed', 503);
  }
};

module.exports = {
  getNotifications,
  getHealth,
};