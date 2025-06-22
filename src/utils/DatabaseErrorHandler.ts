import { ObjectId } from 'mongodb';

interface ErrorClassification {
  code: string;
  severity: string;
  retryable: boolean;
  category: string;
}

interface DatabaseContext {
  operation: string;
  collection?: string;
  database?: string;
  filter?: Record<string, any>;
  document?: Record<string, any>;
  pipeline?: Record<string, any>[];
  requestId?: string;
  userId?: string;
  duration?: number;
  serviceName?: string;
  options?: Record<string, any>;
}

interface Logger {
  error: (message: string, meta?: Record<string, any>) => void;
  warn: (message: string, meta?: Record<string, any>) => void;
  info: (message: string, meta?: Record<string, any>) => void;
}

interface StandardizedErrorResponse {
  success: false;
  error: {
    id: string;
    code: string;
    message: string;
    severity: string;
    retryable: boolean;
    timestamp: string;
  };
  metadata: {
    requestId?: string;
    operation: string;
    service?: string;
  };
}

/**
 * Comprehensive MongoDB error handler with classification and standardized responses
 */
export class DatabaseErrorHandler {
  static readonly DATABASE_ERRORS = {
    CONNECTION_FAILED: 'MONGO_CONNECTION_FAILED',
    TIMEOUT: 'MONGO_TIMEOUT',
    AUTHENTICATION_FAILED: 'MONGO_AUTH_FAILED',
    NETWORK_ERROR: 'MONGO_NETWORK_ERROR',
    POOL_EXHAUSTED: 'MONGO_POOL_EXHAUSTED',
    OPERATION_FAILED: 'MONGO_OPERATION_FAILED',
    VALIDATION_ERROR: 'MONGO_VALIDATION_ERROR',
    DUPLICATE_KEY: 'MONGO_DUPLICATE_KEY',
    NOT_FOUND: 'MONGO_NOT_FOUND',
    PERMISSION_DENIED: 'MONGO_PERMISSION_DENIED',
    WRITE_CONFLICT: 'MONGO_WRITE_CONFLICT',
    INDEX_ERROR: 'MONGO_INDEX_ERROR',
    TRANSACTION_FAILED: 'MONGO_TRANSACTION_FAILED'
  } as const;

