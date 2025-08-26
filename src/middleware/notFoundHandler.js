const logger = require('../config/logger');

const notFoundHandler = (req, res, _next) => {
  logger.warn(`404 - Not Found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    success: false,
    error: {
      message: 'Resource not found',
      path: req.originalUrl,
      method: req.method
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  notFoundHandler
};
