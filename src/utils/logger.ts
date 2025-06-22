export interface LogLevel {
  ERROR: number;
  WARN: number;
  INFO: number;
  DEBUG: number;
}

export const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

export class Logger {
  private serviceName: string;
  private level: number;

  constructor(serviceName: string, level: number = LOG_LEVELS.INFO) {
    this.serviceName = serviceName;
    this.level = level;
  }

  error(message: string, ...args: any[]): void {
    if (this.level >= LOG_LEVELS.ERROR) {
      console.error(`[${this.serviceName}] ERROR:`, message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level >= LOG_LEVELS.WARN) {
      console.warn(`[${this.serviceName}] WARN:`, message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level >= LOG_LEVELS.INFO) {
      console.info(`[${this.serviceName}] INFO:`, message, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.level >= LOG_LEVELS.DEBUG) {
      console.debug(`[${this.serviceName}] DEBUG:`, message, ...args);
    }
  }
}

// Create logger factory function
const createLogger = (serviceName: string): Logger => new Logger(serviceName);

export default createLogger;
