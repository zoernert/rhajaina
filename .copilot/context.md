# Rhajaina AI Chat Application - GitHub Copilot Context

## 🎯 Current Milestone: Moleculer Service Base
**ID**: M1.2  
**Status**: in_progress  
**Description**: Create base service class and common service patterns

### 📋 Tasks to Complete:
1. Create src/services/base.service.js with common service functionality
2. Implement standardized action response format
3. Add common middleware for logging and error handling
4. Create service health check actions
5. Add service discovery helpers
6. Create tests for base service functionality

### 🎨 Implementation Context:
Build a robust base service that all other services will extend. Include common patterns like error handling, logging, health checks, and standardized response formats.

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

When implementing **Moleculer Service Base**, focus on:
- Following the Moleculer microservices pattern
- Implementing proper error handling and logging
- Using the shared utilities and types
- Adding comprehensive tests
- Documenting API endpoints and methods

Remember: This is part of the Think→Act→Respond pipeline architecture.
