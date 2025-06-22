import { connectionPool } from '../config/database';
import { HttpClient } from '../utils/http-client';
import { withRetry, CircuitBreaker } from '../utils/retry-logic';
import { ObjectId } from 'mongodb';

export class ExampleService {
  private httpClient: HttpClient;
  private circuitBreaker: CircuitBreaker;

  constructor() {
    this.httpClient = new HttpClient({
      baseURL: process.env.API_BASE_URL || 'https://api.example.com',
      retryConfig: {
        maxAttempts: 3,
        baseDelay: 1000
      }
    });

    this.circuitBreaker = new CircuitBreaker(5, 60000);
  }

  async createUser(userData: any): Promise<any> {
    return connectionPool.withMongoSession(async (session, db) => {
      // Insert user into MongoDB
      const userResult = await db.collection('users').insertOne(
        {
          name: userData.name,
          email: userData.email,
          createdAt: new Date()
        },
        { session }
      );

      const user = {
        _id: userResult.insertedId,
        name: userData.name,
        email: userData.email,
        createdAt: new Date()
      };

      // Store user vector in Qdrant with retry
      await this.circuitBreaker.execute(async () => {
        const qdrant = await connectionPool.getQdrantClient();
        await qdrant.upsert('users', {
          wait: true,
          points: [{
            id: userResult.insertedId.toString(),
            vector: userData.embedding || new Array(384).fill(0), // Default embedding
            payload: {
              name: userData.name,
              email: userData.email,
              userId: userResult.insertedId.toString()
            }
          }]
        });
      });

      // Send welcome email with retry
      await this.circuitBreaker.execute(() =>
        this.httpClient.post('/emails/welcome', {
          to: userData.email,
          userId: userResult.insertedId.toString()
        })
      );

      return user;
    });
  }

  async getUserData(userId: string): Promise<any> {
    return withRetry(
      async () => {
        const db = await connectionPool.getMongoDatabase();
        const user = await db.collection('users').findOne({
          _id: new ObjectId(userId)
        });
        
        if (!user) {
          throw new Error('User not found');
        }
        
        return user;
      },
      { 
        maxAttempts: 2,
        retryCondition: (error) => error.name === 'MongoNetworkError'
      }
    );
  }

  async searchSimilarUsers(queryVector: number[], limit: number = 10): Promise<any[]> {
    return withRetry(
      async () => {
        const qdrant = await connectionPool.getQdrantClient();
        const searchResult = await qdrant.search('users', {
          vector: queryVector,
          limit,
          with_payload: true
        });

        return searchResult.map(result => ({
          id: result.id,
          score: result.score,
          payload: result.payload
        }));
      },
      {
        maxAttempts: 3,
        retryCondition: (error) => error.status >= 500
      }
    );
  }

  async syncExternalData(): Promise<void> {
    const externalData: any[] = await this.httpClient.get('/external/data');
    
    await connectionPool.withMongoSession(async (session, db) => {
      const bulkOps = externalData.map((item: any) => ({
        updateOne: {
          filter: { externalId: item.id },
          update: { 
            $set: { 
              externalId: item.id,
              data: item,
              updatedAt: new Date()
            }
          },
          upsert: true
        }
      }));

      await db.collection('external_data').bulkWrite(bulkOps, { session });
    });
  }

  async createCollection(collectionName: string, vectorSize: number): Promise<void> {
    const qdrant = await connectionPool.getQdrantClient();
    
    await qdrant.createCollection(collectionName, {
      vectors: {
        size: vectorSize,
        distance: 'Cosine'
      }
    });
  }

  getPoolStats() {
    return {
      connections: connectionPool.getConnectionInfo(),
      circuitBreaker: this.circuitBreaker.getState()
    };
  }
}