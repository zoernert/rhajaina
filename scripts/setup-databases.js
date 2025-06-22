#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const { createClient } = require('redis');

async function setupMongoDB() {
  const client = new MongoClient('mongodb://admin:password@localhost:27017?authSource=admin');
  
  try {
    await client.connect();
    console.log('📊 Connected to MongoDB');
    
    const db = client.db('rhajaina');
    
    // Create collections with indexes
    await db.createCollection('conversations');
    await db.collection('conversations').createIndex({ userId: 1, createdAt: -1 });
    
    await db.createCollection('messages'); 
    await db.collection('messages').createIndex({ conversationId: 1, timestamp: 1 });
    
    await db.createCollection('users');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    
    console.log('✅ MongoDB collections and indexes created');
  } catch (error) {
    console.error('❌ MongoDB setup failed:', error.message);
  } finally {
    await client.close();
  }
}

async function setupRedis() {
  const client = createClient({
    url: 'redis://:redispassword@localhost:6379'
  });
  
  try {
    await client.connect();
    console.log('📊 Connected to Redis');
    
    await client.set('rhajaina:setup', 'complete');
    console.log('✅ Redis setup complete');
  } catch (error) {
    console.error('❌ Redis setup failed:', error.message);
  } finally {
    await client.quit();
  }
}

async function main() {
  console.log('🗄️ Setting up databases...');
  await setupMongoDB();
  await setupRedis();
  console.log('✅ Database setup complete!');
}

main().catch(console.error);
