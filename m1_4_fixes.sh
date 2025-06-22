#!/bin/bash

# M1.4 TypeScript Fixes Script
# Fixes all TypeScript compilation errors

set -e

echo "🔧 Fixing TypeScript compilation errors..."
echo "============================================"

# 1. Fix Logger imports and usage
echo "📝 Step 1: Fixing Logger usage..."

# Fix src/utils/logger.ts to export both default and named export
cat > src/utils/logger.ts << 'EOF'
export interface LogLevel {
  ERROR: number;
  WARN: number;
  INFO: number;
  DEBUG: number;
}

export const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

export class Logger {
  private serviceName: string;
  private level: number;

  constructor(serviceName: string, level: number = LOG_LEVELS.INFO) {
    this.serviceName = serviceName;
    this.level = level;
  }

  error(message: string, ...args: any[]): void {
    if (this.level >= LOG_LEVELS.ERROR) {
      console.error(`[${this.serviceName}] ERROR:`, message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level >= LOG_LEVELS.WARN) {
      console.warn(`[${this.serviceName}] WARN:`, message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level >= LOG_LEVELS.INFO) {
      console.info(`[${this.serviceName}] INFO:`, message, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.level >= LOG_LEVELS.DEBUG) {
      console.debug(`[${this.serviceName}] DEBUG:`, message, ...args);
    }
  }
}

// Create logger factory function
const createLogger = (serviceName: string): Logger => new Logger(serviceName);

export default createLogger;
EOF

# 2. Fix MongoDB database file
echo "   Fixing MongoDB database file..."
cat > src/database/mongodb.ts << 'EOF'
import { MongoClient, Db, Collection } from 'mongodb';
import { DatabaseConfig, DatabaseConnection } from './types';
import createLogger from '../utils/logger';

const logger = createLogger('MongoDB');

export class MongoDBConnection implements DatabaseConnection {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      const uri = `mongodb://${this.config.host}:${this.config.port}/${this.config.database}`;
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(this.config.database);
      logger.info('MongoDB connected successfully');
    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      logger.info('MongoDB disconnected');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.db) return false;
      await this.db.admin().ping();
      return true;
    } catch (error) {
      logger.error('MongoDB health check failed:', error);
      return false;
    }
  }

  getCollection<T = any>(name: string): Collection<T> {
    if (!this.db) {
      throw new Error('MongoDB not connected');
    }
    return this.db.collection<T>(name);
  }

  getDatabase(): Db {
    if (!this.db) {
      throw new Error('MongoDB not connected');
    }
    return this.db;
  }
}

export default MongoDBConnection;
EOF

# 3. Fix Qdrant database file
echo "   Fixing Qdrant database file..."
cat > src/database/qdrant.ts << 'EOF'
import { QdrantClient } from '@qdrant/js-client-rest';
import { DatabaseConfig, DatabaseConnection } from './types';
import createLogger from '../utils/logger';

const logger = createLogger('Qdrant');

export interface QdrantPoint {
  id: string | number;
  vector: number[];
  payload?: Record<string, any>;
}

export interface QdrantSearchResult {
  id: string | number;
  score: number;
  payload?: Record<string, any>;
}

export class QdrantConnection implements DatabaseConnection {
  private client: QdrantClient | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      this.client = new QdrantClient({
        url: `http://${this.config.host}:${this.config.port}`,
      });

      // Test connection by getting collections
      await this.client.getCollections();
      logger.info('Qdrant connected successfully');
    } catch (error) {
      logger.error('Qdrant connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    // Qdrant client doesn't need explicit disconnection
    this.client = null;
    logger.info('Qdrant disconnected');
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.getCollections();
      return true;
    } catch (error) {
      logger.error('Qdrant health check failed:', error);
      return false;
    }
  }

  getClient(): QdrantClient {
    if (!this.client) {
      throw new Error('Qdrant not connected');
    }
    return this.client;
  }

  async createCollection(name: string, vectorSize: number): Promise<void> {
    const client = this.getClient();
    try {
      await client.createCollection(name, {
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
      });
      logger.info(`Qdrant collection '${name}' created successfully`);
    } catch (error) {
      logger.error(`Failed to create Qdrant collection '${name}':`, error);
      throw error;
    }
  }

  async upsertPoints(collectionName: string, points: QdrantPoint[]): Promise<void> {
    const client = this.getClient();
    try {
      await client.upsert(collectionName, {
        wait: true,
        points: points,
      });
    } catch (error) {
      logger.error(`Failed to upsert points to collection '${collectionName}':`, error);
      throw error;
    }
  }

  async search(
    collectionName: string,
    vector: number[],
    limit: number = 10
  ): Promise<QdrantSearchResult[]> {
    const client = this.getClient();
    try {
      const result = await client.search(collectionName, {
        vector,
        limit,
        with_payload: true,
      });
      return result.map(point => ({
        id: point.id,
        score: point.score,
        payload: point.payload,
      }));
    } catch (error) {
      logger.error(`Failed to search in collection '${collectionName}':`, error);
      throw error;
    }
  }
}

