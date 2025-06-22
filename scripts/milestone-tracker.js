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

  async checkRepositoryReadiness() {
    console.log('🔍 Analyzing repository readiness...\n');
    
    const checks = {
      environment: { passed: 0, total: 0, issues: [] },
      structure: { passed: 0, total: 0, issues: [] },
      dependencies: { passed: 0, total: 0, issues: [] },
      configuration: { passed: 0, total: 0, issues: [] },
      documentation: { passed: 0, total: 0, issues: [] }
    };

    await this.checkEnvironment(checks.environment);
    await this.checkProjectStructure(checks.structure);
    await this.checkDependencies(checks.dependencies);
    await this.checkConfiguration(checks.configuration);
    await this.checkDocumentation(checks.documentation);

    this.displayCheckResults(checks);
    
    const totalPassed = Object.values(checks).reduce((sum, check) => sum + check.passed, 0);
    const totalChecks = Object.values(checks).reduce((sum, check) => sum + check.total, 0);
    const readinessScore = Math.round((totalPassed / totalChecks) * 100);

    console.log(`\n📊 Overall Readiness Score: ${readinessScore}%`);
    
    if (readinessScore >= 90) {
      console.log('✅ Repository is ready for development!');
      return true;
    } else if (readinessScore >= 70) {
      console.log('⚠️  Repository is mostly ready, but some improvements recommended.');
      return true;
    } else {
      console.log('❌ Repository needs significant setup before development can begin.');
      return false;
    }
  }

  async checkEnvironment(check) {
    const requiredVersions = {
      node: '18.0.0',
      npm: '8.0.0'
    };

    // Check Node.js version
    check.total++;
    try {
      const nodeVersion = process.version.slice(1);
      if (this.compareVersions(nodeVersion, requiredVersions.node) >= 0) {
        check.passed++;
      } else {
        check.issues.push(`Node.js ${requiredVersions.node}+ required (current: ${nodeVersion})`);
      }
    } catch (error) {
      check.issues.push('Node.js version check failed');
    }

    // Check npm version
    check.total++;
    try {
      const { execSync } = require('child_process');
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      if (this.compareVersions(npmVersion, requiredVersions.npm) >= 0) {
        check.passed++;
      } else {
        check.issues.push(`npm ${requiredVersions.npm}+ required (current: ${npmVersion})`);
      }
    } catch (error) {
      check.issues.push('npm not found or version check failed');
    }

    // Check Git
    check.total++;
    try {
      const { execSync } = require('child_process');
      execSync('git --version', { stdio: 'ignore' });
      check.passed++;
    } catch (error) {
      check.issues.push('Git not installed or not in PATH');
    }
  }

  async checkProjectStructure(check) {
    const requiredDirs = [
      'src',
      'src/services',
      'src/utils',
      'src/types',
      'tests',
      'docs',
      'scripts'
    ];

    const requiredFiles = [
      'package.json',
      'README.md',
      'milestone-tracker.json',
      '.gitignore'
    ];

    // Check directories
    for (const dir of requiredDirs) {
      check.total++;
      try {
        const dirPath = path.join(process.cwd(), dir);
        await fs.access(dirPath);
        check.passed++;
      } catch (error) {
        check.issues.push(`Missing directory: ${dir}`);
      }
    }

    // Check files
    for (const file of requiredFiles) {
      check.total++;
      try {
        const filePath = path.join(process.cwd(), file);
        await fs.access(filePath);
        check.passed++;
      } catch (error) {
        check.issues.push(`Missing file: ${file}`);
      }
    }
  }

  async checkDependencies(check) {
    check.total++;
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const requiredDeps = [
        'moleculer',
        'mongodb',
        '@qdrant/js-client-rest',
        'redis',
        'nats',
        'joi',
        'winston'
      ];

      const devDeps = [
        'jest',
        'nodemon',
        'eslint'
      ];

      let missingDeps = [];
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      for (const dep of requiredDeps) {
        if (!allDeps[dep]) {
          missingDeps.push(dep);
        }
      }

      for (const dep of devDeps) {
        if (!allDeps[dep]) {
          missingDeps.push(`${dep} (dev)`);
        }
      }

      if (missingDeps.length === 0) {
        check.passed++;
      } else {
        check.issues.push(`Missing dependencies: ${missingDeps.join(', ')}`);
      }
    } catch (error) {
      check.issues.push('Cannot read package.json or parse dependencies');
    }

    // Check if node_modules exists
    check.total++;
    try {
      await fs.access(path.join(process.cwd(), 'node_modules'));
      check.passed++;
    } catch (error) {
      check.issues.push('Dependencies not installed (run npm install)');
    }
  }

  async checkConfiguration(check) {
    const configFiles = [
      '.env.example',
      'moleculer.config.js',
      'jest.config.js',
      '.eslintrc.js'
    ];

    for (const file of configFiles) {
      check.total++;
      try {
        await fs.access(path.join(process.cwd(), file));
        check.passed++;
      } catch (error) {
        check.issues.push(`Missing configuration: ${file}`);
      }
    }

    // Check milestone tracker configuration
    check.total++;
    try {
      const tracker = await this.loadTracker();
      if (tracker.phases && Object.keys(tracker.phases).length > 0) {
        check.passed++;
      } else {
        check.issues.push('Milestone tracker has no phases configured');
      }
    } catch (error) {
      check.issues.push('Milestone tracker configuration invalid');
    }
  }

  async checkDocumentation(check) {
    const docFiles = [
      'README.md',
      'docs/API.md',
      'docs/ARCHITECTURE.md',
      'docs/SETUP.md'
    ];

    for (const file of docFiles) {
      check.total++;
      try {
        const filePath = path.join(process.cwd(), file);
        const content = await fs.readFile(filePath, 'utf8');
        if (content.length > 100) { // Basic content check
          check.passed++;
        } else {
          check.issues.push(`${file} exists but appears incomplete`);
        }
      } catch (error) {
        check.issues.push(`Missing documentation: ${file}`);
      }
    }
  }

  displayCheckResults(checks) {
    const categories = {
      environment: '🌍 Development Environment',
      structure: '📁 Project Structure',
      dependencies: '📦 Dependencies',
      configuration: '⚙️  Configuration',
      documentation: '📚 Documentation'
    };

    for (const [key, category] of Object.entries(categories)) {
      const check = checks[key];
      const percentage = check.total > 0 ? Math.round((check.passed / check.total) * 100) : 0;
      const statusIcon = percentage === 100 ? '✅' : percentage >= 70 ? '⚠️' : '❌';
      
      console.log(`${statusIcon} ${category}: ${check.passed}/${check.total} (${percentage}%)`);
      
      if (check.issues.length > 0) {
        check.issues.forEach(issue => console.log(`   • ${issue}`));
      }
      console.log('');
    }
  }

  compareVersions(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part > v2part) return 1;
      if (v1part < v2part) return -1;
    }
    return 0;
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
    case 'check':
      const isReady = await tracker.checkRepositoryReadiness();
      process.exit(isReady ? 0 : 1);
      break;
    default:
      console.log('📋 Milestone Tracker Commands:');
      console.log('  npm run milestone:status           - Show current progress');
      console.log('  npm run milestone:start <id>       - Start a milestone');
      console.log('  npm run milestone:complete <id> <hours> - Complete a milestone');
      console.log('  npm run milestone:check            - Check repository readiness');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = MilestoneTracker;