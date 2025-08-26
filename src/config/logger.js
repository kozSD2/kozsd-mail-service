const winston = require('winston');
require('winston-daily-rotate-file');

const logLevel = process.env.LOG_LEVEL || 'info';
const logFilePath = process.env.LOG_FILE_PATH || './logs/app.log';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    if (stack) {
      log += `\nStack: ${stack}`;
    }

    if (Object.keys(meta).length > 0) {
      log += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// Configure transports
const transports = [
  new winston.transports.Console({
    level: logLevel,
    format: winston.format.combine(winston.format.colorize(), winston.format.simple())
  })
];

// Add file transport for production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.DailyRotateFile({
      level: logLevel,
      filename: logFilePath.replace('.log', '-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports,
  exitOnError: false
});

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(new winston.transports.File({ filename: './logs/exceptions.log' }));

logger.rejections.handle(new winston.transports.File({ filename: './logs/rejections.log' }));

module.exports = logger;
