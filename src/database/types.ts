export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
}

export interface DatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;
}

export interface MongoDocument {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

export interface VectorSearchOptions {
  limit?: number;
  threshold?: number;
  filter?: Record<string, any>;
}
