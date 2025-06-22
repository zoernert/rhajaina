import { ServiceSchema, Context, Errors } from 'moleculer';
import { ApiResponse } from '../types';
import createLogger from '../utils/logger';

const logger = createLogger('TemplateService');

interface TemplateServiceSettings {
  // Service-specific settings
  timeout: number;
  retries: number;
}

interface TemplateActionParams {
  input: string;
  options?: Record<string, any>;
}

interface ServiceMeta {
  requestId?: string;
  userId?: string;
  [key: string]: any;
}

const TemplateService: ServiceSchema<TemplateServiceSettings> = {
  name: 'template',
  version: '1.0.0',
  
  settings: {
    timeout: 5000,
    retries: 3,
  },

  dependencies: [],

  actions: {
    async process(ctx: Context<TemplateActionParams, ServiceMeta>): Promise<ApiResponse> {
      try {
        const { input, options = {} } = ctx.params;
        const requestId = ctx.meta.requestId || this.generateRequestId();
        
        logger.info('Template action started', {
          requestId,
          input: input.substring(0, 100),
          hasOptions: Object.keys(options).length > 0
        });
        
        // Validate input
        if (!this.validateInput(input)) {
          throw new Errors.MoleculerError(
            'Invalid input provided',
            400,
            'VALIDATION_ERROR'
          );
        }
        
        // Process input
        const result = await this.processInput(input, options);
        
        logger.info('Template action completed', {
          requestId,
          resultType: typeof result
        });
        
        return {
          success: true,
          data: result,
          metadata: {
            requestId,
            timestamp: new Date().toISOString()
          }
        };
        
      } catch (error) {
        logger.error('Template action failed', error);
        throw error;
      }
    },

    async health(ctx: Context): Promise<ApiResponse> {
      return {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: this.name
        }
      };
    }
  },

  events: {
    'template.created': {
      async handler(ctx: Context<any>) {
        logger.info('Template created event received', ctx.params);
      },
    },
  },

  methods: {
    async processInput(input: string, options?: Record<string, any>): Promise<any> {
      // Implementation here
      return {
        processed: input,
        timestamp: new Date().toISOString(),
        options
      };
    },

    validateInput(input: string): boolean {
      return typeof input === 'string' && input.length > 0;
    },

    generateRequestId(): string {
      return `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  },

  async started() {
    logger.info(`${this.name} service started`);
  },

  async stopped() {
    logger.info(`${this.name} service stopped`);
  },
};

export default TemplateService;
