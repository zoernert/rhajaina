#!/bin/bash

set -e

echo "🚀 Setting up Rhajaina development environment..."

# Clean up any existing containers to avoid conflicts
echo "🧹 Cleaning up existing containers..."
docker-compose -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true
docker system prune -f --volumes 2>/dev/null || true

# Start services
echo "📦 Starting Docker services..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Setup databases
echo "🗄️ Setting up databases..."
npm run db:setup

# Update Copilot context
echo "🤖 Updating GitHub Copilot context..."
npm run copilot:context

echo "✅ Development environment is ready!"
echo ""
echo "🌐 Access your services:"
echo "  MongoDB Express: http://localhost:8081"
echo "  Redis Commander: http://localhost:8082" 
echo "  Qdrant Dashboard: http://localhost:6333/dashboard"
echo "  NATS Monitoring: http://localhost:8222"
echo ""
echo "🎯 Start your first milestone:"
echo "  npm run milestone:start M1.1"
