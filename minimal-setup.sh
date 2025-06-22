#!/bin/bash

set -e

echo "🚀 Setting up Rhajaina development environment..."

# Start services
echo "📦 Starting Docker services..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Setup databases
echo "🗄️ Setting up databases..."
node scripts/setup-databases.js

# Update Copilot context
echo "🤖 Updating GitHub Copilot context..."
node scripts/update-copilot-context.js

echo "✅ Development environment is ready!"
echo ""
echo "🌐 Access your services:"
echo "  MongoDB Express: http://localhost:8083"  # Updated port
echo "  Redis Commander: http://localhost:8084"  # Updated port
echo "  Qdrant Dashboard: http://localhost:6333/dashboard"
echo "  NATS Monitoring: http://localhost:8222"
echo ""
echo "🎯 Start your first milestone:"
echo "  npm run milestone:start M1.1"