import { DatabaseErrorHandler } from './DatabaseErrorHandler';
import { DatabaseLogger } from './DatabaseLogger';

interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  monitoringPeriod?: number;
}

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailureTime: number | null;
  successCount: number;
}

interface DatabaseContext {
  operation: string;
  serviceName: string;
  logger: any;
  requestId?: string;
  userId?: string;
  database?: string;
  collection?: string;
  filter?: Record<string, any>;
  document?: Record<string, any>;
  pipeline?: Record<string, any>[];
  options?: Record<string, any>;
  timeout?: number;
  startTime?: number;
}

interface OperationResult<T = any> {
  success: true;
  data: T;
  metadata: {
    requestId?: string;
    duration: number;
    timestamp: string;
    operation: string;
    service: string;
    collection?: string;
    database?: string;
  };
}

/**
 * Circuit breaker for database operations
 */
export class DatabaseCircuitBreaker {
  private failureThreshold: number;
  private resetTimeout: number;
  private monitoringPeriod: number;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failures: number = 0;
  private lastFailureTime: number | null = null;
  private successCount: number = 0;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.monitoringPeriod = options.monitoringPeriod || 10000;
  }
  
  /**
   * Execute operation through circuit breaker
   */
  async execute<T>(operation: () => Promise<T>, context: DatabaseContext): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - (this.lastFailureTime || 0) > this.resetTimeout) {
        this.state = 'half-open';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is open - database operation blocked');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = 'closed';
      }
    }
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }
  
  getState(): CircuitBreakerState {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      successCount: this.successCount
    };
  }
}

/**
 * Database operation wrapper with comprehensive error handling
 */
export async function executeWithErrorHandling<T>(
  context: DatabaseContext,
  operation: () => Promise<T>
): Promise<OperationResult<T>> {
  const logger = new DatabaseLogger(context.serviceName, context.logger);
  const startTime = Date.now();
  
  // Add start time to context
  context.startTime = startTime;
  
  try {
    // Log operation start
    logger.logOperationStart(context.operation, context);
    
    // Execute operation with timeout
    const timeoutMs = context.timeout || 30000;
    const result = await Promise.race([
      operation(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`MongoDB operation timeout after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
    
    // Log successful completion
    logger.logOperationSuccess(context.operation, context, result);
    
    return {
      success: true,
      data: result,
      metadata: {
        requestId: context.requestId,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        operation: context.operation,
        service: context.serviceName,
        collection: context.collection,
        database: context.database
      }
    };
    
  } catch (error) {
    // Log operation failure
    logger.logOperationFailure(context.operation, context, error as Error);
    
    // Handle error using DatabaseErrorHandler
    const errorResponse = await DatabaseErrorHandler.handle(error as Error, {
      ...context,
      duration: Date.now() - startTime
    }, context.logger);
    
    throw errorResponse;
  }
}

/**
 * Execute database operation with retry logic
 */
export async function executeWithRetry<T>(
  context: DatabaseContext,
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<OperationResult<T>> {
  const logger = new DatabaseLogger(context.serviceName, context.logger);
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await executeWithErrorHandling(context, operation);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt <= maxRetries) {
        const classification = DatabaseErrorHandler.classify(error as Error);
        
        // Only retry if error is retryable
        if (classification.retryable) {
          const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
          
          logger.logRetryAttempt(context.operation, attempt, maxRetries, error as Error, context);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      throw error;
    }
  }
  
  throw lastError!;
}

export { DatabaseErrorHandler, DatabaseLogger };
