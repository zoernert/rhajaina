# Coding Standards for GitHub Copilot

## General Guidelines

- Always include JSDoc comments for functions
- Use descriptive variable and function names
- Implement proper error handling with try-catch
- Log important operations for debugging
- Use environment variables for configuration
- Follow async/await pattern over Promises
- Implement comprehensive input validation

## Service Implementation Pattern

```javascript
/**
 * Service action template for Rhajaina microservices
 * @param {Object} ctx - Moleculer context
 * @param {Object} ctx.params - Action parameters
 * @param {Object} ctx.meta - Request metadata
 * @returns {Promise<Object>} Standardized response
 */
async actionName(ctx) {
  try {
    const { param1, param2 } = ctx.params;
    const requestId = ctx.meta.requestId || this.generateRequestId();
    
    // Validate inputs
    if (!param1) {
      throw new Error('param1 is required');
    }
    
    this.logger.info('Action started', {
      requestId,
      action: 'actionName',
      userId: ctx.meta.userId,
      param1: param1.substring(0, 50) // Truncate sensitive data
    });
    
    // Business logic
    const result = await this.processData(param1, param2);
    
    // Log successful completion
    this.logger.info('Action completed successfully', {
      requestId,
      resultId: result.id,
      processingTime: Date.now() - ctx.meta.startTime
    });
    
    return {
      success: true,
      data: result,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        service: this.name
      }
    };
    
  } catch (error) {
    this.logger.error('Action failed', {
      error: error.message,
      stack: error.stack,
      action: 'actionName',
      params: ctx.params,
      requestId: ctx.meta.requestId
    });
    throw error;
  }
}
```

## Error Handling Standards

### Standard Error Patterns
```javascript
// Input validation errors
if (!requiredParam) {
  throw new Error('VALIDATION_ERROR: requiredParam is mandatory');
}

// Business logic errors
if (user.status === 'blocked') {
  throw new Error('ACCESS_DENIED: User account is blocked');
}

// External service errors
try {
  const response = await externalAPI.call();
} catch (error) {
  throw new Error(`EXTERNAL_SERVICE_ERROR: ${error.message}`);
}
```

### Error Response Format
```javascript
// Always return consistent error structure
return {
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input parameters',
    details: validationErrors
  },
  metadata: {
    requestId,
    timestamp: new Date().toISOString()
  }
};
```

## Comprehensive Error Handling Standards

