import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'redis';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Redis client for rate limiting
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.connect().catch((err) => {
  logger.error('Redis Connection Error:', err);
});

// Check if email is .edu domain
const isEduEmail = (email: string): boolean => {
  return email.toLowerCase().endsWith('.edu');
};

// General rate limiter
export const rateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'kozsd_rate_limit:'
  }),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: 100, // General API limit
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown';
  }
});

// Email sending rate limiter
export const emailRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const userEmail = req.user?.email || '';
  const isEdu = isEduEmail(userEmail);
  
  const maxRequests = isEdu 
    ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS_EDU || '200', 10)
    : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '50', 10);

  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10); // 1 hour

  const limiter = rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: `kozsd_email_limit:${req.user?.id}:`
    }),
    windowMs,
    max: maxRequests,
    message: {
      error: `Email sending limit exceeded. ${isEdu ? 'Educational' : 'Regular'} users can send ${maxRequests} emails per hour.`,
      retryAfter: '1 hour',
      limit: maxRequests,
      userType: isEdu ? 'educational' : 'regular'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      return req.user?.id || req.ip || 'unknown';
    },
    onLimitReached: (req: Request) => {
      logger.warn(`Email rate limit exceeded for user ${req.user?.id} (${userEmail})`);
    }
  });

  limiter(req, res, next);
};

// Authentication rate limiter
export const authRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'kozsd_auth_limit:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown';
  },
  onLimitReached: (req: Request) => {
    logger.warn(`Authentication rate limit exceeded for IP ${req.ip}`);
  }
});

// Password reset rate limiter
export const passwordResetRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'kozsd_password_reset:'
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: {
    error: 'Too many password reset attempts, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.body.email || req.ip || 'unknown';
  }
});

export { redisClient };