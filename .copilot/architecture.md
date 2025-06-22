# Architecture Guidelines for GitHub Copilot

## Service Structure Template

When creating new Moleculer services, follow this pattern:

```javascript
// services/[service-name]/src/[service-name].service.js
module.exports = {
  name: 'serviceName',
  version: '1.0.0',
  
  settings: {
    // Service-specific settings
  },
  
  dependencies: [
    // Other services this depends on
  ],
  
  actions: {
    // Service actions with proper validation
    actionName: {
      params: {
        // Joi validation schema
        param1: { type: 'string', min: 1 },
        param2: { type: 'number', optional: true }
      },
      async handler(ctx) {
        try {
          const { param1, param2 } = ctx.params;
          const requestId = ctx.meta.requestId;
          
          this.logger.info('Action started', { requestId, param1 });
          
          // Business logic here
          const result = await this.processData(param1, param2);
          
          this.logger.info('Action completed', { requestId, resultId: result.id });
          
          return {
            success: true,
            data: result,
            metadata: {
              requestId,
              timestamp: new Date().toISOString()
            }
          };
        } catch (error) {
          this.logger.error('Action failed', {
            error: error.message,
            stack: error.stack,
            params: ctx.params
          });
          throw error;
        }
      }
    }
  },
  
  events: {
    // Event handlers
  },
  
  methods: {
    // Internal helper methods
  },
  
  async started() {
    this.logger.info(`${this.name} service started`);
  },
  
  async stopped() {
    this.logger.info(`${this.name} service stopped`);
  }
};
```

## Database Schema Patterns

### MongoDB Collections
- Use consistent field naming (camelCase)
- Include timestamps (createdAt, updatedAt)
- Use ObjectId for references
- Implement soft deletes where appropriate

### Example Schema
```javascript
{
  _id: ObjectId,
  userId: String,
  title: String,
  content: String,
  createdAt: Date,
  updatedAt: Date,
  isDeleted: { type: Boolean, default: false }
}
```

## Database Connection Patterns

### MongoDB Connection Template
```javascript
const { MongoClient } = require('mongodb');

class MongoDBManager {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }
  
  async connect() {
    try {
      this.client = new MongoClient(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4
      });
      
      await this.client.connect();
      this.db = this.client.db();
      this.isConnected = true;
      
      console.log('MongoDB connected successfully');
      return this.db;
    } catch (error) {
      console.error('MongoDB connection failed:', error);
      throw error;
    }
  }
  
  async healthCheck() {
    try {
      await this.db.admin().ping();
      return { status: 'healthy', database: 'mongodb' };
    } catch (error) {
      return { status: 'unhealthy', database: 'mongodb', error: error.message };
    }
  }
}
```

### Redis Connection Template
```javascript
const Redis = require('ioredis');

class RedisManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }
  
  async connect() {
    try {
      this.client = new Redis(process.env.REDIS_URL, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });
      
      await this.client.connect();
      this.isConnected = true;
      
      console.log('Redis connected successfully');
      return this.client;
    } catch (error) {
      console.error('Redis connection failed:', error);
      throw error;
    }
  }
}
```