### Database Error Classification
```javascript
/**
 * Comprehensive database error handler
 * @class DatabaseErrorHandler
 */
class DatabaseErrorHandler {
  static classify(error) {
    // MongoDB specific errors
    if (error.name === 'MongoNetworkError') {
      return {
        code: 'DB_NETWORK_ERROR',
        severity: 'high',
        retryable: true,
        category: 'network'
      };
    }
    
    if (error.name === 'MongoTimeoutError') {
      return {
        code: 'DB_TIMEOUT',
        severity: 'medium',
        retryable: true,
        category: 'timeout'
      };
    }
    
    if (error.code === 11000) { // Duplicate key error
      return {
        code: 'DB_DUPLICATE_KEY',
        severity: 'low',
        retryable: false,
        category: 'validation'
      };
    }
    
    // Redis specific errors
    if (error.name === 'ReplyError') {
      return {
        code: 'REDIS_COMMAND_ERROR',
        severity: 'medium',
        retryable: false,
        category: 'command'
      };
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      return {
        code: 'DB_CONNECTION_REFUSED',
        severity: 'critical',
        retryable: true,
        category: 'connection'
      };
    }
    
    // Generic database errors
    return {
      code: 'DB_UNKNOWN_ERROR',
      severity: 'high',
      retryable: false,
      category: 'unknown'
    };
  }
  
  /**
   * Handle database error with appropriate response
   * @param {Error} error - Original error
   * @param {Object} context - Operation context
   * @param {Object} logger - Logger instance
   * @returns {Object} Standardized error response
   */
  static async handle(error, context, logger) {
    const classification = this.classify(error);
    const errorId = this.generateErrorId();
    
    // Log error with full context
    logger.error('Database operation failed', {
      errorId,
      code: classification.code,
      severity: classification.severity,
      category: classification.category,
      retryable: classification.retryable,
      originalError: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      context: {
        operation: context.operation,
        collection: context.collection,
        query: context.query ? JSON.stringify(context.query) : undefined,
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
    if (classification.severity === 'critical') {
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
        operation: context.operation
      }
    };
  }
  
  static generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  static getUserFriendlyMessage(classification) {
    const messages = {
      'DB_CONNECTION_FAILED': 'Database connection temporarily unavailable',
      'DB_TIMEOUT': 'Database operation timed out, please try again',
      'DB_DUPLICATE_KEY': 'This record already exists',
      'DB_NOT_FOUND': 'Requested data not found',
      'DB_PERMISSION_DENIED': 'Insufficient permissions for this operation',
      'DB_VALIDATION_ERROR': 'Invalid data provided',
      'REDIS_COMMAND_ERROR': 'Cache operation failed',
      'DB_UNKNOWN_ERROR': 'An unexpected database error occurred'
    };
    
    return messages[classification.code] || 'Database operation failed';
  }
  
  static async sendAlert(error, classification, context) {
    // Implement alerting logic (Slack, email, monitoring system)
    console.error('CRITICAL DATABASE ERROR - ALERT TRIGGERED', {
      error: error.message,
      classification,
      context: context.operation,
      timestamp: new Date().toISOString()
    });
  }
}
```

## Logging Standards

### Structured Logging Pattern
```javascript
// Success logging
this.logger.info('Operation completed', {
  operation: 'createUser',
  userId,
  duration: Date.now() - startTime,
  requestId: ctx.meta.requestId
});

// Error logging with context
this.logger.error('Database operation failed', {
  error: error.message,
  operation: 'findUser',
  userId,
  stack: error.stack,
  requestId: ctx.meta.requestId,
  timestamp: new Date().toISOString()
});

// Debug logging for development
this.logger.debug('Processing step completed', {
  step: 'validateInput',
  inputSize: input.length,
  validationRules: rules.length
});
```

