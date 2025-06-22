#!/usr/bin/env node

const http = require('http');
const { MongoClient } = require('mongodb');
const { createClient } = require('redis');

async function checkService(name, url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve({ name, status: 'healthy', code: res.statusCode });
    });
    
    req.on('error', () => {
      resolve({ name, status: 'unhealthy', error: 'Connection failed' });
    });
    
    req.setTimeout(5000, () => {
      resolve({ name, status: 'unhealthy', error: 'Timeout' });
    });
  });
}

async function checkMongoDB() {
  try {
    const client = new MongoClient('mongodb://admin:password@localhost:27017?authSource=admin');
    await client.connect();
    await client.close();
    return { name: 'MongoDB', status: 'healthy' };
  } catch (error) {
    return { name: 'MongoDB', status: 'unhealthy', error: error.message };
  }
}

async function checkRedis() {
  try {
    const client = createClient({ url: 'redis://:redispassword@localhost:6379' });
    await client.connect();
    await client.quit();
    return { name: 'Redis', status: 'healthy' };
  } catch (error) {
    return { name: 'Redis', status: 'unhealthy', error: error.message };
  }
}

async function main() {
  console.log('🔍 Checking service health...\n');
  
  const checks = await Promise.all([
    checkMongoDB(),
    checkRedis(),
    checkService('Qdrant', 'http://localhost:6333/'),
    checkService('NATS', 'http://localhost:8222/'),
    checkService('Mongo Express', 'http://localhost:8081/'),
    checkService('Redis Commander', 'http://localhost:8082/')
  ]);
  
  checks.forEach(check => {
    const icon = check.status === 'healthy' ? '✅' : '❌';
    console.log(`${icon} ${check.name}: ${check.status}`);
    if (check.error) console.log(`   Error: ${check.error}`);
  });
  
  const healthy = checks.filter(c => c.status === 'healthy').length;
  console.log(`\n📊 ${healthy}/${checks.length} services healthy`);
}

main().catch(console.error);
