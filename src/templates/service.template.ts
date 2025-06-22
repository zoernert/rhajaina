import { ServiceSchema, Context, Errors } from 'moleculer';
import { MongoDBConnection } from '../database/mongodb';
import { RedisConnection } from '../database/redis';
import Logger from '../utils/logger';

const logger = Logger('TemplateService');

interface TemplateServiceSettings {
  mongodb: {
    collection: string;
  };
  redis: {
    prefix: string;
    ttl: number;
  };
}

interface TemplateServiceMethods {
  getCachedData(key: string): Promise<any>;
  setCachedData(key: string, data: any, ttl?: number): Promise<void>;
  getFromDatabase(filter: any): Promise<any[]>;
}

const TemplateService: ServiceSchema<TemplateServiceSettings> = {
  name: 'template',
  version: '1.0.0',
  
  settings: {
    mongodb: {
      collection: 'templates',
    },
    redis: {
      prefix: 'template:',
      ttl: 3600,
    },
  },

  dependencies: ['database'],

  actions: {
    async get(ctx: Context<{ id: string }>) {
      try {
        const { id } = ctx.params;
        
        // Try cache first
        const cached = await this.getCachedData(id);
        if (cached) {
          return cached;
        }

        // Get from database
        const results = await this.getFromDatabase({ _id: id });
        const data = results[0] || null;

        // Cache result
        if (data) {
          await this.setCachedData(id, data);
        }

        return data;
      } catch (error) {
        logger.error('Get action failed:', error);
        throw new Errors.MoleculerError(
          'Failed to get data',
          500,
          'GET_FAILED',
          { error: error.message }
        );
      }
    },

    async create(ctx: Context<any>) {
      try {
        const data = ctx.params;
        
        // Add timestamps
        data.createdAt = new Date();
        data.updatedAt = new Date();

        // Save to database
        const mongoConnection = this.broker.getLocalService('database')?.mongoConnection as MongoDBConnection;
        const collection = mongoConnection.getCollection(this.settings.mongodb.collection);
        const result = await collection.insertOne(data);

        logger.info('Document created:', result.insertedId);
        return { id: result.insertedId, ...data };
      } catch (error) {
        logger.error('Create action failed:', error);
        throw new Errors.MoleculerError(
          'Failed to create data',
          500,
          'CREATE_FAILED',
          { error: error.message }
        );
      }
    },
  },

  events: {
    'template.created': {
      async handler(ctx: Context<any>) {
        logger.info('Template created event received:', ctx.params);
      },
    },
  },

  methods: {
    async getCachedData(key: string): Promise<any> {
      const redisConnection = this.broker.getLocalService('database')?.redisConnection as RedisConnection;
      const cacheKey = `${this.settings.redis.prefix}${key}`;
      const cached = await redisConnection.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    },

    async setCachedData(key: string, data: any, ttl?: number): Promise<void> {
      const redisConnection = this.broker.getLocalService('database')?.redisConnection as RedisConnection;
      const cacheKey = `${this.settings.redis.prefix}${key}`;
      const cacheTtl = ttl || this.settings.redis.ttl;
      await redisConnection.set(cacheKey, JSON.stringify(data), cacheTtl);
    },

    async getFromDatabase(filter: any): Promise<any[]> {
      const mongoConnection = this.broker.getLocalService('database')?.mongoConnection as MongoDBConnection;
      const collection = mongoConnection.getCollection(this.settings.mongodb.collection);
      return await collection.find(filter).toArray();
    },
  } as TemplateServiceMethods,

  async started() {
    logger.info(`${this.name} service started`);
  },

  async stopped() {
    logger.info(`${this.name} service stopped`);
  },
};

export default TemplateService;
