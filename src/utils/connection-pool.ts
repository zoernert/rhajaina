import { MongoClient, MongoClientOptions, Db, ClientSession } from 'mongodb';
import { QdrantClient } from '@qdrant/js-client-rest';
import { EventEmitter } from 'events';

export interface ConnectionPoolConfig {
  mongodb: {
    uri: string;
    options?: MongoClientOptions;
    dbName: string;
  };
  qdrant: {
    host: string;
    port?: number;
    apiKey?: string;
    https?: boolean;
  };
  retryAttempts?: number;
  retryDelay?: number;
  healthCheckInterval?: number;
}

export class ConnectionPool extends EventEmitter {
  private mongoClient?: MongoClient;
  private qdrantClient?: QdrantClient;
  private config: ConnectionPoolConfig;
  private healthCheckTimer?: NodeJS.Timeout;
  private isConnected = false;

  constructor(config: ConnectionPoolConfig) {
    super();
    this.config = {
      retryAttempts: 3,
      retryDelay: 1000,
      healthCheckInterval: 60000,
      ...config
    };
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.connectMongoDB();
    await this.connectQdrant();
    this.startHealthCheck();
    this.isConnected = true;
    this.emit('connected');
  }

  private async connectMongoDB(): Promise<void> {
    const options: MongoClientOptions = {
      maxPoolSize: 20,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 2000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true,
      ...this.config.mongodb.options
    };

    this.mongoClient = new MongoClient(this.config.mongodb.uri, options);
    await this.mongoClient.connect();
    
    this.mongoClient.on('error', (err) => {
      this.emit('mongoError', err);
    });

    this.mongoClient.on('close', () => {
      this.emit('mongoDisconnected');
    });
  }

  private async connectQdrant(): Promise<void> {
    this.qdrantClient = new QdrantClient({
      host: this.config.qdrant.host,
      port: this.config.qdrant.port || 6333,
      apiKey: this.config.qdrant.apiKey,
      https: this.config.qdrant.https || false
    });

    // Test connection
    await this.qdrantClient.getCollections();
  }

  private startHealthCheck(): void {
    if (this.config.healthCheckInterval) {
      this.healthCheckTimer = setInterval(async () => {
        try {
          // MongoDB health check
          await this.mongoClient?.db('admin').admin().ping();
          
          // Qdrant health check
          await this.qdrantClient?.getCollections();
          
          this.emit('healthCheckPassed');
        } catch (error) {
          this.emit('healthCheckFailed', error);
        }
      }, this.config.healthCheckInterval);
    }
  }

  async getMongoDatabase(): Promise<Db> {
    if (!this.mongoClient || !this.isConnected) {
      await this.retryConnection();
    }
    return this.mongoClient!.db(this.config.mongodb.dbName);
  }

  async getQdrantClient(): Promise<QdrantClient> {
    if (!this.qdrantClient || !this.isConnected) {
      await this.retryConnection();
    }
    return this.qdrantClient!;
  }

  async withMongoSession<T>(callback: (session: ClientSession, db: Db) => Promise<T>): Promise<T> {
    if (!this.mongoClient) {
      throw new Error('MongoDB client not initialized');
    }

    const session = this.mongoClient.startSession();
    try {
      return await session.withTransaction(async () => {
        const db = this.mongoClient!.db(this.config.mongodb.dbName);
        return await callback(session, db);
      });
    } finally {
      await session.endSession();
    }
  }

  private async retryConnection(): Promise<void> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= (this.config.retryAttempts || 3); attempt++) {
      try {
        await this.initialize();
        return;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < (this.config.retryAttempts || 3)) {
          await this.delay(this.config.retryDelay! * Math.pow(2, attempt - 1));
        }
      }
    }
    
    throw lastError!;
  }

  getConnectionInfo() {
    return {
      mongodb: {
        isConnected: !!this.mongoClient,
        dbName: this.config.mongodb.dbName
      },
      qdrant: {
        isConnected: !!this.qdrantClient,
        host: this.config.qdrant.host,
        port: this.config.qdrant.port || 6333
      }
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    if (this.mongoClient) {
      await this.mongoClient.close();
    }
    
    this.isConnected = false;
    this.emit('disconnected');
  }
}
