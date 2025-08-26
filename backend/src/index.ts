import app from './app';
import config from './config';
import { PrismaClient } from '@prisma/client';
import { connectRedis } from './services/redis';
import { initializeMinIO } from './services/minio';
import logger from './utils/logger';

const prisma = new PrismaClient();

async function startServer() {
  try {
    // Initialize database connection
    logger.info('Connecting to database...');
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Initialize Redis connection
    logger.info('Connecting to Redis...');
    await connectRedis();
    logger.info('Redis connected successfully');

    // Initialize MinIO
    logger.info('Initializing MinIO...');
    await initializeMinIO();
    logger.info('MinIO initialized successfully');

    // Start the server
    const server = app.listen(config.port, () => {
      logger.info(`KozSD Mail Service API server started on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await prisma.$disconnect();
          logger.info('Database disconnected');
          
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();