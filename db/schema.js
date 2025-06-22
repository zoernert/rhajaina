// Database schema for QDrant, MoleculerDB, and Redis

const { QdrantClient } = require('@qdrant/js-client-rest');

/**
 * QDrant vector collections configuration for Rhajaina
 * Defines vector spaces for semantic search and similarity matching
 */
const qdrantCollections = [
  {
    name: 'users_vectors',
    config: {
      vectors: {
        size: 384, // sentence-transformers embedding size
        distance: 'Cosine'
      },
      optimizers_config: {
        default_segment_number: 2
      }
    }
  },
  {
    name: 'posts_vectors',
    config: {
      vectors: {
        size: 384,
        distance: 'Cosine'
      },
      optimizers_config: {
        default_segment_number: 2
      }
    }
  },
  {
    name: 'comments_vectors',
    config: {
      vectors: {
        size: 384,
        distance: 'Cosine'
      }
    }
  }
];

/**
 * MoleculerDB collections schema following MongoDB best practices
 * Uses camelCase naming and includes required timestamps
 */
const moleculerCollections = {
  users: {
    fields: {
      _id: { type: 'objectID', primaryKey: true },
      userId: { type: 'string', required: true, unique: true },
      username: { type: 'string', required: true, unique: true },
      email: { type: 'string', required: true, unique: true },
      passwordHash: { type: 'string', required: true },
      isDeleted: { type: 'boolean', default: false },
      createdAt: { type: 'date', default: () => new Date() },
      updatedAt: { type: 'date', default: () => new Date() }
    },
    indexes: ['username', 'email', 'userId', { isDeleted: 1, createdAt: -1 }]
  },
  posts: {
    fields: {
      _id: { type: 'objectID', primaryKey: true },
      postId: { type: 'string', required: true, unique: true },
      title: { type: 'string', required: true },
      content: { type: 'string' },
      authorId: { type: 'string', required: true },
      published: { type: 'boolean', default: false },
      isDeleted: { type: 'boolean', default: false },
      createdAt: { type: 'date', default: () => new Date() },
      updatedAt: { type: 'date', default: () => new Date() }
    },
    indexes: ['authorId', 'published', 'createdAt', { isDeleted: 1, published: 1 }]
  },
  comments: {
    fields: {
      _id: { type: 'objectID', primaryKey: true },
      commentId: { type: 'string', required: true, unique: true },
      content: { type: 'string', required: true },
      postId: { type: 'string', required: true },
      authorId: { type: 'string', required: true },
      isDeleted: { type: 'boolean', default: false },
      createdAt: { type: 'date', default: () => new Date() },
      updatedAt: { type: 'date', default: () => new Date() }
    },
    indexes: ['postId', 'authorId', { isDeleted: 1, createdAt: -1 }]
  },
  chats: {
    fields: {
      _id: { type: 'objectID', primaryKey: true },
      chatId: { type: 'string', required: true, unique: true },
      userId: { type: 'string', required: true },
      title: { type: 'string' },
      context: { type: 'object', default: {} },
      isActive: { type: 'boolean', default: true },
      isDeleted: { type: 'boolean', default: false },
      createdAt: { type: 'date', default: () => new Date() },
      updatedAt: { type: 'date', default: () => new Date() }
    },
    indexes: ['userId', 'chatId', { isDeleted: 1, isActive: 1 }]
  },
  messages: {
    fields: {
      _id: { type: 'objectID', primaryKey: true },
      messageId: { type: 'string', required: true, unique: true },
      chatId: { type: 'string', required: true },
      content: { type: 'string', required: true },
      role: { type: 'string', enum: ['user', 'assistant', 'system'], required: true },
      metadata: { type: 'object', default: {} },
      isDeleted: { type: 'boolean', default: false },
      createdAt: { type: 'date', default: () => new Date() }
    },
    indexes: ['chatId', 'messageId', { isDeleted: 1, createdAt: 1 }]
  }
};

/**
 * Redis key patterns and TTL configurations
 * Organized by data type and usage pattern
 */
const redisSchema = {
  sessions: {
    pattern: 'session:*',
    ttl: 3600, // 1 hour
    description: 'User session data'
  },
  cache: {
    userProfile: {
      pattern: 'cache:user:*',
      ttl: 1800, // 30 minutes
      description: 'Cached user profile data'
    },
    postContent: {
      pattern: 'cache:post:*',
      ttl: 600, // 10 minutes
      description: 'Cached post content'
    },
    chatContext: {
      pattern: 'cache:chat:*',
      ttl: 7200, // 2 hours
      description: 'Chat conversation context'
    }
  },
  counters: {
    postViews: 'counter:post_views:*',
    userActions: 'counter:user_actions:*',
    apiRequests: 'counter:api_requests:*'
  },
  queues: {
    messageProcessing: 'queue:message_processing',
    vectorEmbedding: 'queue:vector_embedding',
    notifications: 'queue:notifications'
  }
};

/**
 * Validates QDrant collection configuration
 * @param {Object} collection - Collection configuration
 * @throws {Error} When configuration is invalid
 */
function validateQdrantCollection(collection) {
  if (!collection.name || typeof collection.name !== 'string') {
    throw new Error('VALIDATION_ERROR: Collection name is required and must be string');
  }
  
  if (!collection.config?.vectors?.size || collection.config.vectors.size <= 0) {
    throw new Error('VALIDATION_ERROR: Vector size must be positive number');
  }
  
  const validDistances = ['Cosine', 'Euclid', 'Dot'];
  if (!validDistances.includes(collection.config.vectors.distance)) {
    throw new Error(`VALIDATION_ERROR: Distance must be one of ${validDistances.join(', ')}`);
  }
}

/**
 * Validates Moleculer collection schema
 * @param {string} name - Collection name
 * @param {Object} schema - Collection schema
 * @throws {Error} When schema is invalid
 */
function validateMoleculerSchema(name, schema) {
  if (!schema.fields || typeof schema.fields !== 'object') {
    throw new Error(`VALIDATION_ERROR: ${name} collection must have fields object`);
  }
  
  // Check for required common fields
  const requiredFields = ['_id', 'createdAt', 'isDeleted'];
  const missingFields = requiredFields.filter(field => !schema.fields[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`VALIDATION_ERROR: ${name} collection missing required fields: ${missingFields.join(', ')}`);
  }
}

// Validate all schemas on module load
try {
  qdrantCollections.forEach(validateQdrantCollection);
  Object.entries(moleculerCollections).forEach(([name, schema]) => 
    validateMoleculerSchema(name, schema)
  );
} catch (error) {
  console.error('Schema validation failed:', error.message);
  throw error;
}

module.exports = {
  qdrantCollections,
  moleculerCollections,
  redisSchema,
  validateQdrantCollection,
  validateMoleculerSchema
};