#### Structured Database Logging
```javascript
/**
 * Enhanced database logger with correlation and metrics
 * @class DatabaseLogger
 */
class DatabaseLogger {
  constructor(serviceName, logger) {
    this.serviceName = serviceName;
    this.logger = logger;
  }
  
  /**
   * Log database operation start
   * @param {string} operation - Operation name
   * @param {Object} context - Operation context
   */
  logOperationStart(operation, context) {
    this.logger.info('Database operation started', {
      event: 'db_operation_start',
      service: this.serviceName,
      operation,
      requestId: context.requestId,
      userId: context.userId,
      collection: context.collection,
      query: context.query ? this.sanitizeQuery(context.query) : undefined,
      timestamp: new Date().toISOString(),
      performance: {
        startTime: Date.now(),
        memoryBefore: process.memoryUsage()
      }
    });
  }
  
  /**
   * Log successful database operation
   * @param {string} operation - Operation name
   * @param {Object} context - Operation context
   * @param {any} result - Operation result
   */
  logOperationSuccess(operation, context, result) {
    const duration = Date.now() - context.startTime;
    
    this.logger.info('Database operation completed', {
      event: 'db_operation_success',
      service: this.serviceName,
      operation,
      requestId: context.requestId,
      userId: context.userId,
      collection: context.collection,
      timestamp: new Date().toISOString(),
      performance: {
        duration,
        memoryAfter: process.memoryUsage(),
        resultSize: this.getResultSize(result)
      },
      result: {
        type: typeof result,
        count: Array.isArray(result) ? result.length : (result ? 1 : 0),
        hasData: !!result
      }
    });
    
    // Log performance warning for slow operations
    if (duration > 1000) {
      this.logger.warn('Slow database operation detected', {
        event: 'db_operation_slow',
        operation,
        duration,
        requestId: context.requestId,
        threshold: 1000
      });
    }
  }
  
  /**
   * Log database operation failure
   * @param {string} operation - Operation name
   * @param {Object} context - Operation context
   * @param {Error} error - Error that occurred
   */
  logOperationFailure(operation, context, error) {
    const duration = Date.now() - context.startTime;
    
    this.logger.error('Database operation failed', {
      event: 'db_operation_failure',
      service: this.serviceName,
      operation,
      requestId: context.requestId,
      userId: context.userId,
      collection: context.collection,
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      performance: {
        duration,
        memoryAfter: process.memoryUsage()
      },
      context: {
        query: context.query ? this.sanitizeQuery(context.query) : undefined,
        params: context.params ? this.sanitizeParams(context.params) : undefined
      }
    });
  }
  
  /**
   * Log database health check
   * @param {string} database - Database name
   * @param {Object} status - Health status
   */
  logHealthCheck(database, status) {
    const logLevel = status.healthy ? 'info' : 'error';
    
    this.logger[logLevel]('Database health check', {
      event: 'db_health_check',
      service: this.serviceName,
      database,
      status: status.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      details: status,
      performance: {
        responseTime: status.responseTime,
        connections: status.connections
      }
    });
  }
  
  /**
   * Log database connection events
   * @param {string} database - Database name
   * @param {string} event - Connection event (connected, disconnected, error)
   * @param {Object} details - Event details
   */
  logConnectionEvent(database, event, details = {}) {
    const logLevel = event === 'error' ? 'error' : 'info';
    
    this.logger[logLevel]('Database connection event', {
      event: `db_connection_${event}`,
      service: this.serviceName,
      database,
      timestamp: new Date().toISOString(),
      details,
      performance: {
        totalConnections: details.totalConnections,
        activeConnections: details.activeConnections,
        idleConnections: details.idleConnections
      }
    });
  }
  
  sanitizeQuery(query) {
    // Remove sensitive data from query for logging
    const sanitized = { ...query };
    
    // Remove password fields
    if (sanitized.password) sanitized.password = '[REDACTED]';
    if (sanitized.token) sanitized.token = '[REDACTED]';
    
    // Truncate large text fields
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 100) {
        sanitized[key] = sanitized[key].substring(0, 100) + '...[TRUNCATED]';
      }
    });
    
    return sanitized;
  }
  
  sanitizeParams(params) {
    return this.sanitizeQuery(params);
  }
  
  getResultSize(result) {
    if (!result) return 0;
    if (typeof result === 'string') return result.length;
    if (Array.isArray(result)) return result.length;
    return JSON.stringify(result).length;
  }
}
```

### Database Operation Wrapper with Error Handling
```javascript
/**
 * Database operation wrapper with comprehensive error handling
 * @param {Object} context - Operation context
 * @param {Function} operation - Database operation to execute
 * @returns {Promise<any>} Operation result
 */
async function executeWithErrorHandling(context, operation) {
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
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs)
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
        operation: context.operation
      }
    };
    
  } catch (error) {
    // Log operation failure
    logger.logOperationFailure(context.operation, context, error);
    
    // Handle error using DatabaseErrorHandler
    return await DatabaseErrorHandler.handle(error, {
      ...context,
      duration: Date.now() - startTime
    }, context.logger);
  }
}

// Usage example
async function findUser(userId, requestId) {
  return await executeWithErrorHandling({
    serviceName: 'user-service',
    operation: 'findUser',
    collection: 'users',
    requestId,
    userId,
    query: { _id: userId },
    logger: this.logger,
    timeout: 5000
  }, async () => {
    return await this.db.collection('users').findOne({ _id: new ObjectId(userId) });
  });
}
```

