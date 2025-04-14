const amqp = require('amqplib');
const config = require('../config');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

async function publishEvent(type, data) {
  try {
    const conn = await amqp.connect(config.rabbitmqUrl);
    const channel = await conn.createChannel();
    await channel.publish('product_events', `product.${type}`, Buffer.from(JSON.stringify(data)));
    await channel.close();
    await conn.close();
    logger.info('Event published', { type, id: data.id });
  } catch (error) {
    logger.error('RabbitMQ publish failed', { error: error.message, type, id: data.id });
  }
}

async function sendAuthRequest(token) {
  try {
    const conn = await amqp.connect(config.rabbitmqUrl);
    const channel = await conn.createChannel();
    const queue = 'auth.verify';
    const replyQueue = await channel.assertQueue('', { exclusive: true });
    const correlationId = uuidv4();

    logger.info('Sending auth request', { correlationId, token: token.slice(0, 10) + '...' });

    return new Promise((resolve, reject) => {
      channel.consume(
        replyQueue.queue,
        (msg) => {
          if (msg.properties.correlationId === correlationId) {
            const result = JSON.parse(msg.content.toString());
            logger.info('Received auth response', { correlationId, result });
            resolve(result);
          }
        },
        { noAck: true }
      );

      channel.sendToQueue(queue, Buffer.from(JSON.stringify({ token, correlationId })), {
        correlationId,
        replyTo: replyQueue.queue,
      });
    }).finally(async () => {
      await channel.close();
      await conn.close();
    });
  } catch (error) {
    logger.error('RabbitMQ auth request failed', { error: error.message });
    throw error;
  }
}

module.exports = { publishEvent, sendAuthRequest };