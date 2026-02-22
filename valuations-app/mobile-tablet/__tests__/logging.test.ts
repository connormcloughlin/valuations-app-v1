/**
 * Logging System Tests
 * 
 * Comprehensive tests for structured logging and redaction functionality.
 */

import { logger, createLogger, redactEmail, redactToken, redactSensitiveString } from '../core/logging';

describe('Logging System', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('Logger Instance', () => {
    it('should create logger with default configuration', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should create custom logger with different configuration', () => {
      const customLogger = createLogger('LOG_LEVEL');
      expect(customLogger).toBeDefined();
      expect(customLogger).not.toBe(logger);
    });
  });

  describe('Log Levels', () => {
    it('should log debug messages when level is debug', () => {
      const debugLogger = createLogger();
      debugLogger.debug('Debug message', { operation: 'test' });
      
      expect(console.debug).toHaveBeenCalled();
    });

    it('should log info messages when level is info', () => {
      logger.info('Info message', { operation: 'test' });
      
      expect(console.info).toHaveBeenCalled();
    });

    it('should log warn messages when level is warn', () => {
      logger.warn('Warning message', { operation: 'test' });
      
      expect(console.warn).toHaveBeenCalled();
    });

    it('should log error messages when level is error', () => {
      logger.error('Error message', { operation: 'test' });
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Structured Logging', () => {
    it('should include timestamp in log entries', () => {
      logger.info('Test message', { operation: 'test' });
      
      const logCall = (console.info as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.timestamp).toBeDefined();
      expect(new Date(logEntry.timestamp)).toBeInstanceOf(Date);
    });

    it('should include level in log entries', () => {
      logger.info('Test message', { operation: 'test' });
      
      const logCall = (console.info as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.level).toBe('info');
    });

    it('should include message in log entries', () => {
      logger.info('Test message', { operation: 'test' });
      
      const logCall = (console.info as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.message).toBe('Test message');
    });

    it('should include context in log entries', () => {
      const context = { operation: 'test', userId: '123' };
      logger.info('Test message', context);
      
      const logCall = (console.info as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.context).toEqual(context);
    });

    it('should include data in log entries', () => {
      const data = { key: 'value' };
      logger.info('Test message', { operation: 'test' }, data);
      
      const logCall = (console.info as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.data).toEqual(data);
    });

    it('should include error information in log entries', () => {
      const error = new Error('Test error');
      logger.error('Test message', { operation: 'test' }, undefined, error);
      
      const logCall = (console.error as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.error).toBeDefined();
      expect(logEntry.error.name).toBe('Error');
      expect(logEntry.error.message).toBe('Test error');
    });
  });

  describe('Redaction Functionality', () => {
    it('should redact email addresses', () => {
      const email = 'user@example.com';
      const redacted = redactEmail(email);
      
      expect(redacted).toMatch(/^<email_hash:[a-f0-9]+>$/);
      expect(redacted).not.toContain('@');
      expect(redacted).not.toContain('example.com');
    });

    it('should redact JWT tokens', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const redacted = redactToken(token);
      
      expect(redacted).toMatch(/^<token:eyJhbG\.\.\.len:\d+>$/);
      expect(redacted).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('should redact sensitive strings', () => {
      const sensitive = 'This is a sensitive string that should be redacted';
      const redacted = redactSensitiveString(sensitive);
      
      expect(redacted).toMatch(/^This\.\.\.\[REDACTED\]$/);
      expect(redacted).not.toContain('sensitive');
    });

    it('should handle empty strings', () => {
      expect(redactEmail('')).toBe('');
      expect(redactToken('')).toBe('');
      expect(redactSensitiveString('')).toBe('');
    });

    it('should handle null/undefined values', () => {
      expect(redactEmail(null as any)).toBe(null);
      expect(redactToken(undefined as any)).toBe(undefined);
    });
  });

  describe('Data Redaction in Logging', () => {
    it('should redact email addresses in context', () => {
      const context = { email: 'user@example.com', userId: '123' };
      logger.info('Test message', context);
      
      const logCall = (console.info as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.context.email).toMatch(/^<email_hash:[a-f0-9]+>$/);
      expect(logEntry.context.userId).toBe('123'); // Non-sensitive data preserved
    });

    it('should redact token fields in context', () => {
      const context = { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', userId: '123' };
      logger.info('Test message', context);
      
      const logCall = (console.info as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.context.token).toMatch(/^<token:eyJhbG\.\.\.len:\d+>$/);
      expect(logEntry.context.userId).toBe('123');
    });

    it('should redact password fields in context', () => {
      const context = { password: 'secret123', userId: '123' };
      logger.info('Test message', context);
      
      const logCall = (console.info as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.context.password).toMatch(/^<secret:len:\d+>$/);
      expect(logEntry.context.userId).toBe('123');
    });

    it('should redact nested objects', () => {
      const context = { 
        user: { 
          email: 'user@example.com', 
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          name: 'John Doe'
        }
      };
      logger.info('Test message', context);
      
      const logCall = (console.info as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.context.user.email).toMatch(/^<email_hash:[a-f0-9]+>$/);
      expect(logEntry.context.user.token).toMatch(/^<token:eyJhbG\.\.\.len:\d+>$/);
      expect(logEntry.context.user.name).toBe('John Doe'); // Non-sensitive data preserved
    });

    it('should redact arrays of sensitive data', () => {
      const context = { 
        emails: ['user1@example.com', 'user2@example.com'],
        tokens: ['token1', 'token2']
      };
      logger.info('Test message', context);
      
      const logCall = (console.info as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.context.emails).toHaveLength(2);
      expect(logEntry.context.emails[0]).toMatch(/^<email_hash:[a-f0-9]+>$/);
      expect(logEntry.context.emails[1]).toMatch(/^<email_hash:[a-f0-9]+>$/);
    });
  });

  describe('Convenience Methods', () => {
    it('should log API requests with structured format', () => {
      logger.apiRequest('GET', '/api/users', { userId: '123' }, { params: { page: 1 } });
      
      const logCall = (console.info as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.message).toBe('API Request: GET /api/users');
      expect(logEntry.context.operation).toBe('api_request');
      expect(logEntry.context.userId).toBe('123');
    });

    it('should log API responses with structured format', () => {
      logger.apiResponse(200, '/api/users', { userId: '123' }, { dataSize: 1024 });
      
      const logCall = (console.info as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.message).toBe('API Response: 200 /api/users');
      expect(logEntry.context.operation).toBe('api_response');
      expect(logEntry.context.userId).toBe('123');
    });

    it('should log validation errors with structured format', () => {
      logger.validationError('email', 'Invalid email format', { userId: '123' }, { value: 'invalid-email' });
      
      const logCall = (console.warn as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.message).toBe('Validation Error: email - Invalid email format');
      expect(logEntry.context.operation).toBe('validation');
      expect(logEntry.context.userId).toBe('123');
    });

    it('should log security events with structured format', () => {
      logger.securityEvent('Token refresh failed', { userId: '123' }, { reason: 'Invalid token' });
      
      const logCall = (console.warn as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.message).toBe('Security Event: Token refresh failed');
      expect(logEntry.context.operation).toBe('security');
      expect(logEntry.context.userId).toBe('123');
    });

    it('should log performance metrics with structured format', () => {
      logger.performanceMetric('api_response_time', 150, { endpoint: '/api/users' });
      
      const logCall = (console.debug as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.message).toBe('Performance: api_response_time = 150ms');
      expect(logEntry.context.operation).toBe('performance');
      expect(logEntry.context.endpoint).toBe('/api/users');
    });
  });

  describe('Correlation ID Support', () => {
    it('should set and get correlation ID', () => {
      const correlationId = 'test-correlation-123';
      logger.setCorrelationId(correlationId);
      
      expect(logger.getCorrelationId()).toBe(correlationId);
    });

    it('should include correlation ID in log entries', () => {
      const correlationId = 'test-correlation-123';
      logger.setCorrelationId(correlationId);
      logger.info('Test message', { operation: 'test' });
      
      const logCall = (console.info as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.context.correlationId).toBe(correlationId);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in log entry formatting gracefully', () => {
      // Test with circular reference
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;
      
      logger.info('Test message', { operation: 'test' }, circularObj);
      
      // Should not throw error
      expect(console.info).toHaveBeenCalled();
    });

    it('should handle null/undefined values gracefully', () => {
      logger.info('Test message', null, undefined);
      
      const logCall = (console.info as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.message).toBe('Test message');
      expect(logEntry.context).toBeUndefined();
      expect(logEntry.data).toBeUndefined();
    });
  });
});



