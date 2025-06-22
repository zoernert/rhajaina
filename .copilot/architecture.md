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