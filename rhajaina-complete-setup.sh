#!/bin/bash

# rhajaina-complete-setup.sh
# Complete setup script for Rhajaina AI Chat Application
# This script creates everything needed for GitHub Copilot optimized development

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                    RHAJAINA AI CHAT APPLICATION                  ║"
    echo "║              Complete Development Environment Setup              ║"
    echo "║                   Optimized for GitHub Copilot                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Check if we're in the right directory
check_directory() {
    if [ -f "package.json" ] && [ -f "milestone-tracker.json" ]; then
        print_warning "Detected existing Rhajaina project. Continuing with updates..."
        return 0
    fi
    
    if [ "$(ls -A . 2>/dev/null)" ]; then
        print_error "Directory is not empty. Please run this script in an empty directory or existing Rhajaina project."
        exit 1
    fi
    
    return 1
}

# Prerequisites check
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    local missing_deps=()
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("Node.js (https://nodejs.org/)")
    else
        NODE_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_VERSION" -lt 18 ]; then
            missing_deps+=("Node.js 18+ (current: $(node --version))")
        fi
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm (usually comes with Node.js)")
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing_deps+=("Docker (https://docker.com/)")
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        missing_deps+=("Docker Compose")
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        missing_deps+=("Git (https://git-scm.com/)")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing prerequisites:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        echo ""
        print_status "Please install the missing prerequisites and run this script again."
        exit 1
    fi
    
    print_success "All prerequisites are installed!"
}

# Create project structure
create_project_structure() {
    print_step "Creating project structure..."
    
    # Create main directories
    mkdir -p .github/workflows
    mkdir -p .github/ISSUE_TEMPLATE
    mkdir -p .github/copilot/{prompts,context}
    mkdir -p docs/{milestones,progress,copilot-context}
    mkdir -p services/{api-gateway,request-processor,think-engine,action-engine,response-engine,context-manager,unified-tool-manager,vector-db-service,file-service}/src
    mkdir -p services/shared/src/{utils,types,constants}
    mkdir -p frontend/src/{components/{Chat,Common},services,types}
    mkdir -p frontend/public
    mkdir -p infrastructure/{docker,kubernetes,terraform}
    mkdir -p scripts
    mkdir -p .copilot
    
    print_success "Project structure created!"
}

