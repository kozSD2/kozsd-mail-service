import { Request, Response, NextFunction } from 'express';
import { KozSDError, ValidationError, AuthenticationError, NotFoundError } from '@kozsd/shared';
import logger from '../utils/logger';

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  stack?: string;
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error(`Error in ${req.method} ${req.path}:`, error);

  let statusCode = 500;
  let message = 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';

  // Handle known error types
  if (error instanceof KozSDError) {
    statusCode = error.statusCode;
    message = error.message;
    errorCode = error.code;
  } else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = 'Invalid JSON in request body';
    errorCode = 'INVALID_JSON';
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
    errorCode = 'VALIDATION_ERROR';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    errorCode = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
    errorCode = 'TOKEN_EXPIRED';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    message = `File upload error: ${error.message}`;
    errorCode = 'FILE_UPLOAD_ERROR';
  }

  const errorResponse: ErrorResponse = {
    success: false,
    error: errorCode,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.path
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
}

// Async error wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Custom error classes for common scenarios
export class DatabaseError extends KozSDError {
  constructor(message: string = 'Database operation failed') {
    super(message, 'DATABASE_ERROR', 500);
    this.name = 'DatabaseError';
  }
}

export class FileUploadError extends KozSDError {
  constructor(message: string = 'File upload failed') {
    super(message, 'FILE_UPLOAD_ERROR', 400);
    this.name = 'FileUploadError';
  }
}

export class EmailSendError extends KozSDError {
  constructor(message: string = 'Failed to send email') {
    super(message, 'EMAIL_SEND_ERROR', 500);
    this.name = 'EmailSendError';
  }
}