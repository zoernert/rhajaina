import { ConnectionPool, ConnectionPoolConfig } from '../utils/connection-pool';

const dbConfig: ConnectionPoolConfig = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB_NAME || 'rhajaina',
    options: {
      maxPoolSize: parseInt(process.env.MONGODB_POOL_MAX || '20'),
      minPoolSize: parseInt(process.env.MONGODB_POOL_MIN || '5'),
      maxIdleTimeMS: parseInt(process.env.MONGODB_IDLE_TIMEOUT || '30000'),
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '2000'),
      retryWrites: true,
      retryReads: true
    }
  },
  qdrant: {
    host: process.env.QDRANT_HOST || 'localhost',
    port: parseInt(process.env.QDRANT_PORT || '6333'),
    apiKey: process.env.QDRANT_API_KEY,
    https: process.env.QDRANT_HTTPS === 'true'
  },
  retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3'),
  retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000'),
  healthCheckInterval: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '60000')
};

export const connectionPool = new ConnectionPool(dbConfig);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database connections...');
  await connectionPool.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database connections...');
  await connectionPool.close();
  process.exit(0);
});
