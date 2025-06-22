const redis = require('redis');

class RedisConnection {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect(options = {}) {
    try {
      if (this.isConnected) {
        console.log('Redis already connected');
        return;
      }

      const defaultOptions = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      };

      const config = { ...defaultOptions, ...options };
      
      this.client = redis.createClient({
        socket: {
          host: config.host,
          port: config.port,
        },
        password: config.password,
        database: config.db,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('Redis server refused connection');
            return new Error('Redis server refused connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.error('Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            console.error('Redis max retry attempts reached');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      // Handle connection events
      this.client.on('connect', () => {
        console.log('Redis client connecting...');
      });

      this.client.on('ready', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        console.error('Redis connection error:', error);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('Redis connection ended');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        console.log('Redis reconnecting...');
        this.isConnected = false;
      });

      await this.client.connect();

    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (!this.client || !this.isConnected) {
        console.log('Redis not connected');
        return;
      }

      await this.client.quit();
      this.isConnected = false;
      console.log('Redis disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  getClient() {
    return this.client;
  }

  isConnectionReady() {
    return this.isConnected && this.client && this.client.isReady;
  }

  async ping() {
    try {
      if (!this.isConnectionReady()) {
        throw new Error('Redis not connected');
      }
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis ping failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const redisConnection = new RedisConnection();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT. Gracefully shutting down Redis...');
  await redisConnection.disconnect();
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM. Gracefully shutting down Redis...');
  await redisConnection.disconnect();
});

module.exports = redisConnection;
