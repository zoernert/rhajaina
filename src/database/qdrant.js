const { QdrantClient } = require('@qdrant/js-client-rest');

class QdrantDatabase {
  constructor(config = {}) {
    this.host = config.host || 'localhost';
    this.port = config.port || 6333;
    this.apiKey = config.apiKey || null;
    
    this.client = new QdrantClient({
      url: `http://${this.host}:${this.port}`,
      apiKey: this.apiKey,
    });
  }

  async connect() {
    try {
      await this.client.getCollections();
      console.log('Connected to Qdrant successfully');
      return true;
    } catch (error) {
      console.error('Failed to connect to Qdrant:', error.message);
      throw error;
    }
  }

  async createCollection(collectionName, vectorSize, distance = 'Cosine') {
    try {
      await this.client.createCollection(collectionName, {
        vectors: {
          size: vectorSize,
          distance: distance,
        },
      });
      console.log(`Collection '${collectionName}' created successfully`);
    } catch (error) {
      console.error(`Failed to create collection '${collectionName}':`, error.message);
      throw error;
    }
  }

  async collectionExists(collectionName) {
    try {
      const collections = await this.client.getCollections();
      return collections.collections.some(col => col.name === collectionName);
    } catch (error) {
      console.error('Failed to check collection existence:', error.message);
      return false;
    }
  }

  async insertVectors(collectionName, points) {
    try {
      const result = await this.client.upsert(collectionName, {
        wait: true,
        points: points,
      });
      console.log(`Inserted ${points.length} vectors into '${collectionName}'`);
      return result;
    } catch (error) {
      console.error('Failed to insert vectors:', error.message);
      throw error;
    }
  }

  async searchSimilar(collectionName, queryVector, limit = 5, scoreThreshold = 0.0) {
    try {
      const result = await this.client.search(collectionName, {
        vector: queryVector,
        limit: limit,
        score_threshold: scoreThreshold,
      });
      return result;
    } catch (error) {
      console.error('Failed to search similar vectors:', error.message);
      throw error;
    }
  }

  async deletePoints(collectionName, pointIds) {
    try {
      const result = await this.client.delete(collectionName, {
        wait: true,
        points: pointIds,
      });
      console.log(`Deleted ${pointIds.length} points from '${collectionName}'`);
      return result;
    } catch (error) {
      console.error('Failed to delete points:', error.message);
      throw error;
    }
  }

  async getCollection(collectionName) {
    try {
      return await this.client.getCollection(collectionName);
    } catch (error) {
      console.error(`Failed to get collection '${collectionName}':`, error.message);
      throw error;
    }
  }

  async deleteCollection(collectionName) {
    try {
      await this.client.deleteCollection(collectionName);
      console.log(`Collection '${collectionName}' deleted successfully`);
    } catch (error) {
      console.error(`Failed to delete collection '${collectionName}':`, error.message);
      throw error;
    }
  }

  async close() {
    // Qdrant client doesn't require explicit closing
    console.log('Qdrant client connection closed');
  }
}

module.exports = QdrantDatabase;