  static readonly ERROR_SEVERITY = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
  } as const;

  /**
   * Classify database error based on error properties
   */
  static classify(error: Error & { code?: number | string; name?: string }): ErrorClassification {
    // MongoDB specific errors
    if (error.name === 'MongoNetworkError') {
      return {
        code: this.DATABASE_ERRORS.NETWORK_ERROR,
        severity: this.ERROR_SEVERITY.HIGH,
        retryable: true,
        category: 'network'
      };
    }
    
    if (error.name === 'MongoTimeoutError') {
      return {
        code: this.DATABASE_ERRORS.TIMEOUT,
        severity: this.ERROR_SEVERITY.MEDIUM,
        retryable: true,
        category: 'timeout'
      };
    }
    
    if (error.code === 11000 || error.code === 11001) { // Duplicate key error
      return {
        code: this.DATABASE_ERRORS.DUPLICATE_KEY,
        severity: this.ERROR_SEVERITY.LOW,
        retryable: false,
        category: 'validation'
      };
    }
    
    if (error.name === 'MongoServerError' && error.code === 13) { // Unauthorized
      return {
        code: this.DATABASE_ERRORS.AUTHENTICATION_FAILED,
        severity: this.ERROR_SEVERITY.CRITICAL,
        retryable: false,
        category: 'authentication'
      };
    }

    if (error.name === 'MongoServerError' && error.code === 112) { // Write conflict
      return {
        code: this.DATABASE_ERRORS.WRITE_CONFLICT,
        severity: this.ERROR_SEVERITY.MEDIUM,
        retryable: true,
        category: 'concurrency'
      };
    }

    if (error.name === 'MongoServerError' && (error.code === 85 || error.code === 86)) { // Index errors
      return {
        code: this.DATABASE_ERRORS.INDEX_ERROR,
        severity: this.ERROR_SEVERITY.HIGH,
        retryable: false,
        category: 'schema'
      };
    }

    if (error.name === 'MongoTransactionError') {
      return {
        code: this.DATABASE_ERRORS.TRANSACTION_FAILED,
        severity: this.ERROR_SEVERITY.HIGH,
        retryable: true,
        category: 'transaction'
      };
    }
    
    // Redis specific errors
    if (error.name === 'ReplyError') {
      return {
        code: this.DATABASE_ERRORS.OPERATION_FAILED,
        severity: this.ERROR_SEVERITY.MEDIUM,
        retryable: false,
        category: 'command'
      };
    }
    
    if (error.message.includes('ECONNREFUSED') || error.code === 'ECONNREFUSED') {
      return {
        code: this.DATABASE_ERRORS.CONNECTION_FAILED,
        severity: this.ERROR_SEVERITY.CRITICAL,
        retryable: true,
        category: 'connection'
      };
    }
    
    if (error.message.includes('ETIMEDOUT') || error.code === 'ETIMEDOUT') {
      return {
        code: this.DATABASE_ERRORS.TIMEOUT,
        severity: this.ERROR_SEVERITY.HIGH,
        retryable: true,
        category: 'timeout'
      };
    }
    
    // Qdrant specific errors
    if (error.message.includes('vector dimension')) {
      return {
        code: this.DATABASE_ERRORS.VALIDATION_ERROR,
        severity: this.ERROR_SEVERITY.MEDIUM,
        retryable: false,
        category: 'validation'
      };
    }
    
    // Generic database errors
    if (error.message.toLowerCase().includes('pool')) {
      return {
        code: this.DATABASE_ERRORS.POOL_EXHAUSTED,
        severity: this.ERROR_SEVERITY.HIGH,
        retryable: true,
        category: 'pool'
      };
    }
    
    // Default classification
    return {
      code: 'MONGO_UNKNOWN_ERROR',
      severity: this.ERROR_SEVERITY.HIGH,
      retryable: false,
      category: 'unknown'
    };
  }
  
  /**
   * Handle database error with appropriate response
   */
  static async handle(
    error: Error,
    context: DatabaseContext,
    logger: Logger
  ): Promise<StandardizedErrorResponse> {
    const classification = this.classify(error);
    const errorId = this.generateErrorId();
    
    // Log error with full context
    logger.error('MongoDB operation failed', {
      errorId,
      code: classification.code,
      severity: classification.severity,
      category: classification.category,
      retryable: classification.retryable,
      originalError: {
        name: error.name,
        message: error.message,
        code: (error as any).code,
        stack: error.stack
      },
      context: {
        operation: context.operation,
        collection: context.collection,
        database: context.database,
        filter: context.filter ? this.sanitizeFilter(context.filter) : undefined,
        document: context.document ? this.sanitizeDocument(context.document) : undefined,
        pipeline: context.pipeline ? this.sanitizePipeline(context.pipeline) : undefined,
        requestId: context.requestId,
        userId: context.userId,
        timestamp: new Date().toISOString()
      },
      performance: {
        duration: context.duration,
        memoryUsage: process.memoryUsage()
      }
    });
    
    // Send alert for critical errors
    if (classification.severity === this.ERROR_SEVERITY.CRITICAL) {
      await this.sendAlert(error, classification, context);
    }
    
    // Return standardized error
    return {
      success: false,
      error: {
        id: errorId,
        code: classification.code,
        message: this.getUserFriendlyMessage(classification),
        severity: classification.severity,
        retryable: classification.retryable,
        timestamp: new Date().toISOString()
      },
      metadata: {
        requestId: context.requestId,
        operation: context.operation,
        service: context.serviceName
      }
    };
  }
  
  /**
   * Generate unique error ID for tracking
   */
  static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(classification: ErrorClassification): string {
    const messages: Record<string, string> = {
      [this.DATABASE_ERRORS.CONNECTION_FAILED]: 'Database connection temporarily unavailable',
      [this.DATABASE_ERRORS.TIMEOUT]: 'Database operation timed out, please try again',
      [this.DATABASE_ERRORS.DUPLICATE_KEY]: 'This record already exists',
      [this.DATABASE_ERRORS.NOT_FOUND]: 'Requested data not found',
      [this.DATABASE_ERRORS.PERMISSION_DENIED]: 'Insufficient permissions for this operation',
      [this.DATABASE_ERRORS.VALIDATION_ERROR]: 'Invalid data provided',
      [this.DATABASE_ERRORS.OPERATION_FAILED]: 'Database operation failed',
      [this.DATABASE_ERRORS.POOL_EXHAUSTED]: 'Database is temporarily busy, please try again',
      [this.DATABASE_ERRORS.WRITE_CONFLICT]: 'Data was modified by another operation, please retry',
      [this.DATABASE_ERRORS.INDEX_ERROR]: 'Database index error occurred',
      [this.DATABASE_ERRORS.TRANSACTION_FAILED]: 'Transaction failed, please try again',
      'MONGO_UNKNOWN_ERROR': 'An unexpected database error occurred'
    };
    
    return messages[classification.code] || 'Database operation failed';
  }
  
  /**
   * Send alert for critical errors
   */
  static async sendAlert(
    error: Error,
    classification: ErrorClassification,
    context: DatabaseContext
  ): Promise<void> {
    // Log critical alert (in production, this would integrate with monitoring systems)
    console.error('🚨 CRITICAL DATABASE ERROR - ALERT TRIGGERED', {
      error: error.message,
      classification,
      context: {
        operation: context.operation,
        database: context.database,
        serviceName: context.serviceName
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
    
    // TODO: Integrate with monitoring systems (Slack, PagerDuty, etc.)
  }
  
  /**
   * Sanitize MongoDB filter for logging (remove sensitive data)
   */
  static sanitizeFilter(filter: Record<string, any>): Record<string, any> {
    return this.sanitizeObject(filter);
  }

  /**
   * Sanitize MongoDB document for logging (remove sensitive data)
   */
  static sanitizeDocument(document: Record<string, any>): Record<string, any> {
    return this.sanitizeObject(document);
  }

  /**
   * Sanitize MongoDB aggregation pipeline for logging
   */
  static sanitizePipeline(pipeline: Record<string, any>[]): Record<string, any>[] {
    if (!Array.isArray(pipeline)) return pipeline;
    
    return pipeline.map(stage => this.sanitizeObject(stage));
  }

  /**
   * Sanitize generic object for logging (remove sensitive data)
   */
  static sanitizeObject(obj: any): any {
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
  static sanitizeQuery(query: Record<string, any>): Record<string, any> {
    return this.sanitizeObject(query);
  }
}

export default DatabaseErrorHandler;
