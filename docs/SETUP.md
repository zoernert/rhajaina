# Rhajaina AI Chat - Development Setup

## Prerequisites

- Node.js 18.0.0+
- npm 8.0.0+
- Docker & Docker Compose
- Git

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd rhajaina
   npm install
   ```

2. **Setup Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development Environment**
   ```bash
   npm run dev
   ```

## Manual Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Infrastructure Services
```bash
docker-compose -f docker-compose.dev.yml up -d mongodb redis nats qdrant
```

### 3. Initialize Databases
```bash
npm run db:setup
```

### 4. Start Services
```bash
npm run dev
```

## Verification

Run the readiness check:
```bash
npm run milestone:check
```

## Development Workflow

1. Check milestone status: `npm run milestone:status`
2. Start a milestone: `npm run milestone:start <milestone-id>`
3. Complete a milestone: `npm run milestone:complete <milestone-id> <hours>`

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Code Quality

```bash
npm run lint          # Check code quality
npm run lint:fix      # Fix issues
npm run format        # Format code
```
