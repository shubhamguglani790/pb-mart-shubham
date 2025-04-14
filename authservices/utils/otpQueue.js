const logger = require('./logger');

class OtpQueue {
  constructor() {
    this.queue = new Map();
    this.sellerIdCounter = 0; // Track sellerId
  }

  async add(email, username) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.sellerIdCounter += 1;
    const sellerId = this.sellerIdCounter.toString(); // 1, 2, 3, ...
    this.queue.set(email, { otp, username, sellerId });
    logger.info('OTP added to queue', { email, sellerId });
    return { otp, sellerId };
  }

  async getOtpByEmail(email) {
    return this.queue.get(email);
  }
}

module.exports = new OtpQueue();