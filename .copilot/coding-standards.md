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