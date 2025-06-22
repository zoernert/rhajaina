# Rhajaina AI Chat - Architecture

## Overview

Rhajaina implements a **Think → Act → Respond** pipeline using Moleculer microservices architecture.

## Core Pipeline

```
Request → Think → Act → Respond → Client
```

### 1. Think Phase
- **ThinkEngine**: Analyzes user intent and context
- Determines required actions and tools
- Plans response strategy

### 2. Act Phase  
- **ActionEngine**: Executes determined actions
- **UnifiedToolManager**: Manages tool registry and execution
- Coordinates with external services

### 3. Respond Phase
- **ResponseEngine**: Generates AI-powered responses
- Formats and personalizes output
- Handles conversation flow

## Microservices

### Core Services
- **RequestProcessor**: API gateway, authentication, routing
- **ThinkEngine**: Intent analysis and decision making
- **ActionEngine**: Tool execution and coordination
- **ResponseEngine**: AI response generation
- **ContextManager**: Conversation state management
- **UnifiedToolManager**: Tool registry and execution

### Data Services
- **MongoDB**: Primary data storage
- **Qdrant**: Vector embeddings for semantic search
- **Redis**: Caching and session management
- **NATS**: Message broker for service communication

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Moleculer microservices
- **Frontend**: React + TypeScript
- **Databases**: MongoDB, Qdrant, Redis
- **Message Broker**: NATS
- **AI APIs**: OpenAI, Anthropic, Google AI, Mistral, DeepSeek

## Service Communication

Services communicate via:
- **Synchronous**: Direct Moleculer actions
- **Asynchronous**: NATS events
- **Caching**: Redis for shared state
- **Context**: MongoDB for persistence

## Scalability

- Horizontal scaling via service replication
- Load balancing with round-robin strategy
- Circuit breakers for resilience
- Rate limiting for protection
