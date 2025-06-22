#!/usr/bin/env node

const { MongoClient } = require('mongodb');

async function setupDatabases() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/rhajaina?authSource=admin';
  
  console.log('🗄️  Setting up databases...');
  
  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // Create collections
    const collections = ['users', 'chats', 'messages', 'files', 'embeddings', 'tools'];
    
    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`📄 Created collection: ${collectionName}`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`📄 Collection ${collectionName} already exists`);
        } else {
          throw error;
        }
      }
    }
    
    // Create indexes
    console.log('🔍 Creating indexes...');
    
    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    
    // Chats collection indexes
    await db.collection('chats').createIndex({ userId: 1 });
    await db.collection('chats').createIndex({ updatedAt: -1 });
    
    // Messages collection indexes
    await db.collection('messages').createIndex({ chatId: 1, createdAt: 1 });
    await db.collection('messages').createIndex({ chatId: 1, createdAt: -1 });
    
    // Files collection indexes
    await db.collection('files').createIndex({ userId: 1 });
    await db.collection('files').createIndex({ uploadedAt: -1 });
    await db.collection('files').createIndex({ 'metadata.type': 1 });
    
    // Embeddings collection indexes
    await db.collection('embeddings').createIndex({ documentId: 1 });
    await db.collection('embeddings').createIndex({ type: 1 });
    
    // Tools collection indexes
    await db.collection('tools').createIndex({ name: 1 }, { unique: true });
    await db.collection('tools').createIndex({ enabled: 1 });
    
    console.log('✅ Database setup completed successfully');
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  setupDatabases();
}

module.exports = setupDatabases;