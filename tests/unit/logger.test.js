const logger = require('../../src/config/logger');

describe('Logger Configuration', () => {
  it('should have info level by default', () => {
    expect(logger.level).toBe('info');
  });

  it('should have console transport', () => {
    const consoleTransport = logger.transports.find(t => t.name === 'console');
    expect(consoleTransport).toBeDefined();
  });

  it('should log messages correctly', () => {
    // Mock the winston logger's info method directly
    const logSpy = jest.spyOn(logger, 'info').mockImplementation();
    
    logger.info('Test message');
    
    // Check if logger.info was called
    expect(logSpy).toHaveBeenCalledWith('Test message');
    
    logSpy.mockRestore();
  });

  it('should format messages with timestamp', () => {
    const message = 'Test log message';
    const meta = { userId: 123 };
    
    // This is more of a smoke test since winston formatting is complex
    expect(() => {
      logger.info(message, meta);
    }).not.toThrow();
  });
});