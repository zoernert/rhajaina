# 🚨 CRITICAL REQUIREMENTS - NEVER VIOLATE

## MANDATORY TECHNOLOGY STACK
- **ALWAYS USE TYPESCRIPT** (.ts files, never .js for ANY new code)
- **MONGODB ONLY** (never PostgreSQL, MySQL, or other databases)
- **MOLECULER MICROSERVICES** (follow templates exactly)
- **REDIS FOR CACHING** (never Memcached or other cache solutions)
- **QDRANT FOR VECTORS** (never Pinecone, Weaviate, or other vector DBs)

## 🎯 Current Milestone: Foundation Cleanup & Validation
**ID**: M1.4  
**Status**: in_progress  
**Description**: Fix critical foundation issues before proceeding to M2

### 📋 Critical Issues Being Fixed:
1. Convert ALL JavaScript files to TypeScript
2. Remove ANY PostgreSQL references - MongoDB ONLY
3. Ensure ALL services follow TypeScript Moleculer patterns
4. Update ALL templates to use .ts extensions
5. Validate ALL database connections use correct technology
6. Create comprehensive TypeScript type definitions
7. Test entire foundation with zero JavaScript files

### 🚨 ZERO TOLERANCE POLICIES:
- **NO .js files** in src/ directory (only .ts allowed)
- **NO PostgreSQL** references anywhere
- **NO generic service templates** - use TypeScript Moleculer patterns
- **NO mixed language patterns** - TypeScript throughout

## 🛠️ MANDATORY TypeScript Service Template

ALWAYS use this EXACT pattern for new services:

```typescript
import { ServiceSchema, Context, Errors } from 'moleculer';
import { ApiResponse } from '../types';
import Logger from '../utils/logger';

const logger = Logger('ServiceName');

interface ServiceNameSettings {
  timeout: number;
}

interface ServiceActionParams {
  // Define parameters with proper types
}

const ServiceName: ServiceSchema<ServiceNameSettings> = {
  name: 'service-name',
  version: '1.0.0',
  
  settings: {
    timeout: 5000,
  },

  dependencies: [],

  actions: {
    async actionName(ctx: Context<ServiceActionParams>): Promise<ApiResponse> {
      try {
        // Implementation with proper TypeScript
        return {
          success: true,
          data: result,
          metadata: {
            requestId: ctx.meta.requestId,
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        logger.error('Action failed', error);
        throw error;
      }
    }
  },

  async started() {
    logger.info(`${this.name} service started`);
  }
};

export default ServiceName;
```

## 🏗️ Database Connections - MongoDB ONLY

ALWAYS use these patterns:

```typescript
// MongoDB connection
import { MongoClient, Db } from 'mongodb';

class MongoDBConnection {
  private client: MongoClient;
  private db: Db;
  
  async connect(): Promise<void> {
    this.client = new MongoClient(process.env.MONGODB_URI!);
    await this.client.connect();
    this.db = this.client.db(process.env.MONGODB_DB_NAME);
  }
}

// Redis caching
import Redis from 'ioredis';

class RedisConnection {
  private client: Redis;
  
  async connect(): Promise<void> {
    this.client = new Redis(process.env.REDIS_URL!);
  }
}

// Qdrant vectors
import { QdrantClient } from '@qdrant/js-client-rest';

class QdrantConnection {
  private client: QdrantClient;
  
  async connect(): Promise<void> {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL!
    });
  }
}
```

## 🎯 Remember: Think → Act → Respond Pipeline

All services are part of the microservices architecture:
- **RequestProcessor**: API gateway (TypeScript only)
- **ThinkEngine**: Intent analysis (TypeScript only)  
- **ActionEngine**: Tool execution (TypeScript only)
- **ResponseEngine**: AI responses (TypeScript only)
- **ContextManager**: State management (TypeScript only)

## ⚠️ BEFORE Writing ANY Code:
1. Confirm you're using .ts extension
2. Import proper TypeScript types
3. Use MongoDB for data (never PostgreSQL)
4. Follow Moleculer TypeScript patterns
5. Include proper error handling
6. Use the exact service template above

VIOLATION OF THESE REQUIREMENTS = IMMEDIATE REJECTION
