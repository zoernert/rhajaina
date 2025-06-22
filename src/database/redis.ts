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