### Enhanced Database Connection Template with Error Handling
```javascript
const { MongoClient } = require('mongodb');
const { DatabaseErrorHandler, DatabaseLogger, DatabaseCircuitBreaker } = require('../utils/database');

class EnhancedMongoDBManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = new DatabaseLogger('mongodb-manager', logger);
    this.client = null;
    this.db = null;
    this.isConnected = false;
    this.circuitBreaker = new DatabaseCircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000
    });
    this.retryCount = 0;
    this.maxRetries = 3;
    this.healthCheckInterval = null;
  }
  
  async connect() {
    const context = {
      operation: 'connect',
      requestId: this.generateRequestId(),
      database: 'mongodb'
    };
    
    try {
      this.logger.logConnectionEvent('mongodb', 'connecting');
      
      this.client = new MongoClient(this.config.uri, {
        maxPoolSize: this.config.maxPoolSize || 10,
        minPoolSize: this.config.minPoolSize || 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        retryReads: true
      });
      
      await this.client.connect();
      this.db = this.client.db();
      this.isConnected = true;
      this.retryCount = 0;
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      this.logger.logConnectionEvent('mongodb', 'connected', {
        totalConnections: this.client.topology?.connections?.length || 0
      });
      
      return this.db;
    } catch (error) {
      const errorResponse = await DatabaseErrorHandler.handle(error, context, this.logger);
      
      if (this.retryCount < this.maxRetries && errorResponse.error.retryable) {
        this.retryCount++;
        const delay = Math.pow(2, this.retryCount) * 1000;
        
        this.logger.logger.warn('Retrying MongoDB connection', {
          retryCount: this.retryCount,
          delay,
          requestId: context.requestId
        });
        
        await this.sleep(delay);
        return await this.connect();
      }
      
      throw error;
    }
  }
  
  async executeOperation(operation, context) {
    return await this.circuitBreaker.execute(async () => {
      return await executeWithErrorHandling({
        ...context,
        serviceName: 'mongodb-manager',
        logger: this.logger.logger
      }, operation);
    }, context);
  }
  
  async healthCheck() {
    const startTime = Date.now();
    
    try {
      if (!this.isConnected || !this.db) {
        return {
          healthy: false,
          database: 'mongodb',
          error: 'Not connected',
          timestamp: new Date().toISOString()
        };
      }
      
      // Ping database
      await this.db.admin().ping();
      const responseTime = Date.now() - startTime;
      
      // Get connection stats
      const stats = await this.getConnectionStats();
      
      const status = {
        healthy: true,
        database: 'mongodb',
        responseTime,
        connections: stats,
        circuitBreaker: this.circuitBreaker.getState(),
        timestamp: new Date().toISOString()
      };
      
      this.logger.logHealthCheck('mongodb', status);
      return status;
      
    } catch (error) {
      const status = {
        healthy: false,
        database: 'mongodb',
        error: error.message,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
      
      this.logger.logHealthCheck('mongodb', status);
      return status;
    }
  }
  
  async getConnectionStats() {
    try {
      const serverStatus = await this.db.admin().serverStatus();
      return {
        totalConnections: serverStatus.connections?.totalCreated || 0,
        activeConnections: serverStatus.connections?.current || 0,
        availableConnections: serverStatus.connections?.available || 0
      };
    } catch (error) {
      return {
        totalConnections: 0,
        activeConnections: 0,
        availableConnections: 0,
        error: error.message
      };
    }
  }
  
  startHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(async () => {
      await this.healthCheck();
    }, 30000); // Check every 30 seconds
  }
  
  async gracefulShutdown() {
    try {
      this.logger.logConnectionEvent('mongodb', 'disconnecting');
      
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }
      
      if (this.client) {
        await this.client.close();
        this.isConnected = false;
        this.logger.logConnectionEvent('mongodb', 'disconnected');
      }
    } catch (error) {
      this.logger.logConnectionEvent('mongodb', 'error', { error: error.message });
    }
  }
  
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Database Service with Enhanced Error Handling
```javascript
module.exports = {
  name: 'database-manager',
  version: '1.0.0',
  
  settings: {
    mongodb: {
      uri: process.env.MONGODB_URI,
      maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE || '10'),
      minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE || '2')
    },
    redis: {
      url: process.env.REDIS_URL,
      maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3')
    },
    healthCheck: {
      interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
      timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000')
    }
  },
  
  actions: {
    healthCheck: {
      async handler(ctx) {
        try {
          const results = await Promise.allSettled([
            this.mongoManager.healthCheck(),
            this.redisManager.healthCheck(),
            this.qdrantManager.healthCheck()
          ]);
          
          const healthStatus = {
            overall: 'healthy',
            services: {},
            timestamp: new Date().toISOString(),
            requestId: ctx.meta.requestId
          };
          
          results.forEach((result, index) => {
            const serviceName = ['mongodb', 'redis', 'qdrant'][index];
            
            if (result.status === 'fulfilled') {
              healthStatus.services[serviceName] = result.value;
              if (!result.value.healthy) {
                healthStatus.overall = 'degraded';
              }
            } else {
              healthStatus.services[serviceName] = {
                healthy: false,
                error: result.reason.message,
                timestamp: new Date().toISOString()
              };
              healthStatus.overall = 'unhealthy';
            }
          });
          
          this.logger.info('Health check completed', {
            overall: healthStatus.overall,
            requestId: ctx.meta.requestId,
            services: Object.keys(healthStatus.services).map(name => ({
              name,
              healthy: healthStatus.services[name].healthy
            }))
          });
          
          return {
            success: true,
            data: healthStatus
          };
          
        } catch (error) {
          this.logger.error('Health check failed', {
            error: error.message,
            requestId: ctx.meta.requestId
          });
          
          return {
            success: false,
            error: {
              code: 'HEALTH_CHECK_FAILED',
              message: 'Unable to perform health check',
              details: error.message
            }
          };
        }
      }
    }
  },
  
  async started() {
    try {
      this.logger.info('Starting database manager service');
      
      // Initialize database managers
      this.mongoManager = new EnhancedMongoDBManager(this.settings.mongodb, this.logger);
      this.redisManager = new EnhancedRedisManager(this.settings.redis, this.logger);
      this.qdrantManager = new EnhancedQdrantManager(this.settings.qdrant, this.logger);
      
      // Connect to all databases
      await Promise.all([
        this.mongoManager.connect(),
        this.redisManager.connect(),
        this.qdrantManager.connect()
      ]);
      
      this.logger.info('Database manager service started successfully');
      
    } catch (error) {
      this.logger.error('Failed to start database manager service', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  },
  
  async stopped() {
    try {
      this.logger.info('Stopping database manager service');
      
      // Gracefully shutdown all database connections
      await Promise.all([
        this.mongoManager?.gracefulShutdown(),
        this.redisManager?.gracefulShutdown(),
        this.qdrantManager?.gracefulShutdown()
      ]);
      
      this.logger.info('Database manager service stopped successfully');
      
    } catch (error) {
      this.logger.error('Error stopping database manager service', {
        error: error.message,
        stack: error.stack
      });
    }
  }
};
```

### Database Service Integration Pattern
```javascript
// In Moleculer services
module.exports = {
  name: 'database-manager',
  
  mixins: [DbMixin],
  
  settings: {
    mongodb: {
      uri: process.env.MONGODB_URI,
      options: { maxPoolSize: 10 }
    },
    redis: {
      url: process.env.REDIS_URL
    }
  },
  
  async started() {
    // Initialize all database connections
    await this.connectDatabases();
    
    // Start health check interval
    this.healthCheckInterval = setInterval(
      () => this.performHealthChecks(),
      30000
    );
  },
  
  async stopped() {
    // Graceful shutdown
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    await this.disconnectDatabases();
  }
};
```

## API Response Format

Standardize all API responses:

```javascript
{
  success: boolean,
  data: any,
  error?: {
    code: string,
    message: string,
    details?: any
  },
  metadata?: {
    timestamp: string,
    requestId: string
  }
}
```

## Error Handling Pattern

```javascript
try {
  // Business logic
  const result = await someOperation();
  return { success: true, data: result };
} catch (error) {
  this.logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    requestId: ctx.meta.requestId
  });
  throw error;
}
```

## Testing Patterns

### Unit Test Template
```javascript
describe('ServiceName', () => {
  let broker;
  let service;
  
  beforeAll(async () => {
    broker = new ServiceBroker({ logger: false });
    service = broker.createService(ServiceSchema);
    await broker.start();
  });
  
  afterAll(async () => {
    await broker.stop();
  });
  
  it('should handle action correctly', async () => {
    const result = await broker.call('serviceName.actionName', {
      param1: 'test'
    });
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
```

## Think → Act → Respond Pipeline

### Request Flow
1. **RequestProcessor** receives and validates requests
2. **ThinkEngine** analyzes intent and determines action path
3. **ActionEngine** executes tools if needed (optional)
4. **ResponseEngine** generates final AI response
5. **ContextManager** maintains conversation state throughout

### Service Communication
```javascript
// RequestProcessor → ThinkEngine
const thinkResult = await ctx.call('think-engine.analyze', {
  message,
  context,
  userId
});

// ThinkEngine → ActionEngine (if tools needed)
const actionResult = await ctx.call('action-engine.execute', {
  tools: ['search', 'file-processor'],
  input: processedInput
});

// ResponseEngine (final step)
const response = await ctx.call('response-engine.generate', {
  message,
  context,
  actionResult
});
```