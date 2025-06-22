#!/usr/bin/env node

/**
 * Rhajaina Project Structure Generator
 * Creates the complete project structure with all necessary files
 */

const fs = require('fs').promises;
const path = require('path');

class ProjectStructureGenerator {
  constructor() {
    this.projectRoot = process.cwd();
  }

  async generateStructure() {
    console.log('🏗️  Generating Rhajaina project structure...');

    const structure = {
      '.github': {
        'workflows': {
          'ci.yml': this.getCIWorkflow(),
          'milestone-tracker.yml': this.getMilestoneTrackerWorkflow()
        },
        'ISSUE_TEMPLATE': {
          'milestone.md': this.getMilestoneTemplate(),
          'bug_report.md': this.getBugReportTemplate(),
          'feature_request.md': this.getFeatureRequestTemplate()
        },
        'copilot': {
          'prompts': {
            'service-template.md': this.getServicePromptTemplate(),
            'testing-prompt.md': this.getTestingPromptTemplate()
          },
          'context': {
            'architecture-context.md': this.getArchitectureContext()
          }
        }
      },
      'docs': {
        'milestones': {
          'phase1-milestones.md': this.getPhase1Milestones(),
          'phase2-milestones.md': this.getPhase2Milestones()
        },
        'progress': {
          'README.md': '# Progress Tracking\n\nThis directory contains progress reports and milestone completion logs.'
        },
        'copilot-context': {
          'current-implementation.md': this.getCurrentImplementationContext()
        }
      },
      'services': {
        'api-gateway': {
          'package.json': this.getServicePackageJson('api-gateway'),
          'Dockerfile.dev': this.getDockerfileDev(),
          'src': {
            'index.js': this.getApiGatewayIndex(),
            'routes': {
              'chat.js': '// Chat routes will be implemented here',
              'auth.js': '// Authentication routes will be implemented here'
            }
          },
          'tests': {
            'gateway.test.js': this.getGatewayTest()
          }
        },
        'request-processor': {
          'package.json': this.getServicePackageJson('request-processor'),
          'src': {
            'request-processor.service.js': this.getRequestProcessorService(),
            'middleware': {
              'auth.js': '// Authentication middleware',
              'validation.js': '// Request validation middleware'
            }
          },
          'tests': {
            'request-processor.test.js': this.getServiceTest('request-processor')
          }
        },
        'think-engine': {
          'package.json': this.getServicePackageJson('think-engine'),
          'src': {
            'think-engine.service.js': this.getThinkEngineService(),
            'analyzers': {
              'intent-analyzer.js': '// Intent analysis logic',
              'context-analyzer.js': '// Context analysis logic'
            }
          },
          'tests': {
            'think-engine.test.js': this.getServiceTest('think-engine')
          }
        },
        'action-engine': {
          'package.json': this.getServicePackageJson('action-engine'),
          'src': {
            'action-engine.service.js': this.getActionEngineService(),
            'executors': {
              'tool-executor.js': '// Tool execution logic'
            }
          },
          'tests': {
            'action-engine.test.js': this.getServiceTest('action-engine')
          }
        },
        'response-engine': {
          'package.json': this.getServicePackageJson('response-engine'),
          'src': {
            'response-engine.service.js': this.getResponseEngineService(),
            'formatters': {
              'message-formatter.js': '// Message formatting logic'
            }
          },
          'tests': {
            'response-engine.test.js': this.getServiceTest('response-engine')
          }
        },
        'context-manager': {
          'package.json': this.getServicePackageJson('context-manager'),
          'src': {
            'context-manager.service.js': this.getContextManagerService(),
            'optimizers': {
              'token-optimizer.js': '// Token optimization logic'
            }
          },
          'tests': {
            'context-manager.test.js': this.getServiceTest('context-manager')
          }
        },
        'unified-tool-manager': {
          'package.json': this.getServicePackageJson('unified-tool-manager'),
          'src': {
            'unified-tool-manager.service.js': this.getUnifiedToolManagerService(),
            'registry': {
              'tool-registry.js': '// Tool registry implementation'
            }
          },
          'tests': {
            'unified-tool-manager.test.js': this.getServiceTest('unified-tool-manager')
          }
        },
        'vector-db-service': {
          'package.json': this.getServicePackageJson('vector-db-service'),
          'src': {
            'vector-db.service.js': this.getVectorDBService(),
            'embeddings': {
              'embedding-generator.js': '// Embedding generation logic'
            }
          },
          'tests': {
            'vector-db.test.js': this.getServiceTest('vector-db-service')
          }
        },
        'file-service': {
          'package.json': this.getServicePackageJson('file-service'),
          'src': {
            'file-service.service.js': this.getFileService(),
            'processors': {
              'ocr-processor.js': '// OCR processing logic'
            }
          },
          'tests': {
            'file-service.test.js': this.getServiceTest('file-service')
          }
        },
        'shared': {
          'package.json': this.getSharedPackageJson(),
          'src': {
            'utils': {
              'logger.js': this.getLoggerUtil(),
              'validator.js': this.getValidatorUtil(),
              'error-handler.js': this.getErrorHandlerUtil()
            },
            'types': {
              'index.js': this.getTypesIndex()
            },
            'constants': {
              'index.js': this.getConstantsIndex()
            }
          }
        }
      },
      'frontend': {
        'package.json': this.getFrontendPackageJson(),
        'src': {
          'App.tsx': this.getAppTsx(),
          'components': {
            'Chat': {
              'ChatWindow.tsx': '// Chat window component',
              'MessageInput.tsx': '// Message input component',
              'MessageList.tsx': '// Message list component'
            },
            'Common': {
              'Button.tsx': '// Reusable button component',
              'Input.tsx': '// Reusable input component'
            }
          },
          'services': {
            'api.ts': this.getApiService(),
            'websocket.ts': '// WebSocket service'
          },
          'types': {
            'index.ts': this.getFrontendTypes()
          }
        },
        'public': {
          'index.html': this.getIndexHtml()
        }
      },
      'infrastructure': {
        'docker': {
          'Dockerfile.production': this.getProductionDockerfile(),
          'docker-compose.prod.yml': this.getProductionCompose()
        },
        'kubernetes': {
          'namespace.yaml': this.getNamespaceYaml(),
          'api-gateway.yaml': this.getApiGatewayK8s()
        },
        'terraform': {
          'main.tf': this.getTerraformMain(),
          'variables.tf': this.getTerraformVariables()
        }
      },
      'scripts': {
        'setup-databases.js': this.getSetupDatabasesScript(),
        'generate-progress-badge.js': this.getProgressBadgeScript(),
        'update-copilot-context.js': this.getUpdateCopilotContextScript()
      },
      '.copilot': {
        'context.md': this.getCopilotContext(),
        'architecture.md': this.getCopilotArchitecture(),
        'coding-standards.md': this.getCopilotCodingStandards()
      },
      'milestone-tracker.json': this.getMilestoneTracker(),
      'package.json': this.getRootPackageJson(),
      'README.md': this.getReadme(),
      '.gitignore': this.getGitignore(),
      'jest.config.js': this.getJestConfig(),
      '.eslintrc.js': this.getEslintConfig(),
      '.prettierrc': this.getPrettierConfig(),
      'tsconfig.json': this.getTsConfig()
    };

    await this.createStructure(structure, this.projectRoot);
    console.log('✅ Project structure generated successfully!');
  }

