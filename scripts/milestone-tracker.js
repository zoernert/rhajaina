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

  findMilestone(tracker, milestoneId) {
    for (const phase of Object.values(tracker.phases)) {
      const milestone = phase.milestones.find(m => m.id === milestoneId);
      if (milestone) return milestone;
    }
    return null;
  }

  checkDependencies(tracker, milestone) {
    const uncompletedDeps = [];
    if (milestone.dependencies) {
      for (const depId of milestone.dependencies) {
        const dep = this.findMilestone(tracker, depId);
        if (!dep || dep.status !== 'completed') {
          uncompletedDeps.push(depId);
        }
      }
    }
    return uncompletedDeps;
  }

  findNextMilestone(tracker) {
    for (const phase of Object.values(tracker.phases)) {
      const nextMilestone = phase.milestones.find(m => m.status === 'not_started');
      if (nextMilestone) {
        const uncompletedDeps = this.checkDependencies(tracker, nextMilestone);
        if (uncompletedDeps.length === 0) {
          return nextMilestone;
        }
      }
    }
    return null;
  }

  async updateProgress(tracker) {
    for (const phase of Object.values(tracker.phases)) {
      const completed = phase.milestones.filter(m => m.status === 'completed').length;
      const total = phase.milestones.length;
      phase.progress = Math.round((completed / total) * 100);
      
      if (phase.progress === 100) {
        phase.status = 'completed';
      } else if (completed > 0) {
        phase.status = 'in_progress';
      }
    }
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

## 🎯 Focus Areas for Current Milestone

When implementing **${milestone.name}**, focus on:
- Following the Moleculer microservices pattern
- Implementing proper error handling and logging
- Using the shared utilities and types
- Adding comprehensive tests
- Documenting API endpoints and methods

Remember: This is part of the Think→Act→Respond pipeline architecture.
`;

    await fs.writeFile(path.join(this.contextDir, 'context.md'), contextContent);
  }

  async status() {
    const tracker = await this.loadTracker();
    
    console.log(`\n📊 Project Status: ${tracker.project} v${tracker.version}`);
    console.log(`🎯 Current Milestone: ${tracker.currentMilestone}\n`);
    
    for (const [phaseKey, phase] of Object.entries(tracker.phases)) {
      console.log(`📋 ${phase.name} (${phase.progress}% complete)`);
      
      for (const milestone of phase.milestones) {
        const statusIcon = milestone.status === 'completed' ? '✅' : 
                          milestone.status === 'in_progress' ? '🚧' : '⭕';
        const timeInfo = milestone.actualHours > 0 ? 
                        ` (${milestone.actualHours}h/${milestone.estimatedHours}h)` : 
                        ` (est. ${milestone.estimatedHours}h)`;
        
        console.log(`   ${statusIcon} ${milestone.id}: ${milestone.name}${timeInfo}`);
      }
      console.log('');
    }
  }
}

async function main() {
  const tracker = new MilestoneTracker();
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case 'status':
      await tracker.status();
      break;
    case 'start':
      if (!args[0]) {
        console.error('❌ Usage: npm run milestone:start <milestone-id>');
        process.exit(1);
      }
      await tracker.startMilestone(args[0]);
      break;
    case 'complete':
      if (!args[0]) {
        console.error('❌ Usage: npm run milestone:complete <milestone-id> [actual-hours]');
        process.exit(1);
      }
      await tracker.completeMilestone(args[0], parseInt(args[1]) || 0);
      break;
    default:
      console.log('📋 Milestone Tracker Commands:');
      console.log('  npm run milestone:status           - Show current progress');
      console.log('  npm run milestone:start <id>       - Start a milestone');
      console.log('  npm run milestone:complete <id> <hours> - Complete a milestone');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = MilestoneTracker;