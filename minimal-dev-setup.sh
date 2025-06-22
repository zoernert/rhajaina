#!/bin/bash
# Rhajaina AI Chat Application - Implementation Setup Script

echo "🚀 Setting up Rhajaina AI Chat Application for implementation..."

# 1. Create the basic project structure
echo "📁 Creating project structure..."
mkdir -p {services/{request-processor,think-engine,action-engine,response-engine,context-manager,unified-tool-manager,vector-db-service,file-service,shared}/src,frontend/src,infrastructure,scripts}

# 2. Initialize package.json
echo "📦 Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "rhajaina-ai-chat",
  "version": "1.0.0",
  "description": "Advanced AI Chat Application with microservices architecture",
  "scripts": {
    "dev": "docker-compose -f docker-compose.dev.yml up",
    "dev:down": "docker-compose -f docker-compose.dev.yml down",
    "setup": "./scripts/setup-dev.sh",
    "milestone:status": "node scripts/milestone-tracker.js status",
    "milestone:start": "node scripts/milestone-tracker.js start",
    "test": "jest",
    "lint": "eslint services/*/src/**/*.js"
  },
  "workspaces": ["services/*", "frontend"],
  "devDependencies": {
    "jest": "^29.7.0",
    "eslint": "^8.55.0",
    "nodemon": "^3.0.2"
  }
}
EOF

# 3. Create Docker Compose for development
echo "🐳 Creating Docker Compose configuration..."
cat > docker-compose.dev.yml << 'EOF'
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: rhajaina-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: rhajaina
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./scripts/mongodb-init.js:/docker-entrypoint-initdb.d/init.js

  redis:
    image: redis:7-alpine
    container_name: rhajaina-redis
    restart: unless-stopped
    command: redis-server --requirepass redispassword
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  qdrant:
    image: qdrant/qdrant:latest
    container_name: rhajaina-qdrant
    restart: unless-stopped
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage

  nats:
    image: nats:alpine
    container_name: rhajaina-nats
    restart: unless-stopped
    ports:
      - "4222:4222"
      - "8222:8222"
    command: ["-js", "-m", "8222"]

  # Admin UIs
  mongo-express:
    image: mongo-express
    container_name: rhajaina-mongo-express
    restart: unless-stopped
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: password
      ME_CONFIG_MONGODB_URL: mongodb://admin:password@mongodb:27017/
    depends_on:
      - mongodb

  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: rhajaina-redis-commander
    restart: unless-stopped
    ports:
      - "8082:8081"
    environment:
      REDIS_HOSTS: local:redis:6379:0:redispassword
    depends_on:
      - redis

volumes:
  mongodb_data:
  redis_data:
  qdrant_data:
EOF

# 4. Create environment configuration
echo "⚙️ Creating environment configuration..."
cat > .env.example << 'EOF'
# Rhajaina AI Chat Application - Environment Configuration

# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Databases
MONGODB_URI=mongodb://admin:password@localhost:27017/rhajaina?authSource=admin
REDIS_URL=redis://:redispassword@localhost:6379
QDRANT_URL=http://localhost:6333

# Microservices
TRANSPORTER=nats://localhost:4222
NAMESPACE=rhajaina-dev

# AI Model API Keys (Add your actual keys)
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
GOOGLE_AI_API_KEY=your-google-ai-key-here

# Security
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-session-secret-here
EOF

# 5. Copy .env.example to .env
cp .env.example .env

# 6. Create basic service template
echo "🔧 Creating service template..."
mkdir -p services/shared/src/utils
cat > services/shared/src/utils/logger.js << 'EOF'
const winston = require('winston');

class Logger {
  constructor(serviceName) {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });
    this.serviceName = serviceName;
  }

  info(message, meta = {}) {
    this.logger.info(message, { service: this.serviceName, ...meta });
  }

  error(message, error = null, meta = {}) {
    this.logger.error(message, { 
      service: this.serviceName, 
      error: error?.message, 
      ...meta 
    });
  }
}

module.exports = Logger;
EOF

# 7. Create setup script
echo "📝 Creating setup script..."
cat > scripts/setup-dev.sh << 'EOF'
#!/bin/bash
echo "🔧 Setting up Rhajaina development environment..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
docker-compose -f docker-compose.dev.yml ps

echo "✅ Development environment setup complete!"
echo ""
echo "🌐 Access points:"
echo "  - MongoDB Express: http://localhost:8081"
echo "  - Redis Commander: http://localhost:8082"
echo "  - Qdrant Dashboard: http://localhost:6333/dashboard"
echo "  - NATS Monitor: http://localhost:8222"
echo ""
echo "🚀 Next steps:"
echo "  1. Update .env with your API keys"
echo "  2. Run: npm run milestone:start M1.1"
echo "  3. Open VS Code with GitHub Copilot"
EOF

chmod +x scripts/setup-dev.sh

# 8. Create milestone tracker
echo "📊 Creating milestone tracker..."
mkdir -p scripts
cat > scripts/milestone-tracker.js << 'EOF'
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

class MilestoneTracker {
  async showStatus() {
    try {
      const tracker = JSON.parse(fs.readFileSync('milestone-tracker.json', 'utf8'));
      console.log(`📊 Project: ${tracker.project}`);
      console.log(`🎯 Current Milestone: ${tracker.currentMilestone}`);
      
      // Find current milestone details
      for (const phase of Object.values(tracker.phases)) {
        const milestone = phase.milestones.find(m => m.id === tracker.currentMilestone);
        if (milestone) {
          console.log(`📋 ${milestone.name}`);
          console.log(`📝 ${milestone.description}`);
          console.log(`⏱️  Estimated: ${milestone.estimatedHours}h`);
          console.log(`🔄 Status: ${milestone.status}`);
          break;
        }
      }
    } catch (error) {
      console.error('❌ Failed to load milestone tracker');
    }
  }
}

const command = process.argv[2];
const tracker = new MilestoneTracker();

switch (command) {
  case 'status':
    tracker.showStatus();
    break;
  default:
    console.log('Available commands: status');
}
EOF

chmod +x scripts/milestone-tracker.js

# 9. Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install moleculer moleculer-web ioredis mongodb winston joi axios

echo ""
echo "✅ Rhajaina setup complete!"
echo ""
echo "🚀 Next steps:"
echo "  1. Update .env with your actual API keys"
echo "  2. Run: npm run setup"
echo "  3. Run: npm run milestone:start M1.1"
echo "  4. Open project in VS Code with GitHub Copilot"
echo ""
echo "📖 Documentation is available in docs/requirements/"