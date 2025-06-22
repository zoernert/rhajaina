// Seed data for QDrant, MoleculerDB, and Redis

const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require('mongodb');

/**
 * Generates a unique identifier following Rhajaina standards
 * @returns {string} UUID v4 string
 */
function generateId() {
  return uuidv4();
}

/**
 * Generates mock vector embedding for testing
 * @param {number} size - Vector dimension size
 * @returns {number[]} Random vector of specified size
 */
const generateMockEmbedding = (size = 384) => {
  return Array.from({ length: size }, () => Math.random() - 0.5);
};

/**
 * Sample users data following the schema standards
 */
const users = [
  {
    _id: new ObjectId(),
    userId: generateId(),
    username: 'admin',
    email: 'admin@example.com',
    passwordHash: '$2b$10$hash1',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    userId: generateId(),
    username: 'user1',
    email: 'user1@example.com',
    passwordHash: '$2b$10$hash2',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    userId: generateId(),
    username: 'user2',
    email: 'user2@example.com',
    passwordHash: '$2b$10$hash3',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

/**
 * Sample posts data with proper relationships
 */
const posts = [
  {
    _id: new ObjectId(),
    postId: generateId(),
    title: 'Welcome Post',
    content: 'Welcome to our application!',
    authorId: users[0].userId,
    published: true,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    postId: generateId(),
    title: 'Getting Started',
    content: 'Here is how to get started...',
    authorId: users[0].userId,
    published: true,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    postId: generateId(),
    title: 'Draft Post',
    content: 'This is a draft post.',
    authorId: users[1].userId,
    published: false,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

/**
 * Sample comments data with proper relationships
 */
const comments = [
  {
    _id: new ObjectId(),
    commentId: generateId(),
    content: 'Great post!',
    postId: posts[0].postId,
    authorId: users[1].userId,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    commentId: generateId(),
    content: 'Thanks for sharing',
    postId: posts[0].postId,
    authorId: users[2].userId,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    commentId: generateId(),
    content: 'Looking forward to more',
    postId: posts[1].postId,
    authorId: users[1].userId,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

/**
 * Sample chat data for Think→Act→Respond pipeline testing
 */
const chats = [
  {
    _id: new ObjectId(),
    chatId: generateId(),
    userId: users[0].userId,
    title: 'Welcome Chat',
    context: {
      model: 'gpt-3.5-turbo',
      systemPrompt: 'You are a helpful assistant.'
    },
    isActive: true,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

/**
 * Sample messages for chat conversations
 */
const messages = [
  {
    _id: new ObjectId(),
    messageId: generateId(),
    chatId: chats[0].chatId,
    content: 'Hello, how are you?',
    role: 'user',
    metadata: {
      requestId: generateId(),
      processingTime: 150
    },
    isDeleted: false,
    createdAt: new Date()
  },
  {
    _id: new ObjectId(),
    messageId: generateId(),
    chatId: chats[0].chatId,
    content: 'Hello! I\'m doing well, thank you for asking. How can I help you today?',
    role: 'assistant',
    metadata: {
      requestId: generateId(),
      processingTime: 850,
      model: 'gpt-3.5-turbo'
    },
    isDeleted: false,
    createdAt: new Date()
  }
];

/**
 * Vector embeddings for QDrant collections
 * Maps to the actual document IDs for proper relationships
 */
const vectorData = {
  users: users.map(user => ({
    id: user.userId,
    vector: generateMockEmbedding(),
    payload: {
      username: user.username,
      email: user.email,
      createdAt: user.createdAt.toISOString()
    }
  })),
  posts: posts.map(post => ({
    id: post.postId,
    vector: generateMockEmbedding(),
    payload: {
      title: post.title,
      content: post.content,
      authorId: post.authorId,
      published: post.published
    }
  })),
  comments: comments.map(comment => ({
    id: comment.commentId,
    vector: generateMockEmbedding(),
    payload: {
      content: comment.content,
      postId: comment.postId,
      authorId: comment.authorId
    }
  }))
};

/**
 * Redis cache sample data
 */
const redisData = {
  sessions: [
    {
      key: `session:${generateId()}`,
      value: JSON.stringify({
        userId: users[0].userId,
        username: users[0].username,
        loginTime: new Date().toISOString()
      }),
      ttl: 3600
    }
  ],
  cache: [
    {
      key: `cache:user:${users[0].userId}`,
      value: JSON.stringify({
        username: users[0].username,
        email: users[0].email,
        lastActive: new Date().toISOString()
      }),
      ttl: 1800
    }
  ]
};

/**
 * Validates seed data consistency
 * @throws {Error} When data relationships are invalid
 */
function validateSeedData() {
  // Validate user references in posts
  const invalidPosts = posts.filter(post => 
    !users.find(user => user.userId === post.authorId)
  );
  
  if (invalidPosts.length > 0) {
    throw new Error(`VALIDATION_ERROR: Posts with invalid authorId: ${invalidPosts.map(p => p.postId).join(', ')}`);
  }
  
  // Validate post references in comments
  const invalidComments = comments.filter(comment => 
    !posts.find(post => post.postId === comment.postId)
  );
  
  if (invalidComments.length > 0) {
    throw new Error(`VALIDATION_ERROR: Comments with invalid postId: ${invalidComments.map(c => c.commentId).join(', ')}`);
  }
  
  console.log('Seed data validation passed');
}

// Validate on module load
try {
  validateSeedData();
} catch (error) {
  console.error('Seed data validation failed:', error.message);
  throw error;
}

module.exports = {
  users,
  posts,
  comments,
  chats,
  messages,
  vectorData,
  redisData,
  generateId,
  generateMockEmbedding,
  validateSeedData
};