# Create package.json
create_package_json() {
    print_step "Creating package.json..."
    
    cat > package.json << 'EOF'
{
  "name": "rhajaina-ai-chat",
  "version": "1.0.0",
  "description": "Advanced AI Chat Application with microservices architecture and GitHub Copilot optimization",
  "main": "index.js",
  "scripts": {
    "dev": "docker-compose -f docker-compose.dev.yml up",
    "dev:down": "docker-compose -f docker-compose.dev.yml down",
    "dev:logs": "docker-compose -f docker-compose.dev.yml logs -f",
    "setup": "./scripts/setup-dev.sh",
    "milestone:status": "node scripts/milestone-tracker.js status",
    "milestone:start": "node scripts/milestone-tracker.js start",
    "milestone:complete": "node scripts/milestone-tracker.js complete",
    "resume": "./scripts/resume-from-milestone.sh",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint services/*/src/**/*.js frontend/src/**/*.{js,jsx,ts,tsx}",
    "lint:fix": "eslint services/*/src/**/*.js frontend/src/**/*.{js,jsx,ts,tsx} --fix",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,md}\"",
    "db:setup": "node scripts/setup-databases.js",
    "copilot:context": "node scripts/update-copilot-context.js",
    "health-check": "node scripts/health-check.js",
    "clean": "docker-compose -f docker-compose.dev.yml down -v && docker system prune -f"
  },
  "workspaces": [
    "services/*",
    "frontend"
  ],
  "keywords": [
    "ai",
    "chat",
    "microservices",
    "moleculer",
    "react",
    "typescript",
    "github-copilot"
  ],
  "devDependencies": {
    "jest": "^29.7.0",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "prettier": "^3.1.1",
    "nodemon": "^3.0.2",
    "supertest": "^6.3.3"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
EOF
    
    print_success "package.json created!"
}

# Create environment configuration
create_env_config() {
    print_step "Creating environment configuration..."
    
    cat > .env.example << 'EOF'
# Rhajaina AI Chat Application - Environment Configuration

# Application Settings
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Database Configuration
MONGODB_URI=mongodb://admin:password@localhost:27017/rhajaina?authSource=admin
REDIS_URL=redis://:redispassword@localhost:6379
QDRANT_URL=http://localhost:6333

# Microservices Configuration
TRANSPORTER=nats://localhost:4222
NAMESPACE=rhajaina-dev
LOGGER=true

# AI Model API Keys
# Get these from respective providers
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
GOOGLE_AI_API_KEY=your-google-ai-key-here
MISTRAL_API_KEY=your-mistral-key-here
DEEPSEEK_API_KEY=your-deepseek-key-here

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-session-secret-here
ENCRYPTION_KEY=your-32-character-encryption-key

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,txt,doc,docx,png,jpg,jpeg,gif,mp3,mp4
UPLOAD_DIR=./uploads

# Vector Search Configuration
EMBEDDING_MODEL=text-embedding-ada-002
VECTOR_DIMENSION=1536

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Development Tools
ENABLE_PLAYGROUND=true
ENABLE_METRICS=true
EOF
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env file from template"
        print_warning "Remember to update .env with your actual API keys!"
    else
        print_warning ".env file already exists, keeping existing configuration"
    fi
}

# Create milestone tracker
create_milestone_tracker() {
    print_step "Creating milestone tracking system..."
    
    cat > milestone-tracker.json << 'EOF'
{
  "project": "rhajaina-ai-chat",
  "version": "1.0.0",
  "phases": {
    "phase1": {
      "name": "Core Infrastructure Setup",
      "status": "not_started",
      "progress": 0,
      "milestones": [
        {
          "id": "M1.1",
          "name": "Development Environment Setup",
          "description": "Set up complete development environment with all services and tools",
          "status": "not_started",
          "dependencies": [],
          "tasks": [
            "Project structure initialization",
            "Docker Compose configuration for all services",
            "Database setup (MongoDB, Redis, Qdrant)",
            "Message broker setup (NATS)",
            "Development tool access (admin UIs)",
            "Health check implementation",
            "Basic logging and monitoring",
            "GitHub Copilot context configuration"
          ],
          "estimatedHours": 12,
          "actualHours": 0,
          "completedAt": null,
          "copilotContext": "Setting up the foundation for a microservices architecture with Docker, databases, and monitoring tools."
        },
        {
          "id": "M1.2", 
          "name": "Moleculer Microservices Foundation",
          "description": "Implement the core Moleculer framework with service discovery and communication",
          "status": "not_started",
          "dependencies": ["M1.1"],
          "tasks": [
            "Moleculer broker configuration",
            "Service registry and discovery",
            "NATS transporter configuration",
            "Shared utilities and types",
            "Error handling framework",
            "Logging standardization",
            "Health check endpoints",
            "Basic service templates"
          ],
          "estimatedHours": 16,
          "actualHours": 0,
          "completedAt": null,
          "copilotContext": "Building the microservices foundation using Moleculer framework with proper service communication and error handling."
        }
      ]
    },
    "phase2": {
      "name": "Core Services Implementation",
      "status": "not_started",
      "progress": 0,
      "milestones": [
        {
          "id": "M2.1",
          "name": "RequestProcessor Service",
          "description": "Main API gateway and request routing service",
          "status": "not_started",
          "dependencies": ["M1.2"],
          "tasks": [
            "Moleculer-web API gateway setup",
            "Request validation middleware",
            "Authentication and authorization",
            "Rate limiting implementation",
            "WebSocket support for real-time features",
            "Request routing to ThinkEngine",
            "Response formatting and error handling",
            "Comprehensive logging and metrics"
          ],
          "estimatedHours": 20,
          "actualHours": 0,
          "completedAt": null,
          "copilotContext": "Implementing the main entry point service that handles all incoming requests and routes them through the Think->Act->Respond pipeline."
        },
        {
          "id": "M2.2",
          "name": "ThinkEngine Service", 
          "description": "Core intelligence for intent analysis and decision making",
          "status": "not_started",
          "dependencies": ["M2.1"],
          "tasks": [
            "Intent classification system",
            "Context analysis from ContextManager",
            "Tool requirement detection",
            "Decision tree for routing (tools vs direct response)",
            "Multiple AI model support",
            "Fallback handling for failures",
            "Performance optimization",
            "Comprehensive testing"
          ],
          "estimatedHours": 28,
          "actualHours": 0,
          "completedAt": null,
          "copilotContext": "Building the 'Think' component that analyzes user intent and determines the best response strategy in the pipeline."
        },
        {
          "id": "M2.3",
          "name": "ActionEngine Service",
          "description": "Tool execution and coordination service",
          "status": "not_started", 
          "dependencies": ["M2.2"],
          "tasks": [
            "Tool execution framework",
            "UnifiedToolManager integration", 
            "Parallel and sequential tool execution",
            "Tool result aggregation",
            "MCP protocol support",
            "Error handling for tool failures",
            "Tool performance monitoring",
            "Custom tool registration"
          ],
          "estimatedHours": 24,
          "actualHours": 0,
          "completedAt": null,
          "copilotContext": "Implementing the 'Act' component that executes tools and coordinates their results for the response pipeline."
        },
        {
          "id": "M2.4",
          "name": "ResponseEngine Service",
          "description": "AI-powered response generation service",
          "status": "not_started",
          "dependencies": ["M2.3"],
          "tasks": [
            "Multi-provider AI model integration (OpenAI, Anthropic, etc.)",
            "Prompt engineering and context preparation",
            "Tool result integration into responses",
            "Streaming response support",
            "Response caching for efficiency",
            "Model fallback mechanisms",
            "Token usage tracking",
            "Response quality monitoring"
          ],
          "estimatedHours": 22,
          "actualHours": 0,
          "completedAt": null,
          "copilotContext": "Building the 'Respond' component that generates final AI-powered responses using multiple models and tool results."
        },
        {
          "id": "M2.5",
          "name": "ContextManager Service",
          "description": "Conversation context and state management",
          "status": "not_started",
          "dependencies": ["M2.1"],
          "tasks": [
            "MongoDB integration for chat persistence",
            "Conversation history management",
            "Context window optimization",
            "Token counting and truncation",
            "Cross-chat context retrieval",
            "Context compression strategies",
            "User session management",
            "Context search and filtering"
          ],
          "estimatedHours": 18,
          "actualHours": 0,
          "completedAt": null,
          "copilotContext": "Implementing intelligent context management for maintaining conversation state and optimizing AI model context windows."
        }
      ]
    }
  },
  "currentMilestone": "M1.1",
  "lastUpdated": "2025-06-22T12:00:00Z"
}
EOF
    
    print_success "Milestone tracker created!"
}

# Create milestone tracker script
create_milestone_script() {
    print_step "Creating milestone tracker script..."
    
    cat > scripts/milestone-tracker.js << 'EOF'
#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

class MilestoneTracker {
  constructor() {
    this.trackerFile = path.join(process.cwd(), 'milestone-tracker.json');
    this.contextDir = path.join(process.cwd(), '.copilot');
  }

  async loadTracker() {
    try {
      const data = await fs.readFile(this.trackerFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Failed to load milestone tracker:', error.message);
      process.exit(1);
    }
  }

  async saveTracker(tracker) {
    tracker.lastUpdated = new Date().toISOString();
    await fs.writeFile(this.trackerFile, JSON.stringify(tracker, null, 2));
  }

  async startMilestone(milestoneId) {
    const tracker = await this.loadTracker();
    const milestone = this.findMilestone(tracker, milestoneId);
    
    if (!milestone) {
      console.error(`❌ Milestone ${milestoneId} not found`);
      return;
    }

    const uncompletedDeps = this.checkDependencies(tracker, milestone);
    if (uncompletedDeps.length > 0) {
      console.error(`❌ Cannot start ${milestoneId}. Uncompleted dependencies: ${uncompletedDeps.join(', ')}`);
      return;
    }

    milestone.status = 'in_progress';
    milestone.startedAt = new Date().toISOString();
    tracker.currentMilestone = milestoneId;

    await this.saveTracker(tracker);
    await this.updateCopilotContext(tracker, milestone);
    
    console.log(`🚀 Started milestone: ${milestone.name}`);
    console.log(`📋 Tasks to complete:`);
    milestone.tasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task}`);
    });
    console.log(`⏱️  Estimated time: ${milestone.estimatedHours} hours`);
    console.log(`\n💡 GitHub Copilot context has been updated automatically!`);
  }

  async completeMilestone(milestoneId, actualHours = 0) {
    const tracker = await this.loadTracker();
    const milestone = this.findMilestone(tracker, milestoneId);
    
    if (!milestone) {
      console.error(`❌ Milestone ${milestoneId} not found`);
      return;
    }

    milestone.status = 'completed';
    milestone.completedAt = new Date().toISOString();
    milestone.actualHours = actualHours;

    const nextMilestone = this.findNextMilestone(tracker);
    if (nextMilestone) {
      tracker.currentMilestone = nextMilestone.id;
      await this.updateCopilotContext(tracker, nextMilestone);
    }

    await this.saveTracker(tracker);
    await this.updateProgress(tracker);
    
    console.log(`✅ Completed milestone: ${milestone.name}`);
    console.log(`⏱️  Time: ${actualHours}h (estimated: ${milestone.estimatedHours}h)`);
    
    if (nextMilestone) {
      console.log(`🎯 Next milestone: ${nextMilestone.name} (${nextMilestone.id})`);
      console.log(`💡 GitHub Copilot context updated for next milestone!`);
    } else {
      console.log(`🎉 All milestones in current phase completed!`);
    }
  }

  async updateCopilotContext(tracker, milestone) {
    await fs.mkdir(this.contextDir, { recursive: true });
    
    const contextContent = `# Rhajaina AI Chat Application - GitHub Copilot Context

## 🎯 Current Milestone: ${milestone.name}
**ID**: ${milestone.id}  
**Status**: ${milestone.status}  
**Description**: ${milestone.description}

### 📋 Tasks to Complete:
${milestone.tasks.map((task, i) => `${i + 1}. ${task}`).join('\n')}

### 🎨 Implementation Context:
${milestone.copilotContext}

## 🏗️ Project Architecture

Rhajaina implements a **Think → Act → Respond** pipeline using Moleculer microservices:

- **RequestProcessor**: Main API gateway (handles authentication, routing)
- **ThinkEngine**: Intent analysis and decision making
- **ActionEngine**: Tool execution and coordination  
- **ResponseEngine**: AI-powered response generation
- **ContextManager**: Conversation state management
- **UnifiedToolManager**: Tool registry and execution

## 🛠️ Technology Stack

- **Backend**: Node.js + Moleculer microservices
- **Frontend**: React + TypeScript
- **Databases**: MongoDB (primary), Qdrant (vector), Redis (cache)
- **Message Broker**: NATS
- **AI Integration**: OpenAI, Anthropic, Google AI, Mistral, DeepSeek

## 📝 Coding Guidelines for Copilot

### Service Structure Template
\`\`\`javascript
module.exports = {
  name: 'service-name',
  version: '1.0.0',
  
  settings: {
    // Service configuration
  },
  
  dependencies: [
    // Required services
  ],
  
  actions: {
    actionName: {
      params: {
        // Joi validation schema
      },
      async handler(ctx) {
        try {
          const { param1, param2 } = ctx.params;
          
          // Validate inputs
          // Business logic
          // Return standardized response
          
          return {
            success: true,
            data: result
          };
        } catch (error) {
          this.logger.error('Action failed', error);
          throw error;
        }
      }
    }
  },
  
  methods: {
    // Internal helper methods
  },
  
  async started() {
    this.logger.info(\`\${this.name} service started\`);
  }
};
\`\`\`

### Error Handling Pattern
\`\`\`javascript
try {
  // Operation
  this.logger.info('Operation completed', { userId, result });
  return { success: true, data: result };
} catch (error) {
  this.logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    context: ctx.params
  });
  throw error;
}
\`\`\`

### Database Operations
\`\`\`javascript
// Always use proper error handling for database operations
const result = await this.db.collection('collection')
  .findOne({ _id: new ObjectId(id) });
  
if (!result) {
  throw new Error('Document not found');
}
\`\`\`

##