### Circuit Breaker Pattern for Database Operations
```javascript
/**
 * Circuit breaker for database operations
 * @class DatabaseCircuitBreaker
 */
class DatabaseCircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.monitoringPeriod = options.monitoringPeriod || 10000;
    
    this.state = 'closed'; // closed, open, half-open
    this.failures = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }
  
  async execute(operation, context) {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
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
  
  onSuccess() {
    this.failures = 0;
    
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = 'closed';
      }
    }
  }
  
  onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      successCount: this.successCount
    };
  }
}
```

### Log Level Guidelines
- **ERROR**: Actual errors that need attention
- **WARN**: Potentially problematic situations
- **INFO**: General information about application flow
- **DEBUG**: Detailed information for debugging

## Database Operations

### MongoDB Operations Pattern
```javascript
async findDocument(collection, query, options = {}) {
  try {
    const startTime = Date.now();
    
    const result = await this.db.collection(collection)
      .findOne(query, options);
    
    this.logger.debug('Database query completed', {
      collection,
      query: JSON.stringify(query),
      found: !!result,
      duration: Date.now() - startTime
    });
    
    if (!result) {
      throw new Error(`Document not found in ${collection}`);
    }
    
    return result;
  } catch (error) {
    this.logger.error('Database query failed', {
      error: error.message,
      collection,
      query: JSON.stringify(query),
      stack: error.stack
    });
    throw error;
  }
}
```

### ObjectId Handling
```javascript
const { ObjectId } = require('mongodb');

// Always validate ObjectId format
function validateObjectId(id) {
  if (!ObjectId.isValid(id)) {
    throw new Error('INVALID_OBJECT_ID: Invalid MongoDB ObjectId format');
  }
  return new ObjectId(id);
}

// Use in queries
const chatId = validateObjectId(ctx.params.chatId);
const chat = await this.db.collection('chats').findOne({ _id: chatId });
```

## Database Operations Standards

### Connection Management Pattern
```javascript
/**
 * Database connection manager with retry logic
 * @class DatabaseManager
 */
class DatabaseManager {
  constructor(config) {
    this.config = config;
    this.connection = null;
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = config.maxRetries || 3;
  }
  
  /**
   * Connect to database with retry logic
   * @returns {Promise<Object>} Database connection
   * @throws {Error} When max retries exceeded
   */
  async connect() {
    const startTime = Date.now();
    
    try {
      console.log(`Connecting to ${this.config.type} database...`);
      
      // Implement specific connection logic
      this.connection = await this.createConnection();
      this.isConnected = true;
      this.retryCount = 0;
      
      console.log(`${this.config.type} connected successfully`, {
        duration: Date.now() - startTime,
        retryCount: this.retryCount
      });
      
      return this.connection;
    } catch (error) {
      console.error(`${this.config.type} connection failed`, {
        error: error.message,
        retryCount: this.retryCount,
        maxRetries: this.maxRetries
      });
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
        
        console.log(`Retrying connection in ${delay}ms...`);
        await this.sleep(delay);
        
        return await this.connect();
      }
      
      throw new Error(`Failed to connect after ${this.maxRetries} attempts: ${error.message}`);
    }
  }
  
  /**
   * Perform health check on database connection
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return {
          status: 'unhealthy',
          database: this.config.type,
          error: 'Not connected'
        };
      }
      
      // Implement specific health check
      await this.ping();
      
      return {
        status: 'healthy',
        database: this.config.type,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`${this.config.type} health check failed`, {
        error: error.message
      });
      
      return {
        status: 'unhealthy',
        database: this.config.type,
        error: error.message
      };
    }
  }
  
  /**
   * Gracefully disconnect from database
   */
  async disconnect() {
    try {
      if (this.connection) {
        await this.connection.close();
        this.isConnected = false;
        console.log(`${this.config.type} disconnected successfully`);
      }
    } catch (error) {
      console.error(`Error disconnecting from ${this.config.type}`, {
        error: error.message
      });
    }
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Error Handling for Database Operations
```javascript
/**
 * Execute database operation with error handling
 * @param {Function} operation - Database operation to execute
 * @param {string} operationName - Name for logging
 * @returns {Promise<any>} Operation result
 */
