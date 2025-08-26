import Redis from 'redis';
import config from '../config';
import logger from '../utils/logger';

let redisClient: Redis.RedisClientType;

/**
 * Connect to Redis
 */
export async function connectRedis(): Promise<Redis.RedisClientType> {
  if (redisClient) {
    return redisClient;
  }

  const client = Redis.createClient({
    socket: {
      host: config.redis.host,
      port: config.redis.port
    },
    password: config.redis.password,
    database: config.redis.db
  });

  client.on('error', (error) => {
    logger.error('Redis connection error:', error);
  });

  client.on('connect', () => {
    logger.info('Connected to Redis');
  });

  client.on('disconnect', () => {
    logger.warn('Disconnected from Redis');
  });

  await client.connect();
  redisClient = client;
  
  return client;
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis.RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
}

/**
 * Cache operations
 */
export class CacheService {
  private client: Redis.RedisClientType;

  constructor() {
    this.client = getRedisClient();
  }

  /**
   * Set cache value with TTL
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    const serialized = JSON.stringify(value);
    await this.client.setEx(key, ttlSeconds, serialized);
  }

  /**
   * Get cache value
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  /**
   * Delete cache value
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Increment counter
   */
  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  /**
   * Set expiration on existing key
   */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  /**
   * Get keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  /**
   * Store user session
   */
  async setUserSession(userId: string, sessionData: any, ttlSeconds: number = 86400): Promise<void> {
    const key = `session:${userId}`;
    await this.set(key, sessionData, ttlSeconds);
  }

  /**
   * Get user session
   */
  async getUserSession(userId: string): Promise<any | null> {
    const key = `session:${userId}`;
    return await this.get(key);
  }

  /**
   * Delete user session
   */
  async deleteUserSession(userId: string): Promise<void> {
    const key = `session:${userId}`;
    await this.del(key);
  }

  /**
   * Store rate limit data
   */
  async setRateLimit(identifier: string, count: number, ttlSeconds: number): Promise<void> {
    const key = `ratelimit:${identifier}`;
    await this.set(key, count, ttlSeconds);
  }

  /**
   * Get rate limit data
   */
  async getRateLimit(identifier: string): Promise<number> {
    const key = `ratelimit:${identifier}`;
    const count = await this.get<number>(key);
    return count || 0;
  }

  /**
   * Increment rate limit counter
   */
  async incrementRateLimit(identifier: string, ttlSeconds: number): Promise<number> {
    const key = `ratelimit:${identifier}`;
    const count = await this.incr(key);
    
    if (count === 1) {
      await this.expire(key, ttlSeconds);
    }
    
    return count;
  }
}

export const cacheService = new CacheService();