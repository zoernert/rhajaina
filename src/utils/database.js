const { MongoClient } = require('mongodb');

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect(uri, dbName) {
    try {
      if (this.isConnected) {
        return this.db;
      }

      this.client = new MongoClient(uri, {
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      await this.client.connect();
      this.db = this.client.db(dbName);
      this.isConnected = true;

      console.log(`Connected to MongoDB database: ${dbName}`);
      return this.db;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.close();
        this.isConnected = false;
        console.log('Disconnected from MongoDB');
      }
    } catch (error) {
      console.error('MongoDB disconnection error:', error);
      throw error;
    }
  }

  getDb() {
    if (!this.isConnected || !this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  getCollection(collectionName) {
    return this.getDb().collection(collectionName);
  }

  async ping() {
    try {
      await this.getDb().admin().ping();
      return true;
    } catch (error) {
      console.error('Database ping failed:', error);
      return false;
    }
  }

  async createIndex(collectionName, index, options = {}) {
    try {
      const collection = this.getCollection(collectionName);
      await collection.createIndex(index, options);
      console.log(`Index created on collection ${collectionName}`);
    } catch (error) {
      console.error('Index creation error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const database = new Database();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT. Gracefully shutting down...');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Gracefully shutting down...');
  await database.disconnect();
  process.exit(0);
});

module.exports = database;
