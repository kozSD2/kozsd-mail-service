const express = require('express');
const { getPool } = require('../config/database');
const { getRedisClient } = require('../config/redis');
const logger = require('../config/logger');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       example: connected
 *                     redis:
 *                       type: string
 *                       example: connected
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {}
    };

    try {
      // Check database connection
      const pool = getPool();
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      healthCheck.services.database = 'connected';
    } catch (error) {
      logger.error('Database health check failed:', error);
      healthCheck.services.database = 'disconnected';
      healthCheck.status = 'unhealthy';
    }

    try {
      // Check Redis connection
      const redisClient = getRedisClient();
      await redisClient.ping();
      healthCheck.services.redis = 'connected';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      healthCheck.services.redis = 'disconnected';
      healthCheck.status = 'unhealthy';
    }

    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  })
);

/**
 * @swagger
 * /api/health/liveness:
 *   get:
 *     summary: Liveness probe for Kubernetes
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get('/liveness', (req, res) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

/**
 * @swagger
 * /api/health/readiness:
 *   get:
 *     summary: Readiness probe for Kubernetes
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready to accept traffic
 *       503:
 *         description: Service is not ready
 */
router.get(
  '/readiness',
  asyncHandler(async (req, res) => {
    let ready = true;
    const checks = {};

    try {
      const pool = getPool();
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      checks.database = true;
    } catch (error) {
      checks.database = false;
      ready = false;
    }

    try {
      const redisClient = getRedisClient();
      await redisClient.ping();
      checks.redis = true;
    } catch (error) {
      checks.redis = false;
      ready = false;
    }

    const statusCode = ready ? 200 : 503;
    res.status(statusCode).json({
      ready,
      checks,
      timestamp: new Date().toISOString()
    });
  })
);

module.exports = router;
