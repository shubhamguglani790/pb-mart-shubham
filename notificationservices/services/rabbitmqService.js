// services/rabbitmqService.js
const amqp = require('amqplib');
const { rabbitmqUrl, queue } = require('../config/rapidmq');
const logger = require('../utils/logger');

class RabbitMQService {
  async connect() {
    try {
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(queue, { durable: true });
      logger.info('Connected to RabbitMQ', { url: rabbitmqUrl, queue });
    } catch (error) {
      throw error; // Throw to be caught higher up
    }
  }

  async getAllMessages() {
    try {
      if (!this.channel) await this.connect();
      const messages = [];
      let message;

      while ((message = await this.channel.get(queue, { noAck: false }))) {
        const parsedMessage = JSON.parse(message.content.toString());
        messages.push(parsedMessage);
        this.channel.nack(message, false, true);
      }

      logger.info('Retrieved messages from queue', { count: messages.length });
      return messages;
    } catch (error) {
      throw error; // Throw to controller
    }
  }

  async close() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      logger.info('RabbitMQ connection closed');
    } catch (error) {
      throw error; // Throw to be handled elsewhere
    }
  }
}

module.exports = new RabbitMQService();