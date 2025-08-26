require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const logger = require('./config/logger');
const { setupSwagger } = require('./config/swagger');
const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initializeMetrics } = require('./middleware/metrics');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const mailRoutes = require('./routes/mail');
const { errorHandler } = require('./middleware/errorHandler');
const { notFoundHandler } = require('./middleware/notFoundHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  })
);

// Initialize metrics
initializeMetrics(app);

// Setup API documentation
setupSwagger(app);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/mail', mailRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = signal => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  global.server.close(err => {
    if (err) {
      logger.error('Error during server shutdown:', err);
      process.exit(1);
    }

    logger.info('HTTP server closed.');

    // Close database connections
    // Close Redis connections
    // Add other cleanup tasks here

    logger.info('Graceful shutdown completed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    // Initialize database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Initialize Redis
    await connectRedis();
    logger.info('Redis connected successfully');

    const server = app.listen(PORT, () => {
      logger.info(`KozSD Mail Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Store server reference for graceful shutdown
    global.server = server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