async executeWithErrorHandling(operation, operationName) {
  const requestId = this.generateRequestId();
  const startTime = Date.now();
  
  try {
    console.log(`Starting ${operationName}`, {
      requestId,
      timestamp: new Date().toISOString()
    });
    
    const result = await operation();
    
    console.log(`${operationName} completed successfully`, {
      requestId,
      duration: Date.now() - startTime,
      resultType: typeof result
    });
    
    return result;
  } catch (error) {
    console.error(`${operationName} failed`, {
      requestId,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    });
    
    // Re-throw with context
    throw new Error(`DB_OPERATION_FAILED: ${operationName} - ${error.message}`);
  }
}
```

### Environment Variable Validation
```javascript
/**
 * Validate required database environment variables
 * @throws {Error} When required variables are missing
 */
function validateDatabaseConfig() {
  const required = {
    MONGODB_URI: 'MongoDB connection string',
    REDIS_URL: 'Redis connection URL',
    QDRANT_URL: 'Qdrant vector database URL'
  };
  
  const missing = [];
  
  for (const [key, description] of Object.entries(required)) {
    if (!process.env[key]) {
      missing.push(`${key} (${description})`);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables:\n${missing.join('\n')}`);
  }
  
  console.log('Database configuration validated successfully');
}

// Call during application startup
validateDatabaseConfig();
```

### Connection Pool Configuration
```javascript
// MongoDB connection pool settings
const mongoOptions = {
  maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE || '10'),
  minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE || '2'),
  maxIdleTimeMS: parseInt(process.env.MONGO_MAX_IDLE_TIME || '30000'),
  serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_TIMEOUT || '5000'),
  socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT || '45000'),
  heartbeatFrequencyMS: parseInt(process.env.MONGO_HEARTBEAT_FREQ || '10000')
};

// Redis connection pool settings
const redisOptions = {
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
  retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100'),
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000'),
  commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000')
};
```

## Environment Variables

### Configuration Pattern
```javascript
// Use environment variables with defaults
const config = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rhajaina',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  openaiApiKey: process.env.OPENAI_API_KEY,
  logLevel: process.env.LOG_LEVEL || 'info',
  port: parseInt(process.env.PORT || '3000', 10)
};

// Validate required environment variables
function validateConfig() {
  const required = ['MONGODB_URI', 'OPENAI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

## API Response Standards

### Success Response Format
```javascript
return {
  success: true,
  data: {
    // Actual response data
    id: 'generated-id',
    result: processedResult
  },
  metadata: {
    requestId: ctx.meta.requestId,
    timestamp: new Date().toISOString(),
    service: this.name,
    version: this.version,
    processingTime: Date.now() - startTime
  }
};
```

### Pagination Format
```javascript
return {
  success: true,
  data: {
    items: results,
    pagination: {
      page: currentPage,
      limit: pageSize,
      total: totalCount,
      pages: Math.ceil(totalCount / pageSize),
      hasNext: currentPage < Math.ceil(totalCount / pageSize),
      hasPrev: currentPage > 1
    }
  }
};
```

## Testing Standards

### Unit Test Pattern
```javascript
describe('ServiceName Actions', () => {
  let broker;
  let service;
  
  beforeAll(async () => {
    broker = new ServiceBroker({ 
      logger: false,
      transporter: null // Disable transporter for unit tests
    });
    
    service = broker.createService(ServiceSchema);
    await broker.start();
  });
  
  afterAll(async () => {
    await broker.stop();
  });
  
  beforeEach(() => {
    // Reset mocks and test data
    jest.clearAllMocks();
  });
  
  describe('actionName', () => {
    it('should process valid input successfully', async () => {
      // Arrange
      const params = {
        param1: 'test-value',
        param2: 123
      };
      
      const mockResult = { id: 'test-id', processed: true };
      jest.spyOn(service, 'processData').mockResolvedValue(mockResult);
      
      // Act
      const result = await broker.call('service.actionName', params);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(service.processData).toHaveBeenCalledWith('test-value', 123);
    });
    
    it('should handle validation errors', async () => {
      // Arrange
      const params = { param2: 123 }; // Missing required param1
      
      // Act & Assert
      await expect(
        broker.call('service.actionName', params)
      ).rejects.toThrow('param1 is required');
    });
  });
});
```

### Integration Test Pattern
```javascript
describe('Service Integration', () => {
  let broker;
  
  beforeAll(async () => {
    broker = new ServiceBroker({
      transporter: 'NATS',
      logger: false
    });
    
    // Load all services
    broker.loadService('./src/service1.service.js');
    broker.loadService('./src/service2.service.js');
    
    await broker.start();
  });
  
  it('should handle cross-service communication', async () => {
    const result = await broker.call('service1.processWithService2', {
      data: 'test-data'
    });
    
    expect(result.success).toBe(true);
    expect(result.data.processedByService2).toBe(true);
  });
});
```

## Validation Patterns

### Joi Validation Schema
```javascript
const Joi = require('joi');

// Define reusable schemas
const schemas = {
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  email: Joi.string().email(),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
};

// Use in action params
actions: {
  getUserChats: {
    params: {
      userId: schemas.objectId.required(),
      ...schemas.pagination
    },
    async handler(ctx) {
      // Validation is automatic
    }
  }
}
```

## Security Standards

### Input Sanitization
```javascript
const validator = require('validator');

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Escape HTML
  return validator.escape(input.trim());
}

// Use in handlers
const { message } = ctx.params;
const sanitizedMessage = sanitizeInput(message);
```

### Rate Limiting Pattern
```javascript
// In service settings
settings: {
  rateLimit: {
    window: 60 * 1000, // 1 minute
    limit: 100, // 100 requests per minute
    headers: true
  }
}
```

## Performance Optimization

### Caching Pattern
```javascript
async getCachedData(key, fetchFunction, ttl = 300) {
  try {
    // Try cache first
    const cached = await this.cache.get(key);
    if (cached) {
      this.logger.debug('Cache hit', { key });
      return JSON.parse(cached);
    }
    
    // Fetch from source
    this.logger.debug('Cache miss, fetching from source', { key });
    const data = await fetchFunction();
    
    // Store in cache
    await this.cache.set(key, JSON.stringify(data), ttl);
    
    return data;
  } catch (error) {
    this.logger.error('Cache operation failed', {
      error: error.message,
      key,
      operation: 'getCachedData'
    });
    // Fallback to direct fetch
    return await fetchFunction();
  }
}
```

### Memory Management
```javascript
// Clean up large objects
async processLargeDataset(dataset) {
  try {
    const result = await this.processData(dataset);
    return result;
  } finally {
    // Explicit cleanup for large objects
    dataset = null;
    if (global.gc) {
      global.gc();
    }
  }
}
```

## Documentation Standards

### JSDoc Comments
```javascript
/**
 * Process user message through the Think->Act->Respond pipeline
 * @param {string} message - User's input message
 * @param {Object} context - Conversation context
 * @param {string} context.chatId - Chat session identifier
 * @param {Array} context.history - Previous messages
 * @param {string} userId - User identifier
 * @param {Object} [options={}] - Optional processing parameters
 * @param {string} [options.model='gpt-3.5-turbo'] - AI model to use
 * @returns {Promise<Object>} Processing result
 * @throws {Error} When message is empty or context is invalid
 * @example
 * const result = await processMessage(
 *   "Hello, how are you?",
 *   { chatId: "chat123", history: [] },
 *   "user456"
 * );
 */
```

Remember: These standards help GitHub Copilot generate consistent, high-quality code that follows Rhajaina's architecture patterns!