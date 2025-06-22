import { MongoClient, Db, Collection } from 'mongodb';
import { DatabaseConfig, DatabaseConnection } from './types';
import Logger from '../utils/logger';

const logger = Logger('MongoDB');

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
