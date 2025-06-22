// services/shared/templates/service.template.js
/**
 * Moleculer Service Template for Rhajaina
 * Copy this template when creating new services
 */

const { Service } = require('moleculer');
const Logger = require('../src/utils/logger');

module.exports = {
  name: 'template-service',
  version: '1.0.0',
  
  settings: {
    // Service-specific settings
    defaultTimeout: 5000,
    retryAttempts: 3
  },
  
  dependencies: [
    // List dependent services here
    // 'context-manager'
  ],
  
  actions: {
    /**
     * Template action
     */
    templateAction: {
      rest: {
        method: 'POST',
        path: '/template'
      },
      params: {
        // Joi validation schema
        input: { type: 'string', min: 1 },
        options: { type: 'object', optional: true }
      },
      async handler(ctx) {
        try {
          const { input, options = {} } = ctx.params;
          const requestId = ctx.meta.requestId || this.generateRequestId();
          
          this.logger.info('Template action started', {
            requestId,
            input: input.substring(0, 100),
            hasOptions: !!options
          });
          
          // Business logic implementation
          const result = await this.processInput(input, options);
          
          this.logger.info('Template action completed', {
            requestId,
            resultSize: JSON.stringify(result).length
          });
          
          return {
            success: true,
            data: result,
            metadata: {
              requestId,
              timestamp: new Date().toISOString(),
              service: this.name,
              version: this.version
            }
          };
          
        } catch (error) {
          this.logger.error('Template action failed', {
            error: error.message,
            stack: error.stack,
            params: ctx.params,
            requestId: ctx.meta.requestId
          });
          throw error;
        }
      }
    }
  },
  
  events: {
    /**
     * Template event handler
     */
    'template.event'(payload, sender, eventName) {
      this.logger.info('Received template event', {
        sender,
        eventName,
        payload: payload
      });
    }
  },
  
  methods: {
    /**
     * Process input data
     */
    async processInput(input, options) {
      // Template method implementation
      return {
        processed: input,
        timestamp: new Date().toISOString(),
        options
      };
    },
    
    /**
     * Generate unique request ID
     */
    generateRequestId() {
      return `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    /**
     * Validate business rules
     */
    validateBusinessRules(data) {
      // Template validation
      if (!data) {
        throw new Error('Data is required');
      }
      return true;
    }
  },
  
  async started() {
    // Service startup logic
    this.logger = new Logger(this.name);
    this.logger.info(`${this.name} service started successfully`);
    
    // Initialize any required connections or resources
    await this.initializeResources();
  },
  
  async stopped() {
    // Service cleanup logic
    this.logger.info(`${this.name} service stopped`);
    await this.cleanupResources();
  },
  
  async initializeResources() {
    // Template for resource initialization
    // e.g., database connections, external API clients
  },
  
  async cleanupResources() {
    // Template for cleanup
    // e.g., close connections, clear caches
  }
};