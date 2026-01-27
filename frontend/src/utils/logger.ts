/**
 * Simple logger utility for frontend
 * In production, logs are sent to monitoring service
 * In development, logs go to console
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogData {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  error(message: string, data?: LogData): void {
    if (this.isDevelopment) {
      console.error('[ERROR]', message, data);
    }
    // TODO: Send to monitoring service in production
  }

  warn(message: string, data?: LogData): void {
    if (this.isDevelopment) {
      console.warn('[WARN]', message, data);
    }
  }

  info(message: string, data?: LogData): void {
    if (this.isDevelopment) {
      console.info('[INFO]', message, data);
    }
  }

  debug(message: string, data?: LogData): void {
    if (this.isDevelopment) {
      console.debug('[DEBUG]', message, data);
    }
  }
}

export const logger = new Logger();
export default logger;
