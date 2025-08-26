import winston from 'winston';
import path from 'path';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(process.cwd(), '../logs/combined_logs.json'),
      level: 'info'
    }),
    
    // File transport for errors only
    new winston.transports.File({
      filename: path.join(process.cwd(), '../logs/error.log'),
      level: 'error'
    })
  ]
});

// Activity logger for user actions
export const activityLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(process.cwd(), '../logs/activity_logs.json')
    })
  ]
});

// Cookie consent logger
export const cookieLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(process.cwd(), '../logs/cookies_data.json')
    })
  ]
});