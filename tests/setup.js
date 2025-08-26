// Test setup file
const logger = require('../src/config/logger');

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.BCRYPT_ROUNDS = '1'; // Faster bcrypt for tests

// Suppress logs during testing unless explicitly enabled
if (!process.env.ENABLE_TEST_LOGS) {
  logger.transports.forEach(transport => {
    transport.silent = true;
  });
}

// Global test timeout
jest.setTimeout(10000);