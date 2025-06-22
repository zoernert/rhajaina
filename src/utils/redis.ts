import logger from './logger';

interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

interface CacheInterface {
  get<T = any>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  expire(key: string, ttl: number): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  flushdb(): Promise<string>;
  ping(): Promise<string>;
  isHealthy(): boolean;
  disconnect(): Promise<void>;
}

// In-memory cache fallback for when Redis is not available
class MemoryCache implements CacheInterface {
  private cache = new Map<string, { value: any; expires?: number }>();
  private connected = true;

  async get<T = any>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    const expires = ttl ? Date.now() + (ttl * 1000) : undefined;
    this.cache.set(key, { value: serializedValue, expires });
  }

  async del(key: string): Promise<number> {
    return this.cache.delete(key) ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    return this.cache.has(key) ? 1 : 0;
  }

  async expire(key: string, ttl: number): Promise<number> {
    const item = this.cache.get(key);
    if (!item) return 0;
    
    item.expires = Date.now() + (ttl * 1000);
    return 1;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  async flushdb(): Promise<string> {
    this.cache.clear();
    return 'OK';
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  isHealthy(): boolean {
    return this.connected;
  }

  async disconnect(): Promise<void> {
    this.cache.clear();
    this.connected = false;
  }
}

// Redis implementation (when ioredis is available)
class RedisCache implements CacheInterface {
  private client: any = null;
  private isConnected: boolean = false;

  async connect(config?: RedisConfig): Promise<any> {
    try {
      // Dynamic import to handle missing ioredis
      const Redis = await import('ioredis').then(m => m.default).catch(() => null);
      
      if (!Redis) {
        throw new Error('ioredis package not installed');
      }

      this.client = new Redis({
        host: config?.host || process.env.REDIS_HOST || 'localhost',
        port: config?.port || parseInt(process.env.REDIS_PORT || '6379'),
        password: config?.password || process.env.REDIS_PASSWORD || undefined,
        db: config?.db || parseInt(process.env.REDIS_DB || '0'),
        lazyConnect: true
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('error', (err: Error) => {
        logger.error('Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.info('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      if (!this.client) throw new Error('Redis client not connected');
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      throw error;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      if (!this.client) throw new Error('Redis client not connected');
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      throw error;
    }
  }

  async del(key: string): Promise<number> {
    try {
      if (!this.client) throw new Error('Redis client not connected');
      return await this.client.del(key);
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      if (!this.client) throw new Error('Redis client not connected');
      return await this.client.exists(key);
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      throw error;
    }
  }

  async expire(key: string, ttl: number): Promise<number> {
    try {
      if (!this.client) throw new Error('Redis client not connected');
      return await this.client.expire(key, ttl);
    } catch (error) {
      logger.error(`Redis EXPIRE error for key ${key}:`, error);
      throw error;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      if (!this.client) throw new Error('Redis client not connected');
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error(`Redis KEYS error for pattern ${pattern}:`, error);
      throw error;
    }
  }

  async flushdb(): Promise<string> {
    try {
      if (!this.client) throw new Error('Redis client not connected');
      return await this.client.flushdb();
    } catch (error) {
      logger.error('Redis FLUSHDB error:', error);
      throw error;
    }
  }

  async ping(): Promise<string> {
    try {
      if (!this.client) throw new Error('Redis client not connected');
      return await this.client.ping();
    } catch (error) {
      logger.error('Redis PING error:', error);
      throw error;
    }
  }

  getClient(): any {
    return this.client;
  }

  isHealthy(): boolean {
    return this.isConnected && this.client !== null && this.client.status === 'ready';
  }
}

export class CacheClient {
  private implementation: CacheInterface;
  private usingRedis: boolean = false;

  constructor() {
    // Start with memory cache as fallback
    this.implementation = new MemoryCache();
  }

  async connect(config?: RedisConfig): Promise<void> {
    try {
      // Try to use Redis first
      const redisCache = new RedisCache();
      await redisCache.connect(config);
      this.implementation = redisCache;
      this.usingRedis = true;
      logger.info('Using Redis for caching');
    } catch (error) {
      // Fall back to memory cache
      logger.warn('Redis not available, using in-memory cache fallback:', error);
      this.implementation = new MemoryCache();
      this.usingRedis = false;
    }
  }

  // Delegate all methods to the implementation
  async get<T = any>(key: string): Promise<T | null> {
    return this.implementation.get<T>(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    return this.implementation.set(key, value, ttl);
  }

  async del(key: string): Promise<number> {
    return this.implementation.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.implementation.exists(key);
  }

  async expire(key: string, ttl: number): Promise<number> {
    return this.implementation.expire(key, ttl);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.implementation.keys(pattern);
  }

  async flushdb(): Promise<string> {
    return this.implementation.flushdb();
  }

  async ping(): Promise<string> {
    return this.implementation.ping();
  }

  async disconnect(): Promise<void> {
    return this.implementation.disconnect();
  }

  isHealthy(): boolean {
    return this.implementation.isHealthy();
  }

  isUsingRedis(): boolean {
    return this.usingRedis;
  }

  getClient(): any {
    return this.usingRedis ? (this.implementation as RedisCache).getClient() : null;
  }
}

// Create singleton instance
const cacheClient = new CacheClient();

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Closing cache connection...');
  await cacheClient.disconnect();
});

process.on('SIGTERM', async () => {
  logger.info('Closing cache connection...');
  await cacheClient.disconnect();
});

export default cacheClient;
