interface DatabaseContext {
  requestId?: string;
  userId?: string;
  database?: string;
  collection?: string;
  filter?: Record<string, any>;
  document?: Record<string, any>;
  pipeline?: Record<string, any>[];
  options?: Record<string, any>;
  startTime?: number;
}

interface Logger {
  info: (message: string, meta?: Record<string, any>) => void;
  warn: (message: string, meta?: Record<string, any>) => void;
  error: (message: string, meta?: Record<string, any>) => void;
}

interface MongoResult {
  matchedCount?: number;
  modifiedCount?: number;
  insertedCount?: number;
  deletedCount?: number;
  insertedId?: any;
  acknowledged?: boolean;
}

interface HealthStatus {
  healthy: boolean;
  responseTime?: number;
  connections?: any;
  serverStatus?: any;
}

interface ConnectionDetails {
  totalConnections?: number;
  activeConnections?: number;
  idleConnections?: number;
  poolSize?: number;
}

/**
 * Enhanced MongoDB logger with correlation and metrics
 */
export class DatabaseLogger {
  constructor(
    private serviceName: string,
    private logger: Logger
  ) {}
  
  /**
   * Log MongoDB operation start
   */
  logOperationStart(operation: string, context: DatabaseContext): void {
    this.logger.info('MongoDB operation started', {
      event: 'mongodb_operation_start',
      service: this.serviceName,
      operation,
      requestId: context.requestId,
      userId: context.userId,
      database: context.database,
      collection: context.collection,
      filter: context.filter ? this.sanitizeObject(context.filter) : undefined,
      document: context.document ? this.sanitizeObject(context.document) : undefined,
      pipeline: context.pipeline ? this.sanitizePipeline(context.pipeline) : undefined,
      options: context.options ? this.sanitizeObject(context.options) : undefined,
      timestamp: new Date().toISOString(),
      performance: {
        startTime: Date.now(),
        memoryBefore: process.memoryUsage()
      }
    });
  }
  
  /**
   * Log successful MongoDB operation
   */
  logOperationSuccess(operation: string, context: DatabaseContext, result: any): void {
    const duration = Date.now() - (context.startTime || 0);
    
    this.logger.info('MongoDB operation completed', {
      event: 'mongodb_operation_success',
      service: this.serviceName,
      operation,
      requestId: context.requestId,
      userId: context.userId,
      database: context.database,
      collection: context.collection,
      timestamp: new Date().toISOString(),
      performance: {
        duration,
        memoryAfter: process.memoryUsage(),
        resultSize: this.getResultSize(result)
      },
      result: {
        type: typeof result,
        matchedCount: (result as MongoResult)?.matchedCount,
        modifiedCount: (result as MongoResult)?.modifiedCount,
        insertedCount: (result as MongoResult)?.insertedCount,
        deletedCount: (result as MongoResult)?.deletedCount,
        insertedId: (result as MongoResult)?.insertedId,
        acknowledged: (result as MongoResult)?.acknowledged,
        documentCount: Array.isArray(result) ? result.length : (result ? 1 : 0),
        hasData: !!result
      }
    });
    
    // Log performance warning for slow operations
    if (duration > 1000) {
      this.logger.warn('Slow MongoDB operation detected', {
        event: 'mongodb_operation_slow',
        operation,
        duration,
        requestId: context.requestId,
        threshold: 1000,
        database: context.database,
        collection: context.collection
      });
    }
  }
  
  /**
   * Log MongoDB operation failure
   */
  logOperationFailure(operation: string, context: DatabaseContext, error: Error): void {
    const duration = Date.now() - (context.startTime || 0);
    
    this.logger.error('MongoDB operation failed', {
      event: 'mongodb_operation_failure',
      service: this.serviceName,
      operation,
      requestId: context.requestId,
      userId: context.userId,
      database: context.database,
      collection: context.collection,
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        code: (error as any).code,
        codeName: (error as any).codeName,
        stack: error.stack
      },
      performance: {
        duration,
        memoryAfter: process.memoryUsage()
      },
      context: {
        filter: context.filter ? this.sanitizeObject(context.filter) : undefined,
        document: context.document ? this.sanitizeObject(context.document) : undefined,
        pipeline: context.pipeline ? this.sanitizePipeline(context.pipeline) : undefined,
        options: context.options ? this.sanitizeObject(context.options) : undefined
      }
    });
  }
  
  /**
   * Log MongoDB health check
   */
  logHealthCheck(database: string, status: HealthStatus): void {
    const logLevel = status.healthy ? 'info' : 'error';
    
    this.logger[logLevel]('MongoDB health check', {
      event: 'mongodb_health_check',
      service: this.serviceName,
      database,
      status: status.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      details: status,
      performance: {
        responseTime: status.responseTime,
        connections: status.connections,
        serverStatus: status.serverStatus
      }
    });
  }
  
  /**
   * Log MongoDB connection events
   */
  logConnectionEvent(database: string, event: string, details: ConnectionDetails = {}): void {
    const logLevel = event === 'error' ? 'error' : 'info';
    
    this.logger[logLevel]('MongoDB connection event', {
      event: `mongodb_connection_${event}`,
      service: this.serviceName,
      database,
      timestamp: new Date().toISOString(),
      details,
      performance: {
        totalConnections: details.totalConnections,
        activeConnections: details.activeConnections,
        idleConnections: details.idleConnections,
        poolSize: details.poolSize
      }
    });
  }
  
  /**
   * Log retry attempt
   */
  logRetryAttempt(
    operation: string,
    attempt: number,
    maxAttempts: number,
    error: Error,
    context: DatabaseContext
  ): void {
    this.logger.warn('Database operation retry attempt', {
      event: 'db_operation_retry',
      service: this.serviceName,
      operation,
      attempt,
      maxAttempts,
      requestId: context.requestId,
      database: context.database,
      error: {
        name: error.name,
        message: error.message,
        code: (error as any).code
      },
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Sanitize MongoDB aggregation pipeline for logging
   */
  sanitizePipeline(pipeline: Record<string, any>[]): Record<string, any>[] {
    if (!Array.isArray(pipeline)) return pipeline;
    
    return pipeline.map(stage => this.sanitizeObject(stage));
  }

  /**
   * Sanitize generic object for logging (remove sensitive data)
   */
  sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'credential', 'hash', 'salt'];
    
    const sanitizeRecursive = (target: any): any => {
      if (Array.isArray(target)) {
        return target.map(item => sanitizeRecursive(item));
      }
      
      if (target && typeof target === 'object') {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(target)) {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
            result[key] = '[REDACTED]';
          } else if (typeof value === 'string' && value.length > 100) {
            result[key] = value.substring(0, 100) + '...[TRUNCATED]';
          } else {
            result[key] = sanitizeRecursive(value);
          }
        }
        return result;
      }
      
      return target;
    };
    
    return sanitizeRecursive(sanitized);
  }

  /**
   * Sanitize query for logging (legacy method for backward compatibility)
   */
  sanitizeQuery(query: Record<string, any>): Record<string, any> {
    return this.sanitizeObject(query);
  }
  
  /**
   * Sanitize parameters for logging
   */
  sanitizeParams(params: Record<string, any>): Record<string, any> {
    return this.sanitizeObject(params);
  }
  
  /**
   * Get result size for logging
   */
  getResultSize(result: any): number {
    if (!result) return 0;
    if (typeof result === 'string') return result.length;
    if (Array.isArray(result)) return result.length;
    try {
      return JSON.stringify(result).length;
    } catch {
      return 0;
    }
  }
}

export default DatabaseLogger;