export default QdrantConnection;
EOF

# 4. Fix Redis database file
echo "   Fixing Redis database file..."
cat > src/database/redis.ts << 'EOF'
import Redis from 'ioredis';
import { DatabaseConfig, DatabaseConnection } from './types';
import createLogger from '../utils/logger';

const logger = createLogger('Redis');

export class RedisConnection implements DatabaseConnection {
  private client: Redis | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      this.client = new Redis({
        host: this.config.host,
        port: this.config.port,
        db: this.config.database ? parseInt(this.config.database) : 0,
        
        enableOfflineQueue: false,
        maxRetriesPerRequest: 3,
      });

      this.client.on('error', (error) => {
        logger.error('Redis error:', error);
      });

      this.client.on('connect', () => {
        logger.info('Redis connected successfully');
      });

      await this.client.ping();
    } catch (error) {
      logger.error('Redis connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      logger.info('Redis disconnected');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) return false;
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis not connected');
    }
    return this.client;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const client = this.getClient();
    if (ttl) {
      await client.setex(key, ttl, value);
    } else {
      await client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    const client = this.getClient();
    return await client.get(key);
  }

  async del(key: string): Promise<number> {
    const client = this.getClient();
    return await client.del(key);
  }
}

export default RedisConnection;
EOF

# 5. Fix service template
echo "   Fixing service template..."
cat > src/templates/service.template.ts << 'EOF'
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
EOF

# 6. Create ResponseBuilder utility
echo "   Creating ResponseBuilder utility..."
mkdir -p src/utils
cat > src/utils/response-builder.ts << 'EOF'
import { ApiResponse, ErrorCode } from '../types/response';

export class ResponseBuilder {
  static success<T>(data: T, metadata?: Record<string, any>): ApiResponse<T> {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }

  static error(code: ErrorCode, message: string, details?: any): ApiResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  }

  static validationError(errors: Record<string, string[]>, message = 'Validation failed'): ApiResponse {
    return this.error(ErrorCode.VALIDATION_ERROR, message, { validationErrors: errors });
  }

  static notFound(resource = 'Resource'): ApiResponse {
    return this.error(ErrorCode.NOT_FOUND, `${resource} not found`);
  }

  static unauthorized(message = 'Unauthorized access'): ApiResponse {
    return this.error(ErrorCode.UNAUTHORIZED, message);
  }

  static forbidden(message = 'Access forbidden'): ApiResponse {
    return this.error(ErrorCode.FORBIDDEN, message);
  }

  static serverError(message = 'Internal server error'): ApiResponse {
    return this.error(ErrorCode.INTERNAL_ERROR, message);
  }

  static conflict(message = 'Resource conflict'): ApiResponse {
    return this.error(ErrorCode.CONFLICT, message);
  }

  static badRequest(message = 'Bad request'): ApiResponse {
    return this.error(ErrorCode.BAD_REQUEST, message);
  }

  static tooManyRequests(message = 'Too many requests'): ApiResponse {
    return this.error(ErrorCode.TOO_MANY_REQUESTS, message);
  }
}

export default ResponseBuilder;
EOF

# 7. Fix error handler
echo "   Fixing error handler..."
cat > src/utils/error-handler.ts << 'EOF'
import { ApiResponse } from '../types/response';
import { ResponseBuilder } from './response-builder';

export class ErrorHandler {
  static handle(error: unknown): ApiResponse {
    if (error instanceof ValidationError) {
      return ResponseBuilder.validationError(error.errors, error.message);
    }

    if (error instanceof NotFoundError) {
      return ResponseBuilder.notFound(error.resource);
    }

    if (error instanceof UnauthorizedError) {
      return ResponseBuilder.unauthorized(error.message);
    }

    if (error instanceof ForbiddenError) {
      return ResponseBuilder.forbidden(error.message);
    }

    if (error instanceof Error) {
      console.error('Unhandled error:', error);
      return ResponseBuilder.serverError(
        process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      );
    }

    console.error('Unknown error:', error);
    return ResponseBuilder.serverError();
  }
}

export class ValidationError extends Error {
  constructor(
    public errors: Record<string, string[]>,
    message = 'Validation failed'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(public resource = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
EOF

# 8. Install missing dependencies
echo "📝 Step 2: Installing missing dependencies..."
npm install --save uuid
npm install --save-dev @types/uuid

echo ""
echo "✅ All TypeScript compilation errors fixed!"
echo ""
echo "🔍 Running TypeScript compilation check..."
if npx tsc --noEmit; then
    echo "✅ TypeScript compilation successful!"
    echo ""
    echo "🎯 Foundation is now ready for Milestone 2.x!"
    echo "   You can start with: npm run milestone:start M2.1"
else
    echo "❌ Still have TypeScript errors. Please check the output above."
    exit 1
fi
EOF

