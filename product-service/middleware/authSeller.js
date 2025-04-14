const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authSeller = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    logger.error('No token provided in request');
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_PUBLIC_KEY || 'your-very-secure-secret-key');
    logger.info('Token verified in authSeller', { sub: decoded.sub, sellerId: decoded.sellerId });
    req.user = decoded; // Attach decoded token (sub, username, sellerId)
    next();
  } catch (error) {
    logger.error('Token verification failed in authSeller', { error: error.message });
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authSeller };