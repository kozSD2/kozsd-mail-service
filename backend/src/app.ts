import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

import config from './config';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { loggerMiddleware } from './middleware/logger';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import emailRoutes from './routes/emails';
import attachmentRoutes from './routes/attachments';
import adminRoutes from './routes/admin';

class App {
  public express: express.Application;

  constructor() {
    this.express = express();
    this.setMiddlewares();
    this.setRoutes();
    this.setErrorHandling();
  }

  private setMiddlewares(): void {
    // Basic middleware
    this.express.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"]
        }
      }
    }));

    this.express.use(cors(config.cors));
    this.express.use(compression());
    this.express.use(cookieParser());
    this.express.use(express.json({ limit: '10mb' }));
    this.express.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    if (config.nodeEnv !== 'test') {
      this.express.use(morgan('combined'));
    }
    this.express.use(loggerMiddleware);

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: (req) => {
        const user = (req as any).user;
        if (!user) return 20; // Unauthenticated users get fewer requests
        if (user.isAdmin) return config.rateLimit.adminUserLimit;
        if (user.isEduDomain) return config.rateLimit.eduUserLimit;
        return config.rateLimit.normalUserLimit;
      },
      message: {
        error: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false
    });

    // Speed limiter for heavy operations
    const speedLimiter = slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 10, // Allow 10 requests per windowMs without delay
      delayMs: 500, // Add 500ms delay per request after delayAfter
      maxDelayMs: 20000 // Maximum delay of 20 seconds
    });

    this.express.use('/api/', limiter);
    this.express.use('/api/emails', speedLimiter);
    this.express.use('/api/attachments', speedLimiter);
  }

  private setRoutes(): void {
    // Health check
    this.express.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API routes
    this.express.use('/api/auth', authRoutes);
    this.express.use('/api/users', authMiddleware, userRoutes);
    this.express.use('/api/emails', authMiddleware, emailRoutes);
    this.express.use('/api/attachments', authMiddleware, attachmentRoutes);
    this.express.use('/api/admin', authMiddleware, adminRoutes);

    // 404 handler
    this.express.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString()
      });
    });
  }

  private setErrorHandling(): void {
    this.express.use(errorHandler);
  }
}

export default new App().express;