  async createStructure(structure, basePath) {
    for (const [name, content] of Object.entries(structure)) {
      const fullPath = path.join(basePath, name);
      
      if (typeof content === 'object') {
        // It's a directory
        await fs.mkdir(fullPath, { recursive: true });
        await this.createStructure(content, fullPath);
      } else {
        // It's a file
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content);
        console.log(`📄 Created: ${path.relative(this.projectRoot, fullPath)}`);
      }
    }
  }

  // Service template methods
  getServicePackageJson(serviceName) {
    return JSON.stringify({
      "name": `@rhajaina/${serviceName}`,
      "version": "1.0.0",
      "description": `Rhajaina ${serviceName} service`,
      "main": `src/${serviceName}.service.js`,
      "scripts": {
        "start": "node src/index.js",
        "dev": "nodemon src/index.js",
        "test": "jest",
        "test:watch": "jest --watch",
        "lint": "eslint src/",
        "lint:fix": "eslint src/ --fix"
      },
      "dependencies": {
        "moleculer": "^0.14.32",
        "moleculer-web": "^0.10.7",
        "ioredis": "^5.3.2",
        "mongodb": "^6.3.0",
        "@qdrant/qdrant-js": "^1.7.0",
        "axios": "^1.6.2",
        "joi": "^17.11.0",
        "winston": "^3.11.0"
      },
      "devDependencies": {
        "jest": "^29.7.0",
        "nodemon": "^3.0.2",
        "eslint": "^8.55.0",
        "supertest": "^6.3.3"
      }
    }, null, 2);
  }

  getRequestProcessorService() {
    return `/**
 * RequestProcessor Service
 * Main entry point for all user requests
 * Implements: Think → Act → Respond pipeline initiation
 */

const { Service } = require('moleculer');
const ApiGateway = require('moleculer-web');

module.exports = {
  name: 'request-processor',
  version: '1.0.0',
  
  mixins: [ApiGateway],
  
  settings: {
    // Service-specific settings
    maxRequestSize: '10MB',
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    
    routes: [
      {
        path: '/api/v1',
        aliases: {
          'POST /chat/message': 'request-processor.processMessage',
          'GET /chat/history/:chatId': 'request-processor.getChatHistory',
          'POST /chat/new': 'request-processor.createNewChat'
        },
        
        bodyParsers: {
          json: { limit: '10MB' },
          urlencoded: { extended: true, limit: '10MB' }
        },
        
        onBeforeCall(ctx, route, req) {
          // Authentication middleware
          return this.authenticateRequest(ctx, req);
        }
      }
    ]
  },
  
  dependencies: [
    'context-manager',
    'think-engine'
  ],
  
  actions: {
    /**
     * Process incoming chat message
     * Initiates the Think → Act → Respond pipeline
     */
    processMessage: {
      params: {
        message: { type: 'string', min: 1 },
        chatId: { type: 'string', optional: true },
        userId: { type: 'string' },
        modelId: { type: 'string', optional: true }
      },
      
      async handler(ctx) {
        try {
          const { message, chatId, userId, modelId } = ctx.params;
          
          // Generate request ID for tracking
          const requestId = this.generateRequestId();
          ctx.meta.requestId = requestId;
          
          this.logger.info('Processing message request', {
            requestId,
            userId,
            chatId,
            messageLength: message.length
          });
          
          // Get or create chat context
          const context = await ctx.call('context-manager.getContext', {
            chatId,
            userId
          });
          
          // Initiate Think phase
          const thinkResult = await ctx.call('think-engine.analyze', {
            message,
            context,
            userId,
            modelId: modelId || 'gpt-3.5-turbo'
          });
          
          return {
            success: true,
            data: {
              requestId,
              chatId: context.chatId,
              response: thinkResult
            }
          };
          
        } catch (error) {
          this.logger.error('Failed to process message', error);
          throw error;
        }
      }
    },
    
    /**
     * Get chat history
     */
    getChatHistory: {
      params: {
        chatId: { type: 'string' },
        userId: { type: 'string' },
        limit: { type: 'number', optional: true, default: 50 },
        offset: { type: 'number', optional: true, default: 0 }
      },
      
      async handler(ctx) {
        try {
          const { chatId, userId, limit, offset } = ctx.params;
          
          const history = await ctx.call('context-manager.getChatHistory', {
            chatId,
            userId,
            limit,
            offset
          });
          
          return {
            success: true,
            data: history
          };
          
        } catch (error) {
          this.logger.error('Failed to get chat history', error);
          throw error;
        }
      }
    },
    
    /**
     * Create new chat session
     */
    createNewChat: {
      params: {
        userId: { type: 'string' },
        title: { type: 'string', optional: true }
      },
      
      async handler(ctx) {
        try {
          const { userId, title } = ctx.params;
          
          const chat = await ctx.call('context-manager.createChat', {
            userId,
            title: title || 'New Chat'
          });
          
          return {
            success: true,
            data: chat
          };
          
        } catch (error) {
          this.logger.error('Failed to create new chat', error);
          throw error;
        }
      }
    }
  },
  
  methods: {
    /**
     * Authenticate incoming request
     */
    async authenticateRequest(ctx, req) {
      // TODO: Implement JWT token validation
      // For now, extract user ID from headers
      const userId = req.headers['x-user-id'];
      if (!userId) {
        throw new Error('User ID required');
      }
      
      ctx.meta.userId = userId;
      return ctx;
    },
    
    /**
     * Generate unique request ID
     */
    generateRequestId() {
      return \`req_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
    }
  },
  
  async started() {
    this.logger.info('RequestProcessor service started');
  },
  
  async stopped() {
    this.logger.info('RequestProcessor service stopped');
  }
};`;
  }

  getThinkEngineService() {
    return `/**
 * ThinkEngine Service
 * Analyzes user intent and determines next actions
 * Core component of the Think → Act → Respond pipeline
 */

const { Service } = require('moleculer');

module.exports = {
  name: 'think-engine',
  version: '1.0.0',
  
  settings: {
    // AI model configurations
    defaultModel: 'gpt-3.5-turbo',
    models: {
      'gpt-3.5-turbo': {
        provider: 'openai',
        maxTokens: 4096,
        temperature: 0.7
      },
      'claude-3-sonnet': {
        provider: 'anthropic',
        maxTokens: 200000,
        temperature: 0.7
      }
    }
  },
  
  dependencies: [
    'action-engine',
    'response-engine',
    'context-manager'
  ],
  
  actions: {
    /**
     * Analyze user message and determine response strategy
     */
    analyze: {
      params: {
        message: { type: 'string' },
        context: { type: 'object' },
        userId: { type: 'string' },
        modelId: { type: 'string', optional: true }
      },
      
      async handler(ctx) {
        try {
          const { message, context, userId, modelId } = ctx.params;
          const requestId = ctx.meta.requestId;
          
          this.logger.info('Analyzing message', {
            requestId,
            userId,
            modelId: modelId || this.settings.defaultModel
          });
          
          // Step 1: Analyze intent
          const intentAnalysis = await this.analyzeIntent(message, context);
          
          // Step 2: Determine if tools are needed
          const toolAnalysis = await this.analyzeToolRequirements(message, intentAnalysis);
          
          // Step 3: Decide on action path
          if (toolAnalysis.requiresTools) {
            // Route to ActionEngine for tool execution
            return await this.executeActionPath(ctx, {
              message,
              context,
              intentAnalysis,
              toolAnalysis,
              modelId
            });
          } else {
            // Route directly to ResponseEngine for LLM response
            return await this.executeDirectResponse(ctx, {
              message,
              context,
              intentAnalysis,
              modelId
            });
          }
          
        } catch (error) {
          this.logger.error('Analysis failed', error);
          throw error;
        }
      }
    }
  },
  
  methods: {
    /**
     * Analyze user intent from message
     */
    async analyzeIntent(message, context) {
      // Simple intent classification
      // TODO: Implement more sophisticated intent analysis
      
      const intents = {
        question: /\\b(what|how|why|when|where|who)\\b/i.test(message),
        request: /\\b(please|can you|could you|would you)\\b/i.test(message),
        search: /\\b(find|search|look for)\\b/i.test(message),
        fileOperation: /\\b(upload|download|file|document)\\b/i.test(message),
        casual: /\\b(hi|hello|thanks|bye)\\b/i.test(message)
      };
      
      const primaryIntent = Object.keys(intents).find(intent => intents[intent]) || 'general';
      
      return {
        primary: primaryIntent,
        confidence: 0.8, // TODO: Implement confidence scoring
        entities: this.extractEntities(message),
        sentiment: this.analyzeSentiment(message)
      };
    },
    
    /**
     * Analyze if tools are required for this request
     */
    async analyzeToolRequirements(message, intentAnalysis) {
      const toolRequirements = {
        requiresTools: false,
        suggestedTools: [],
        reasoning: ''
      };
      
      // File operations
      if (intentAnalysis.primary === 'fileOperation') {
        toolRequirements.requiresTools = true;
        toolRequirements.suggestedTools.push('file-service');
        toolRequirements.reasoning = 'File operation detected';
      }
      
      // Search requests
      if (intentAnalysis.primary === 'search') {
        toolRequirements.requiresTools = true;
        toolRequirements.suggestedTools.push('vector-search');
        toolRequirements.reasoning = 'Search operation detected';
      }
      
      return toolRequirements;
    },
    
    /**
     * Execute action path (with tools)
     */
    async executeActionPath(ctx, params) {
      const { message, context, intentAnalysis, toolAnalysis, modelId } = params;
      
      // Call ActionEngine to execute tools
      const actionResult = await ctx.call('action-engine.execute', {
        tools: toolAnalysis.suggestedTools,
        message,
        context,
        intentAnalysis
      });
      
      // Pass action result to ResponseEngine
      return await ctx.call('response-engine.generateResponse', {
        message,
        context,
        actionResult,
        modelId
      });
    },
    
    /**
     * Execute direct response path (no tools)
     */
    async executeDirectResponse(ctx, params) {
      const { message, context, intentAnalysis, modelId } = params;
      
      // Direct call to ResponseEngine
      return await ctx.call('response-engine.generateResponse', {
        message,
        context,
        intentAnalysis,
        modelId
      });
    },
    
    /**
     * Extract entities from message
     */
    extractEntities(message) {
      // Simple entity extraction
      // TODO: Implement NER (Named Entity Recognition)
      return {
        dates: [],
        names: [],
        locations: []
      };
    },
    
    /**
     * Analyze message sentiment
     */
    analyzeSentiment(message) {
      // Simple sentiment analysis
      // TODO: Implement proper sentiment analysis
      const positiveWords = /\\b(good|great|excellent|amazing|love|like)\\b/i;
      const negativeWords = /\\b(bad|terrible|awful|hate|dislike)\\b/i;
      
      if (positiveWords.test(message)) return 'positive';
      if (negativeWords.test(message)) return 'negative';
      return 'neutral';
    }
  },
  
  async started() {
    this.logger.info('ThinkEngine service started');
  },
  
  async stopped() {
    this.logger.info('ThinkEngine service stopped');
  }
};`;
  }

  getMilestoneTracker() {
    return JSON.stringify({
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
              "description": "Set up development environment with Docker, databases, and monitoring",
              "status": "not_started",
              "dependencies": [],
              "tasks": [
                "Project structure generation",
                "Docker environment configuration",
                "MongoDB setup and initialization",
                "Redis setup for caching",
                "Qdrant vector database setup",
                "NATS message broker setup",
                "Basic monitoring and logging setup",
                "GitHub Copilot context configuration"
              ],
              "estimatedHours": 12,
              "actualHours": 0,
              "completedAt": null,
              "copilotPrompts": [
                "Generate Docker Compose configuration for microservices development",
                "Create MongoDB initialization scripts with proper schemas",
                "Set up Redis configuration with password authentication",
                "Configure Qdrant vector database for semantic search"
              ]
            },
            {
              "id": "M1.2",
              "name": "Moleculer Microservices Foundation",
              "description": "Set up Moleculer broker and basic service structure",
              "status": "not_started",
              "dependencies": ["M1.1"],
              "tasks": [
                "Moleculer broker configuration",
                "Service registry setup",
                "Inter-service communication (NATS)",
                "Basic error handling framework",
                "Health check endpoints",
                "Service discovery implementation",
                "Shared utilities and types"
              ],
              "estimatedHours": 16,
              "actualHours": 0,
              "completedAt": null,
              "copilotPrompts": [
                "Create Moleculer service template following best practices",
                "Implement NATS transporter configuration",
                "Generate health check middleware for all services",
                "Create shared error handling utilities"
              ]
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
              "description": "Implement the main entry point service for all requests",
              "status": "not_started",
              "dependencies": ["M1.2"],
              "tasks": [
                "API Gateway integration",
                "Request validation middleware",
                "Authentication system",
                "Rate limiting implementation",
                "Request routing logic",
                "Response formatting",
                "Error handling and logging"
              ],
              "estimatedHours": 20,
              "actualHours": 0,
              "completedAt": null,
              "copilotPrompts": [
                "Implement RequestProcessor service with Moleculer-web integration",
                "Create JWT authentication middleware",
                "Add rate limiting with Redis backend",
                "Generate request validation schemas using Joi"
              ]
            },
            {
              "id": "M2.2",
              "name": "ThinkEngine Service",
              "description": "Implement intent analysis and decision making engine",
              "status": "not_started",
              "dependencies": ["M2.1"],
              "tasks": [
                "Intent classification system",
                "Context analysis logic",
                "Decision tree implementation",
                "Model selection algorithm",
                "Tool requirement analysis",
                "Fallback handling",
                "Performance optimization"
              ],
              "estimatedHours": 28,
              "actualHours": 0,
              "completedAt": null,
              "copilotPrompts": [
                "Create ThinkEngine service with intent analysis capabilities",
                "Implement decision tree for tool vs direct response routing",
                "Add support for multiple AI model selection",
                "Generate tool requirement analysis logic"
              ]
            },
            {
              "id": "M2.3",
              "name": "ActionEngine Service",
              "description": "Implement tool execution and coordination",
              "status": "not_started",
              "dependencies": ["M2.2"],
              "tasks": [
                "Tool execution framework",
                "UnifiedToolManager integration",
                "Parallel tool execution",
                "Tool result aggregation",
                "Error handling for tool failures",
                "Tool performance monitoring",
                "MCP protocol support"
              ],
              "estimatedHours": 24,
              "actualHours": 0,
              "completedAt": null,
              "copilotPrompts": [
                "Implement ActionEngine service for tool orchestration",
                "Create tool execution framework with error handling",
                "Add support for parallel tool execution",
                "Generate MCP protocol integration"
              ]
            }
          ]
        }
      },
      "currentMilestone": "M1.1",
      "lastUpdated": "2025-06-22T10:00:00Z"
    }, null, 2);
  }

  // Additional helper methods for generating other files...
  getCopilotContext() {
    return `# Rhajaina AI Chat Application - GitHub Copilot Context

## Project Overview
Rhajaina is a sophisticated AI chat application built using a microservices architecture. The system implements a "Think → Act → Respond" pipeline for processing user requests intelligently.

## Architecture
- **Framework**: Moleculer microservices (Node.js)
- **Databases**: MongoDB (primary), Qdrant (vector), Redis (cache)
- **Message Broker**: NATS
- **Frontend**: React + TypeScript
- **Deployment**: Docker + Kubernetes

## Core Services
1. **RequestProcessor**: Entry point for all requests, handles authentication and routing
2. **ThinkEngine**: Analyzes user intent and determines whether tools are needed
3. **ActionEngine**: Executes tools and coordinates their results
4. **ResponseEngine**: Generates final responses using AI models
5. **ContextManager**: Manages conversation context and token optimization
6. **UnifiedToolManager**: Registry and interface for all available tools

## Current Implementation Phase
{MILESTONE_CONTEXT_PLACEHOLDER}

## Coding Guidelines for Copilot
- Use async/await for all asynchronous operations
- Implement proper error handling with try-catch blocks
- Add JSDoc comments for all functions
- Follow Moleculer service structure patterns
- Use environment variables for configuration
- Implement comprehensive logging
- Write unit tests for all new functionality

## File Structure
\`\`\`
services/
├── api-gateway/          # HTTP API gateway
├── request-processor/    # Main request handler
├── think-engine/         # Intent analysis
├── action-engine/        # Tool execution
├── response-engine/      # Response generation
├── context-manager/      # Context management
├── unified-tool-manager/ # Tool registry
├── vector-db-service/    # Vector operations
├── file-service/         # File handling
└── shared/              # Shared utilities
\`\`\`
`;
  }

  getRootPackageJson() {
    return JSON.stringify({
      "name": "rhajaina-ai-chat",
      "version": "1.0.0",
      "description": "Advanced AI Chat Application with microservices architecture",
      "main": "index.js",
      "scripts": {
        "dev": "docker-compose -f docker-compose.dev.yml up",
        "dev:down": "docker-compose -f docker-compose.dev.yml down",
        "setup": "./scripts/setup-dev.sh",
        "generate-structure": "node scripts/generate-project-structure.js",
        "milestone:status": "node scripts/milestone-tracker.js status",
        "milestone:start": "node scripts/milestone-tracker.js start",
        "milestone:complete": "node scripts/milestone-tracker.js complete",
        "resume": "./scripts/resume-from-milestone.sh",
        "test": "jest --projects services/*/jest.config.js",
        "test:watch": "jest --watch --projects services/*/jest.config.js",
        "lint": "eslint services/*/src/**/*.js",
        "lint:fix": "eslint services/*/src/**/*.js --fix",
        "db:setup": "node scripts/setup-databases.js",
        "copilot:context": "node scripts/update-copilot-context.js"
      },
      "workspaces": [
        "services/*",
        "frontend"
      ],
      "devDependencies": {
        "jest": "^29.7.0",
        "eslint": "^8.55.0",
        "@typescript-eslint/eslint-plugin": "^6.14.0",
        "@typescript-eslint/parser": "^6.14.0",
        "prettier": "^3.1.1",
        "nodemon": "^3.0.2"
      },
      "engines": {
        "node": ">=18.0.0",
        "npm": ">=8.0.0"
      }
    }, null, 2);
  }

  // Additional service templates
  getActionEngineService() {
    return `/**
 * ActionEngine Service
 * Executes tools and coordinates their results
 * Part of the Think → Act → Respond pipeline
 */

const { Service } = require('moleculer');

module.exports = {
  name: 'action-engine',
  version: '1.0.0',
  
  settings: {
    // Tool execution settings
    maxConcurrentTools: 5,
    toolTimeout: 30000, // 30 seconds
    retryAttempts: 3
  },
  
  dependencies: [
    'unified-tool-manager',
    'response-engine'
  ],
  
  actions: {
    /**
     * Execute tools based on ThinkEngine analysis
     */
    execute: {
      params: {
        tools: { type: 'array', items: 'string' },
        message: { type: 'string' },
        context: { type: 'object' },
        intentAnalysis: { type: 'object' }
      },
      
      async handler(ctx) {
        try {
          const { tools, message, context, intentAnalysis } = ctx.params;
          const requestId = ctx.meta.requestId;
          
          this.logger.info('Executing tools', {
            requestId,
            tools,
            toolCount: tools.length
          });
          
          // Execute tools in parallel or sequence based on dependencies
          const toolResults = await this.executeTools(ctx, {
            tools,
            message,
            context,
            intentAnalysis
          });
          
          // Aggregate and format results
          const aggregatedResult = await this.aggregateResults(toolResults);
          
          return {
            success: true,
            data: {
              toolResults: aggregatedResult,
              executionSummary: this.generateExecutionSummary(toolResults)
            }
          };
          
        } catch (error) {
          this.logger.error('Tool execution failed', error);
          throw error;
        }
      }
    }
  },
  
  methods: {
    /**
     * Execute multiple tools
     */
    async executeTools(ctx, params) {
      const { tools, message, context, intentAnalysis } = params;
      const results = [];
      
      for (const toolName of tools) {
        try {
          const toolResult = await this.executeSingleTool(ctx, {
            toolName,
            message,
            context,
            intentAnalysis
          });
          
          results.push({
            tool: toolName,
            success: true,
            result: toolResult,
            executedAt: new Date().toISOString()
          });
          
        } catch (error) {
          this.logger.error(\`Tool \${toolName} execution failed\`, error);
          
          results.push({
            tool: toolName,
            success: false,
            error: error.message,
            executedAt: new Date().toISOString()
          });
        }
      }
      
      return results;
    },
    
    /**
     * Execute a single tool
     */
    async executeSingleTool(ctx, params) {
      const { toolName, message, context, intentAnalysis } = params;
      
      // Get tool information from UnifiedToolManager
      const toolInfo = await ctx.call('unified-tool-manager.getTool', {
        toolName
      });
      
      if (!toolInfo) {
        throw new Error(\`Tool \${toolName} not found\`);
      }
      
      // Execute the tool
      return await ctx.call('unified-tool-manager.execute', {
        toolName,
        input: {
          message,
          context,
          intentAnalysis
        }
      });
    },
    
    /**
     * Aggregate tool results
     */
    async aggregateResults(toolResults) {
      const successful = toolResults.filter(r => r.success);
      const failed = toolResults.filter(r => !r.success);
      
      return {
        totalTools: toolResults.length,
        successfulTools: successful.length,
        failedTools: failed.length,
        results: successful.map(r => ({
          tool: r.tool,
          data: r.result,
          timestamp: r.executedAt
        })),
        errors: failed.map(r => ({
          tool: r.tool,
          error: r.error,
          timestamp: r.executedAt
        }))
      };
    },
    
    /**
     * Generate execution summary
     */
    generateExecutionSummary(toolResults) {
      const successful = toolResults.filter(r => r.success);
      const failed = toolResults.filter(r => !r.success);
      
      return {
        summary: \`Executed \${toolResults.length} tools: \${successful.length} successful, \${failed.length} failed\`,
        successRate: (successful.length / toolResults.length) * 100,
        toolsExecuted: toolResults.map(r => r.tool),
        hasErrors: failed.length > 0
      };
    }
  },
  
  async started() {
    this.logger.info('ActionEngine service started');
  },
  
  async stopped() {
    this.logger.info('ActionEngine service stopped');
  }
};`;
  }

  getResponseEngineService() {
    return `/**
 * ResponseEngine Service
 * Generates final responses using AI models
 * Final step in the Think → Act → Respond pipeline
 */

const { Service } = require('moleculer');
const axios = require('axios');

module.exports = {
  name: 'response-engine',
  version: '1.0.0',
  
  settings: {
    // AI model configurations
    models: {
      'openai': {
        baseURL: 'https://api.openai.com/v1',
        models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']
      },
      'anthropic': {
        baseURL: 'https://api.anthropic.com/v1',
        models: ['claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
      }
    },
    defaultModel: 'gpt-3.5-turbo',
    maxTokens: 2048,
    temperature: 0.7
  },
  
  dependencies: [
    'context-manager'
  ],
  
  actions: {
    /**
     * Generate response using AI model
     */
    generateResponse: {
      params: {
        message: { type: 'string' },
        context: { type: 'object' },
        modelId: { type: 'string', optional: true },
        actionResult: { type: 'object', optional: true },
        intentAnalysis: { type: 'object', optional: true }
      },
      
      async handler(ctx) {
        try {
          const { message, context, modelId, actionResult, intentAnalysis } = ctx.params;
          const requestId = ctx.meta.requestId;
          
          const model = modelId || this.settings.defaultModel;
          
          this.logger.info('Generating response', {
            requestId,
            model,
            hasActionResult: !!actionResult
          });
          
          // Prepare prompt based on whether we have tool results
          const prompt = await this.preparePrompt({
            message,
            context,
            actionResult,
            intentAnalysis
          });
          
          // Generate response using specified model
          const response = await this.callAIModel({
            model,
            prompt,
            context
          });
          
          // Save the interaction to context
          await ctx.call('context-manager.addMessage', {
            chatId: context.chatId,
            message: {
              role: 'user',
              content: message,
              timestamp: new Date().toISOString()
            }
          });
          
          await ctx.call('context-manager.addMessage', {
            chatId: context.chatId,
            message: {
              role: 'assistant',
              content: response.content,
              model: model,
              toolResults: actionResult,
              timestamp: new Date().toISOString()
            }
          });
          
          return {
            success: true,
            data: {
              response: response.content,
              model: model,
              usage: response.usage,
              toolsUsed: actionResult ? Object.keys(actionResult.results || {}) : []
            }
          };
          
        } catch (error) {
          this.logger.error('Response generation failed', error);
          throw error;
        }
      }
    }
  },
  
  methods: {
    /**
     * Prepare prompt for AI model
     */
    async preparePrompt(params) {
      const { message, context, actionResult, intentAnalysis } = params;
      
      let systemPrompt = \`You are Rhajaina, an advanced AI assistant. You help users with various tasks through natural conversation.\`;
      
      // Add tool result context if available
      if (actionResult && actionResult.results) {
        systemPrompt += \`\\n\\nYou have access to tool results that can help answer the user's question. Use this information to provide a comprehensive and accurate response.\`;
        
        systemPrompt += \`\\n\\nTool Results:\\n\${JSON.stringify(actionResult.results, null, 2)}\`;
      }
      
      // Prepare conversation history
      const messages = [
        { role: 'system', content: systemPrompt }
      ];
      
      // Add recent conversation history
      if (context.messages && context.messages.length > 0) {
        const recentMessages = context.messages.slice(-10); // Last 10 messages
        messages.push(...recentMessages);
      }
      
      // Add current user message
      messages.push({
        role: 'user',
        content: message
      });
      
      return messages;
    },
    
    /**
     * Call AI model API
     */
    async callAIModel(params) {
      const { model, prompt, context } = params;
      
      // Determine provider based on model
      const provider = this.getModelProvider(model);
      
      switch (provider) {
        case 'openai':
          return await this.callOpenAI(model, prompt);
        case 'anthropic':
          return await this.callAnthropic(model, prompt);
        default:
          throw new Error(\`Unsupported model provider: \${provider}\`);
      }
    },
    
    /**
     * Call OpenAI API
     */
    async callOpenAI(model, messages) {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: model,
          messages: messages,
          max_tokens: this.settings.maxTokens,
          temperature: this.settings.temperature
        },
        {
          headers: {
            'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        content: response.data.choices[0].message.content,
        usage: response.data.usage
      };
    },
    
    /**
     * Call Anthropic API
     */
    async callAnthropic(model, messages) {
      // Convert OpenAI format to Anthropic format
      const systemMessage = messages.find(m => m.role === 'system');
      const conversationMessages = messages.filter(m => m.role !== 'system');
      
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: model,
          max_tokens: this.settings.maxTokens,
          system: systemMessage?.content || '',
          messages: conversationMessages
        },
        {
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          }
        }
      );
      
      return {
        content: response.data.content[0].text,
        usage: response.data.usage
      };
    },
    
    /**
     * Get model provider
     */
    getModelProvider(model) {
      if (model.startsWith('gpt')) return 'openai';
      if (model.startsWith('claude')) return 'anthropic';
      if (model.startsWith('gemini')) return 'google';
      return 'openai'; // default
    }
  },
  
  async started() {
    this.logger.info('ResponseEngine service started');
  },
  
  async stopped() {
    this.logger.info('ResponseEngine service stopped');
  }
};`;
  }

  getContextManagerService() {
    return `/**
 * ContextManager Service
 * Manages conversation context and token optimization
 * Stores and retrieves chat history and user context
 */

const { Service } = require('moleculer');
const { MongoClient, ObjectId } = require('mongodb');

module.exports = {
  name: 'context-manager',
  version: '1.0.0',
  
  settings: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rhajaina'
    },
    // Context management settings
    maxContextLength: 4000, // tokens
    maxMessagesInContext: 50,
    contextCompressionThreshold: 0.8
  },
  
  dependencies: [],
  
  actions: {
    /**
     * Get or create chat context
     */
    getContext: {
      params: {
        chatId: { type: 'string', optional: true },
        userId: { type: 'string' }
      },
      
      async handler(ctx) {
        try {
          const { chatId, userId } = ctx.params;
          
          if (chatId) {
            // Get existing chat
            const chat = await this.getChat(chatId, userId);
            if (!chat) {
              throw new Error('Chat not found');
            }
            return chat;
          } else {
            // Create new chat
            return await this.createNewChat(userId);
          }
          
        } catch (error) {
          this.logger.error('Failed to get context', error);
          throw error;
        }
      }
    },
    
    /**
     * Create new chat
     */
    createChat: {
      params: {
        userId: { type: 'string' },
        title: { type: 'string', optional: true }
      },
      
      async handler(ctx) {
        try {
          const { userId, title } = ctx.params;
          return await this.createNewChat(userId, title);
          
        } catch (error) {
          this.logger.error('Failed to create chat', error);
          throw error;
        }
      }
    },
    
    /**
     * Add message to chat
     */
    addMessage: {
      params: {
        chatId: { type: 'string' },
        message: { type: 'object' }
      },
      
      async handler(ctx) {
        try {
          const { chatId, message } = ctx.params;
          
          const result = await this.db.collection('messages').insertOne({
            chatId: new ObjectId(chatId),
            ...message,
            createdAt: new Date()
          });
          
          // Update chat's last message timestamp
          await this.db.collection('chats').updateOne(
            { _id: new ObjectId(chatId) },
            { 
              $set: { 
                updatedAt: new Date(),
                lastMessageAt: new Date()
              } 
            }
          );
          
          return {
            success: true,
            messageId: result.insertedId.toString()
          };
          
        } catch (error) {
          this.logger.error('Failed to add message', error);
          throw error;
        }
      }
    },
    
    /**
     * Get chat history
     */
    getChatHistory: {
      params: {
        chatId: { type: 'string' },
        userId: { type: 'string' },
        limit: { type: 'number', optional: true, default: 50 },
        offset: { type: 'number', optional: true, default: 0 }
      },
      
      async handler(ctx) {
        try {
          const { chatId, userId, limit, offset } = ctx.params;
          
          // Verify user has access to this chat
          const chat = await this.getChat(chatId, userId);
          if (!chat) {
            throw new Error('Chat not found or access denied');
          }
          
          const messages = await this.db.collection('messages')
            .find({ chatId: new ObjectId(chatId) })
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .toArray();
          
          return {
            chatId,
            messages: messages.reverse(), // Oldest first
            pagination: {
              limit,
              offset,
              total: await this.db.collection('messages').countDocuments({
                chatId: new ObjectId(chatId)
              })
            }
          };
          
        } catch (error) {
          this.logger.error('Failed to get chat history', error);
          throw error;
        }
      }
    },
    
    /**
     * Optimize context for token limits
     */
    optimizeContext: {
      params: {
        chatId: { type: 'string' },
        maxTokens: { type: 'number', optional: true }
      },
      
      async handler(ctx) {
        try {
          const { chatId, maxTokens } = ctx.params;
          const tokenLimit = maxTokens || this.settings.maxContextLength;
          
          const messages = await this.db.collection('messages')
            .find({ chatId: new ObjectId(chatId) })
            .sort({ createdAt: -1 })
            .limit(this.settings.maxMessagesInContext)
            .toArray();
          
          // Reverse to get chronological order
          messages.reverse();
          
          // Estimate tokens and truncate if necessary
          const optimizedMessages = this.truncateToTokenLimit(messages, tokenLimit);
          
          return {
            messages: optimizedMessages,
            tokenEstimate: this.estimateTokens(optimizedMessages),
            truncated: optimizedMessages.length < messages.length
          };
          
        } catch (error) {
          this.logger.error('Failed to optimize context', error);
          throw error;
        }
      }
    }
  },
  
  methods: {
    /**
     * Get chat by ID and user
     */
    async getChat(chatId, userId) {
      const chat = await this.db.collection('chats').findOne({
        _id: new ObjectId(chatId),
        userId: userId
      });
      
      if (!chat) return null;
      
      // Get recent messages for context
      const messages = await this.db.collection('messages')
        .find({ chatId: new ObjectId(chatId) })
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray();
      
      return {
        chatId: chat._id.toString(),
        userId: chat.userId,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        messages: messages.reverse() // Chronological order
      };
    },
    
    /**
     * Create new chat
     */
    async createNewChat(userId, title = 'New Chat') {
      const chat = {
        userId,
        title,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: null
      };
      
      const result = await this.db.collection('chats').insertOne(chat);
      
      return {
        chatId: result.insertedId.toString(),
        userId,
        title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        messages: []
      };
    },
    
    /**
     * Estimate token count for messages
     */
    estimateTokens(messages) {
      // Simple estimation: ~4 characters per token
      const totalChars = messages.reduce((sum, msg) => {
        return sum + (msg.content ? msg.content.length : 0);
      }, 0);
      
      return Math.ceil(totalChars / 4);
    },
    
    /**
     * Truncate messages to fit token limit
     */
    truncateToTokenLimit(messages, tokenLimit) {
      let totalTokens = 0;
      const result = [];
      
      // Start from the most recent messages
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        const msgTokens = this.estimateTokens([msg]);
        
        if (totalTokens + msgTokens <= tokenLimit) {
          result.unshift(msg);
          totalTokens += msgTokens;
        } else {
          break;
        }
      }
      
      return result;
    }
  },
  
  async started() {
    // Connect to MongoDB
    this.client = new MongoClient(this.settings.mongodb.uri);
    await this.client.connect();
    this.db = this.client.db();
    
    // Create indexes
    await this.createIndexes();
    
    this.logger.info('ContextManager service started');
  },
  
  async stopped() {
    if (this.client) {
      await this.client.close();
    }
    this.logger.info('ContextManager service stopped');
  },
  
  async createIndexes() {
    // Chat indexes
    await this.db.collection('chats').createIndex({ userId: 1 });
    await this.db.collection('chats').createIndex({ updatedAt: -1 });
    
    // Message indexes
    await this.db.collection('messages').createIndex({ chatId: 1, createdAt: 1 });
    await this.db.collection('messages').createIndex({ chatId: 1, createdAt: -1 });
  }
};`;
  }

  // Shared utilities
  getLoggerUtil() {
    return `/**
 * Shared Logger Utility
 * Provides consistent logging across all services
 */

const winston = require('winston');

class Logger {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, service, requestId, ...meta }) => {
          const logEntry = {
            timestamp,
            level,
            service: service || serviceName,
            message,
            ...meta
          };
          
          if (requestId) {
            logEntry.requestId = requestId;
          }
          
          return JSON.stringify(logEntry);
        })
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  info(message, meta = {}) {
    this.logger.info(message, { service: this.serviceName, ...meta });
  }

  error(message, error = null, meta = {}) {
    const errorMeta = error ? {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    } : {};
    
    this.logger.error(message, { 
      service: this.serviceName, 
      ...errorMeta, 
      ...meta 
    });
  }

  warn(message, meta = {}) {
    this.logger.warn(message, { service: this.serviceName, ...meta });
  }

  debug(message, meta = {}) {
    this.logger.debug(message, { service: this.serviceName, ...meta });
  }
}

module.exports = Logger;`;
  }

  getSetupDatabasesScript() {
    return `#!/usr/bin/env node

/**
 * Database Setup Script
 * Initializes MongoDB with required collections and indexes
 */

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
    const collections = ['users', 'chats', 'messages', 'files', 'embeddings'];
    
    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(\`📄 Created collection: \${collectionName}\`);
      } catch (error) {
        if (error.code === 48) {
          console.log(\`📄 Collection \${collectionName} already exists\`);
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
    
    // Embeddings collection indexes
    await db.collection('embeddings').createIndex({ documentId: 1 });
    await db.collection('embeddings').createIndex({ type: 1 });
    
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

module.exports = setupDatabases;`;
  }

  // Frontend components
  getAppTsx() {
    return `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import ChatWindow from './components/Chat/ChatWindow';
import { lightTheme } from './themes';
import './App.css';

function App() {
  return (
    <ThemeProvider theme={lightTheme}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<ChatWindow />} />
            <Route path="/chat/:chatId" element={<ChatWindow />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;`;
  }

  getFrontendPackageJson() {
    return JSON.stringify({
      "name": "@rhajaina/frontend",
      "version": "1.0.0",
      "private": true,
      "dependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-router-dom": "^6.8.1",
        "styled-components": "^5.3.6",
        "socket.io-client": "^4.7.4",
        "axios": "^1.6.2",
        "@types/react": "^18.2.45",
        "@types/react-dom": "^18.2.18",
        "typescript": "^4.9.5",
        "react-scripts": "5.0.1"
      },
      "scripts": {
        "start": "react-scripts start",
        "build": "react-scripts build",
        "test": "react-scripts test",
        "eject": "react-scripts eject"
      },
      "eslintConfig": {
        "extends": [
          "react-app",
          "react-app/jest"
        ]
      },
      "browserslist": {
        "production": [
          ">0.2%",
          "not dead",
          "not op_mini all"
        ],
        "development": [
          "last 1 chrome version",
          "last 1 firefox version",
          "last 1 safari version"
        ]
      }
    }, null, 2);
  }

  // Configuration files
  getGitignore() {
    return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
*.tgz
*.tar.gz

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# Docker
.docker

# Database
*.db
*.sqlite

# MacOS
.DS_Store

# Windows
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Uploads
uploads/
temp/

# Local development
docker-compose.override.yml
`;
  }

  getJestConfig() {
    return `module.exports = {
  projects: [
    {
      displayName: 'services',
      testMatch: ['<rootDir>/services/*/tests/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      testEnvironment: 'node',
      collectCoverageFrom: [
        'services/*/src/**/*.js',
        '!services/*/src/**/*.test.js',
        '!services/*/src/**/index.js'
      ]
    },
    {
      displayName: 'frontend',
      testMatch: ['<rootDir>/frontend/src/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/frontend/src/setupTests.js'],
      moduleNameMapping: {
        '^@/(.*): '<rootDir>/frontend/src/$1'
      }
    }
  ],
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/build/**'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  verbose: true
};`;
  }

  getEslintConfig() {
    return `module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'no-undef': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'template-curly-spacing': ['error', 'never'],
    'arrow-spacing': 'error',
    'comma-dangle': ['error', 'never'],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'indent': ['error', 2],
    'max-len': ['error', { 'code': 120 }]
  },
  overrides: [
    {
      files: ['*.test.js', '*.test.ts'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off'
      }
    }
  ]
};`;
  }

  getPrettierConfig() {
    return JSON.stringify({
      "semi": true,
      "trailingComma": "none",
      "singleQuote": true,
      "printWidth": 120,
      "tabWidth": 2,
      "useTabs": false,
      "bracketSpacing": true,
      "arrowParens": "avoid",
      "endOfLine": "lf"
    }, null, 2);
  }

  getTsConfig() {
    return JSON.stringify({
      "compilerOptions": {
        "target": "es2020",
        "module": "commonjs",
        "lib": ["es2020"],
        "declaration": true,
        "declarationMap": true,
        "sourceMap": true,
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "moduleResolution": "node",
        "baseUrl": "./",
        "paths": {
          "@/*": ["src/*"],
          "@shared/*": ["services/shared/src/*"]
        },
        "allowSyntheticDefaultImports": true,
        "esModuleInterop": true,
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "resolveJsonModule": true
      },
      "include": [
        "services/*/src/**/*",
        "frontend/src/**/*",
        "scripts/**/*"
      ],
      "exclude": [
        "node_modules",
        "dist",
        "build",
        "coverage",
        "**/*.test.ts",
        "**/*.test.js"
      ]
    }, null, 2);
  }

  getReadme() {
    return `# Rhajaina AI Chat Application

> Advanced AI Chat Application with microservices architecture and GitHub Copilot integration

## 🚀 Quick Start

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd rhajaina

# Set up the development environment
npm run setup

# Start the first milestone
npm run milestone:start M1.1
\`\`\`

## 📋 Development Progress

Track your progress with our integrated milestone system:

\`\`\`bash
# Check current status
npm run milestone:status

# Complete current milestone
npm run milestone:complete M1.1 8

# Resume from a specific milestone
npm run resume M2.1
\`\`\`

## 🏗️ Architecture

Rhajaina implements a **Think → Act → Respond** pipeline using microservices:

- **RequestProcessor**: Entry point for all requests
- **ThinkEngine**: Intent analysis and decision making
- **ActionEngine**: Tool execution and coordination
- **ResponseEngine**: AI-powered response generation
- **ContextManager**: Context and conversation management
- **UnifiedToolManager**: Tool registry and execution

## 🛠️ Technology Stack

- **Backend**: Node.js + Moleculer microservices
- **Frontend**: React + TypeScript
- **Databases**: MongoDB, Qdrant (vector), Redis (cache)
- **Message Broker**: NATS
- **Containerization**: Docker + Docker Compose
- **AI Integration**: OpenAI, Anthropic, Google AI

## 📁 Project Structure

\`\`\`
rhajaina/
├── services/          # Microservices
│   ├── api-gateway/
│   ├── request-processor/
│   ├── think-engine/
│   ├── action-engine/
│   ├── response-engine/
│   ├── context-manager/
│   ├── unified-tool-manager/
│   ├── vector-db-service/
│   ├── file-service/
│   └── shared/
├── frontend/          # React frontend
├── infrastructure/    # Docker, K8s, Terraform
├── scripts/          # Development scripts
├── .copilot/         # GitHub Copilot context
└── docs/             # Documentation
\`\`\`

## 🤖 GitHub Copilot Integration

This project is optimized for GitHub Copilot:

- **Context Files**: \`.copilot/\` directory provides architecture and coding standards
- **Smart Prompting**: Milestone-based context updates
- **Consistent Patterns**: Service templates and coding guidelines

### Using Copilot Effectively

1. **Start with context**: Reference the current milestone and architecture
2. **Use descriptive comments**: Explain what you want to implement
3. **Follow patterns**: Reference existing service implementations
4. **Test thoroughly**: Always validate generated code

## 🎯 Development Workflow

### 1. Environment Setup
\`\`\`bash
chmod +x scripts/*.sh
npm run setup
\`\`\`

### 2. Start Development
\`\`\`bash
# Start services
npm run dev

# Begin milestone
npm run milestone:start M1.1
\`\`\`

### 3. Development Loop
\`\`\`bash
# Work with GitHub Copilot
# Run tests frequently
npm test

# Complete milestone
npm run milestone:complete M1.1 <hours-spent>
\`\`\`

### 4. Resume if Interrupted
\`\`\`bash
npm run resume M2.1
\`\`\`

## 📊 Monitoring

Access development tools:

- **Moleculer Console**: http://localhost:4000
- **MongoDB Express**: http://localhost:8081
- **Redis Commander**: http://localhost:8082
- **Qdrant Dashboard**: http://localhost:6333/dashboard

## 🧪 Testing

\`\`\`bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Specific service
cd services/request-processor
npm test
\`\`\`

## 📝 Milestone System

The project uses a comprehensive milestone tracking system:

- **Automated Progress Tracking**: JSON-based milestone definitions
- **GitHub Copilot Context Updates**: Automatic context updates per milestone
- **Resumption Capabilities**: Pick up where you left off
- **Time Tracking**: Estimate vs actual time tracking

### Milestone Phases

1. **Phase 1**: Core Infrastructure Setup
2. **Phase 2**: Core Services Implementation
3. **Phase 3**: Advanced Features
4. **Phase 4**: Frontend Development
5. **Phase 5**: Testing & Deployment

## 🔧 Environment Variables

Copy \`.env.example\` to \`.env\` and configure:

\`\`\`bash
# AI Model API Keys
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
GOOGLE_AI_API_KEY=your_key_here

# Database URLs
MONGODB_URI=mongodb://admin:password@localhost:27017/rhajaina?authSource=admin
REDIS_URL=redis://:redispassword@localhost:6379
QDRANT_URL=http://localhost:6333
\`\`\`

## 🚦 Best Practices

### Code Quality
- Follow ESLint and Prettier configurations
- Write comprehensive unit tests
- Use TypeScript for type safety
- Implement proper error handling

### GitHub Copilot Usage
- Provide clear, detailed comments
- Reference architecture patterns
- Use consistent naming conventions
- Review and refine generated code

### Milestone Management
- Complete milestones in order
- Track actual vs estimated hours
- Document any deviations
- Use resumption capabilities

## 🤝 Contributing

1. Follow the milestone system
2. Use GitHub Copilot effectively
3. Write tests for all new features
4. Update documentation
5. Follow the established patterns

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ and GitHub Copilot**
`;
  }

  // GitHub workflow templates
  getCIWorkflow() {
    return `name: Continuous Integration

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:7
        env:
          MONGO_INITDB_ROOT_USERNAME: admin
          MONGO_INITDB_ROOT_PASSWORD: password
          MONGO_INITDB_DATABASE: rhajaina_test
        ports:
          - 27017:27017
          
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
          
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run linting
      run: npm run lint
      
    - name: Run tests
      run: npm test
      env:
        NODE_ENV: test
        MONGODB_URI: mongodb://admin:password@localhost:27017/rhajaina_test?authSource=admin
        REDIS_URL: redis://localhost:6379
        
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        
  build:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build services
      run: |
        cd services/api-gateway && npm run build
        cd ../request-processor && npm run build
        
    - name: Build frontend
      run: |
        cd frontend && npm run build`;
  }

  getMilestoneTrackerWorkflow() {
    return `name: Milestone Tracker

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  track-progress:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Check milestone progress
      run: node scripts/milestone-tracker.js status
      
    - name: Update progress badge
      if: github.ref == 'refs/heads/main'
      run: node scripts/generate-progress-badge.js
        
    - name: Comment progress on PR
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v7
      with:
        script: |
          const { execSync } = require('child_process');
          const output = execSync('node scripts/milestone-tracker.js status').toString();
          
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: \`## 📊 Development Progress\\n\\\`\\\`\\\`\\n\${output}\\n\\\`\\\`\\\`\`
          });`;
  }

  // Template methods for issue templates
  getMilestoneTemplate() {
    return `---
name: Milestone
about: Track a development milestone
title: '[MILESTONE] '
labels: milestone
assignees: ''

---

## Milestone Information
- **Milestone ID**: 
- **Phase**: 
- **Estimated Hours**: 
- **Dependencies**: 

## Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Definition of Done
- [ ] All tasks completed
- [ ] Tests written and passing
- [ ] Code reviewed
- [ ] Documentation updated

## Notes
<!-- Any additional notes or context -->
`;
  }

  getBugReportTemplate() {
    return `---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''

---

## Bug Description
A clear and concise description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
A clear and concise description of what you expected to happen.

## Actual Behavior
A clear and concise description of what actually happened.

## Environment
- Service: [e.g. request-processor, think-engine]
- Version: [e.g. 1.0.0]
- Environment: [e.g. development, production]

## Additional Context
Add any other context about the problem here.
`;
  }

  getFeatureRequestTemplate() {
    return `---
name: Feature Request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement
assignees: ''

---

## Feature Description
A clear and concise description of what you want to happen.

## Problem Statement
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

## Proposed Solution
A clear and concise description of what you want to happen.

## Alternative Solutions
A clear and concise description of any alternative solutions or features you've considered.

## Additional Context
Add any other context or screenshots about the feature request here.

## Implementation Notes
- [ ] Affects multiple services
- [ ] Requires database changes
- [ ] Requires API changes
- [ ] Requires frontend changes
`;
  }
}

// CLI execution
if (require.main === module) {
  const generator = new ProjectStructureGenerator();
  generator.generateStructure().catch(console.error);
}

module.exports = ProjectStructureGenerator;