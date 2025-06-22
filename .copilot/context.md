# Rhajaina AI Chat Application - GitHub Copilot Context

## 🎯 Current Milestone: Database Connections
**ID**: M1.3  
**Status**: in_progress  
**Description**: Set up MongoDB, Redis, and Qdrant connections with connection pooling

### 📋 Tasks to Complete:
1. ✅ Create src/database/mongodb.js with connection management
2. ✅ Create src/database/redis.js with Redis client setup  
3. ✅ Create src/database/qdrant.js with vector database client
4. 🔄 Implement connection pooling and retry logic
5. 🔄 Add database health checks
6. ❌ Create database initialization scripts
7. ✅ Add comprehensive error handling and logging

### 🔍 Implementation Validation Checklist:
- [ ] **Service Structure**: Follow Moleculer service template pattern
- [x] **Error Handling**: Implement standardized try-catch with structured logging
- [ ] **Configuration**: Use environment variables with validation
- [ ] **Connection Pooling**: Implement proper connection management
- [ ] **Health Checks**: Add database connectivity monitoring
- [ ] **Retry Logic**: Handle connection failures gracefully
- [x] **Logging**: Use structured logging with requestId tracking
- [ ] **Testing**: Include unit and integration tests
- [ ] **Documentation**: Add JSDoc comments and usage examples

### 🚨 Enhanced Error Handling Requirements:
```javascript
// Database-specific error codes and handling
const DATABASE_ERRORS = {
  CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
  TIMEOUT: 'DB_TIMEOUT',
  AUTHENTICATION_FAILED: 'DB_AUTH_FAILED',
  NETWORK_ERROR: 'DB_NETWORK_ERROR',
  POOL_EXHAUSTED: 'DB_POOL_EXHAUSTED',
  QUERY_FAILED: 'DB_QUERY_FAILED',
  VALIDATION_ERROR: 'DB_VALIDATION_ERROR',
  DUPLICATE_KEY: 'DB_DUPLICATE_KEY',
  NOT_FOUND: 'DB_NOT_FOUND',
  PERMISSION_DENIED: 'DB_PERMISSION_DENIED'
};

// Error severity levels
const ERROR_SEVERITY = {
  CRITICAL: 'critical',    // System unusable
  HIGH: 'high',           // Service degraded
  MEDIUM: 'medium',       // Retry possible
  LOW: 'low'              // Expected/handled
};
```

### 📊 Logging Requirements:
- **Structured JSON logging** with consistent fields
- **Request correlation** via requestId/traceId
- **Performance metrics** (duration, memory usage)
- **Error context** (stack traces, user data)
- **Audit trails** for data operations
- **Health monitoring** metrics

### 🏗️ Database Architecture Requirements:
```javascript
// Expected structure for database modules
module.exports = {
  // Connection management
  connect: async () => {},
  disconnect: async () => {},
  
  // Health monitoring
  healthCheck: async () => {},
  
  // Connection pooling
  getConnection: () => {},
  
  // Retry logic
  withRetry: async (operation, maxRetries = 3) => {},
  
  // Graceful shutdown
  gracefulShutdown: async () => {}
};
```

### 🎨 Implementation Context:
Implement robust database connections with proper error handling, connection pooling, and health monitoring. Ensure all database clients are properly configured for production use and follow the Think→Act→Respond pipeline architecture.

### 🚨 Critical Standards to Follow:
1. **Environment Variables**: All connection strings must use env vars
2. **Error Logging**: Use structured logging with error codes
3. **Graceful Degradation**: Handle database unavailability
4. **Security**: No credentials in code, use connection pooling
5. **Monitoring**: Implement health checks for all databases

## 🏗️ Project Architecture

Rhajaina implements a **Think → Act → Respond** pipeline using Moleculer microservices:

- **RequestProcessor**: Main API gateway (handles authentication, routing)
- **ThinkEngine**: Intent analysis and decision making
- **ActionEngine**: Tool execution and coordination  
- **ResponseEngine**: AI-powered response generation
- **ContextManager**: Conversation state management
- **UnifiedToolManager**: Tool registry and execution

## 🛠️ Technology Stack

- **Backend**: Node.js + Moleculer microservices
- **Frontend**: React + TypeScript
- **Databases**: MongoDB (primary), Qdrant (vector), Redis (cache)
- **Message Broker**: NATS
- **AI Integration**: OpenAI, Anthropic, Google AI, Mistral, DeepSeek

## 📝 Coding Guidelines for Copilot

### Service Structure Template
```javascript
module.exports = {
  name: 'service-name',
  version: '1.0.0',
  
  settings: {
    // Service configuration
  },
  
  dependencies: [
    // Required services
  ],
  
  actions: {
    actionName: {
      params: {
        // Joi validation schema
      },
      async handler(ctx) {
        try {
          const { param1, param2 } = ctx.params;
          
          // Validate inputs
          // Business logic
          // Return standardized response
          
          return {
            success: true,
            data: result
          };
        } catch (error) {
          this.logger.error('Action failed', error);
          throw error;
        }
      }
    }
  },
  
  methods: {
    // Internal helper methods
  },
  
  async started() {
    this.logger.info(`${this.name} service started`);
  }
};
```

### Error Handling Pattern
```javascript
try {
  // Operation
  this.logger.info('Operation completed', { userId, result });
  return { success: true, data: result };
} catch (error) {
  this.logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    context: ctx.params
  });
  throw error;
}
```

### Database Operations
```javascript
// Always use proper error handling for database operations
const result = await this.db.collection('collection')
  .findOne({ _id: new ObjectId(id) });
  
if (!result) {
  throw new Error('Document not found');
}
```

## 🎯 Focus Areas for Current Milestone

When implementing **Database Connections**, focus on:
- Following the Moleculer microservices pattern
- Implementing proper error handling and logging
- Using the shared utilities and types
- Adding comprehensive tests
- Documenting API endpoints and methods

Remember: This is part of the Think→Act→Respond pipeline architecture.
