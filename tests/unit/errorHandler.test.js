const { 
  AppError, 
  ValidationError, 
  UnauthorizedError, 
  NotFoundError, 
  ConflictError,
  TooManyRequestsError 
} = require('../../src/middleware/errorHandler');

describe('Error Handler Classes', () => {
  describe('AppError', () => {
    it('should create custom error with message and status code', () => {
      const error = new AppError('Test error', 400);
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with 400 status code', () => {
      const error = new ValidationError('Validation failed');
      
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });

    it('should include details if provided', () => {
      const details = { field: 'email', message: 'Invalid email' };
      const error = new ValidationError('Validation failed', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create unauthorized error with 401 status code', () => {
      const error = new UnauthorizedError('Access denied');
      
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('UnauthorizedError');
    });

    it('should use default message if none provided', () => {
      const error = new UnauthorizedError();
      
      expect(error.message).toBe('Unauthorized');
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with 404 status code', () => {
      const error = new NotFoundError('Resource not found');
      
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });
  });

  describe('ConflictError', () => {
    it('should create conflict error with 409 status code', () => {
      const error = new ConflictError('Resource already exists');
      
      expect(error.message).toBe('Resource already exists');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('ConflictError');
    });
  });

  describe('TooManyRequestsError', () => {
    it('should create rate limit error with 429 status code', () => {
      const error = new TooManyRequestsError('Rate limit exceeded');
      
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.statusCode).toBe(429);
      expect(error.name).toBe('TooManyRequestsError');
    });
  });
});