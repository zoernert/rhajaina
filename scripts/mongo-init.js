// MongoDB initialization script for Rhajaina development environment
db = db.getSiblingDB('rhajaina');

// Create initial collections
db.createCollection('conversations');
db.createCollection('messages');
db.createCollection('users');

// Create indexes
db.conversations.createIndex({ userId: 1, createdAt: -1 });
db.messages.createIndex({ conversationId: 1, timestamp: 1 });
db.users.createIndex({ email: 1 }, { unique: true });

print('Rhajaina database initialized successfully');
