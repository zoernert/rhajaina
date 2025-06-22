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
