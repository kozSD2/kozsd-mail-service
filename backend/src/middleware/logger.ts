import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface LogEntry {
  method: string;
  url: string;
  statusCode?: number;
  responseTime?: number;
  userAgent?: string;
  ip: string;
  userId?: string;
  timestamp: string;
}

/**
 * Enhanced logging middleware
 */
export function loggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Get IP address (handle proxy headers)
  const ip = req.ip || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress ||
             (req.connection as any)?.socket?.remoteAddress ||
             'unknown';

  const logEntry: LogEntry = {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip,
    timestamp
  };

  // Log the request
  logger.info(`${req.method} ${req.url} - ${ip}`);

  // Override res.end to capture response details
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    
    logEntry.statusCode = res.statusCode;
    logEntry.responseTime = responseTime;
    
    // Add user ID if available
    const user = (req as any).user;
    if (user) {
      logEntry.userId = user.id;
    }

    // Log completion
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    logger[level](`${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`);

    // Log detailed entry for analysis
    logger.debug('Request completed:', logEntry);

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
}