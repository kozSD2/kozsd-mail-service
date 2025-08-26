const redis = require('redis');
const logger = require('./logger');

let client;

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  retryStrategy: times => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

const connectRedis = async () => {
  try {
    client = redis.createClient({
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
        reconnectStrategy: redisConfig.retryStrategy
      },
      password: redisConfig.password
    });

    client.on('error', err => {
      logger.error('Redis connection error:', err);
    });

    client.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    client.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    client.on('ready', () => {
      logger.info('Redis ready for operations');
    });

    await client.connect();

    // Test the connection
    await client.ping();

    return client;
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

const getRedisClient = () => {
  if (!client) {
    throw new Error('Redis client not initialized');
  }
  return client;
};

const closeRedis = async () => {
  if (client) {
    await client.quit();
    logger.info('Redis connection closed');
  }
};

// Cache utility functions
const cacheSet = async (key, value, expiration = 3600) => {
  try {
    const serializedValue = JSON.stringify(value);
    await client.setEx(key, expiration, serializedValue);
    logger.debug(`Cache set: ${key}`);
  } catch (error) {
    logger.error('Cache set error:', error);
    throw error;
  }
};

const cacheGet = async key => {
  try {
    const value = await client.get(key);
    if (value) {
      logger.debug(`Cache hit: ${key}`);
      return JSON.parse(value);
    }
    logger.debug(`Cache miss: ${key}`);
    return null;
  } catch (error) {
    logger.error('Cache get error:', error);
    throw error;
  }
};

const cacheDelete = async key => {
  try {
    await client.del(key);
    logger.debug(`Cache deleted: ${key}`);
  } catch (error) {
    logger.error('Cache delete error:', error);
    throw error;
  }
};

const cacheExists = async key => {
  try {
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error('Cache exists error:', error);
    throw error;
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  closeRedis,
  cacheSet,
  cacheGet,
  cacheDelete,
  cacheExists
};
