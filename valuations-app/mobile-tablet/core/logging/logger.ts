/**
 * Structured Logging & Redaction
 * 
 * Provides consistent, redacted logging for debugging without leaking PII/secrets.
 * Implements correlation ID support and redaction patterns for sensitive data.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  endpoint?: string;
  operation?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  data?: any;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private level: LogLevel;
  private correlationId?: string;

  constructor(levelEnvVar: string = 'LOG_LEVEL') {
    this.level = this.parseLogLevel(process.env[levelEnvVar] || 'info');
  }

  private parseLogLevel(level: string): LogLevel {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const index = levels.indexOf(level.toLowerCase() as LogLevel);
    return index >= 0 ? levels[index] : 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private redactSensitiveData(data: any): any {
    if (typeof data === 'string') {
      return this.redactString(data);
    }
    
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        return data.map(item => this.redactSensitiveData(item));
      }
      
      const redacted: any = {};
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('email') || 
            lowerKey.includes('token') || 
            lowerKey.includes('password') ||
            lowerKey.includes('secret') ||
            lowerKey.includes('key')) {
          redacted[key] = this.redactString(String(value));
        } else {
          redacted[key] = this.redactSensitiveData(value);
        }
      }
      return redacted;
    }
    
    return data;
  }

  private redactString(str: string): string {
    if (!str || str.length === 0) return str;
    
    // Email redaction: user@domain.com -> <email_hash:abc123>
    if (str.includes('@') && str.includes('.')) {
      const hash = this.simpleHash(str);
      return `<email_hash:${hash.substring(0, 8)}>`;
    }
    
    // Token redaction: eyJhbGciOiJIUzI1NiIs... -> <token:eyJhbG...len:123>
    if (str.length > 20 && (str.startsWith('eyJ') || str.includes('Bearer'))) {
      const prefix = str.substring(0, 6);
      return `<token:${prefix}...len:${str.length}>`;
    }
    
    // Password/secret redaction: any string that looks like a password
    if (str.length > 8 && /^[a-zA-Z0-9+/=]+$/.test(str)) {
      return `<secret:len:${str.length}>`;
    }
    
    // General sensitive data redaction
    if (str.length > 10) {
      return str.substring(0, 4) + '...[REDACTED]';
    }
    
    return str;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private formatLogEntry(level: LogLevel, message: string, context?: LogContext, data?: any, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ? this.redactSensitiveData(context) : undefined,
      data: data ? this.redactSensitiveData(data) : undefined
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    return entry;
  }

  private log(level: LogLevel, message: string, context?: LogContext, data?: any, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry = this.formatLogEntry(level, message, context, data, error);
    
    // Use appropriate console method based on level
    switch (level) {
      case 'debug':
        console.debug(JSON.stringify(entry, null, 2));
        break;
      case 'info':
        console.info(JSON.stringify(entry, null, 2));
        break;
      case 'warn':
        console.warn(JSON.stringify(entry, null, 2));
        break;
      case 'error':
        console.error(JSON.stringify(entry, null, 2));
        break;
    }
  }

  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  getCorrelationId(): string | undefined {
    return this.correlationId;
  }

  debug(message: string, context?: LogContext, data?: any): void {
    this.log('debug', message, { ...context, correlationId: this.correlationId }, data);
  }

  info(message: string, context?: LogContext, data?: any): void {
    this.log('info', message, { ...context, correlationId: this.correlationId }, data);
  }

  warn(message: string, context?: LogContext, data?: any): void {
    this.log('warn', message, { ...context, correlationId: this.correlationId }, data);
  }

  error(message: string, context?: LogContext, data?: any, error?: Error): void {
    this.log('error', message, { ...context, correlationId: this.correlationId }, data, error);
  }

  // Convenience methods for common logging patterns
  apiRequest(method: string, url: string, context?: LogContext, data?: any): void {
    this.info(`API Request: ${method} ${url}`, { ...context, operation: 'api_request' }, data);
  }

  apiResponse(status: number, url: string, context?: LogContext, data?: any): void {
    const level = status >= 400 ? 'error' : 'info';
    this.log(level, `API Response: ${status} ${url}`, { ...context, operation: 'api_response' }, data);
  }

  validationError(field: string, message: string, context?: LogContext, data?: any): void {
    this.warn(`Validation Error: ${field} - ${message}`, { ...context, operation: 'validation' }, data);
  }

  securityEvent(event: string, context?: LogContext, data?: any): void {
    this.warn(`Security Event: ${event}`, { ...context, operation: 'security' }, data);
  }

  performanceMetric(metric: string, value: number, context?: LogContext): void {
    this.debug(`Performance: ${metric} = ${value}ms`, { ...context, operation: 'performance' });
  }
}

// Create and export default logger instance
const logger = new Logger();
export default logger;

// Export factory function for creating custom loggers
export function createLogger(levelEnvVar?: string): Logger {
  return new Logger(levelEnvVar);
}

// Export utility functions for redaction
export function redactEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const hash = email.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return `<email_hash:${Math.abs(hash).toString(16).substring(0, 8)}>`;
}

export function redactToken(token: string): string {
  if (!token) return token;
  const prefix = token.substring(0, 6);
  return `<token:${prefix}...len:${token.length}>`;
}

export function redactSensitiveString(str: string): string {
  if (!str) return str;
  
  if (str.includes('@') && str.includes('.')) {
    return redactEmail(str);
  }
  
  if (str.length > 20 && (str.startsWith('eyJ') || str.includes('Bearer'))) {
    return redactToken(str);
  }
  
  if (str.length > 10) {
    return str.substring(0, 4) + '...[REDACTED]';
  }
  
  return str;
}
