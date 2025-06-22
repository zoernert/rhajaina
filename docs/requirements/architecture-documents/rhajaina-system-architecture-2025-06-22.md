# Rhajaina System Architecture

**Document Type:** Architecture  
**Generated:** 2025-06-22  
**Project:** Rhajaina AI Chat Application

---

## Revision History
| Version | Date         | Author          | Changes                                       |
| :------ | :----------- | :-------------- | :-------------------------------------------- |
| 1.0     | 2025-06-22   | GitHub Copilot  | Initial draft with diagrams and ToC.          |

## Table of Contents
1.  [Overview](#1-overview)
2.  [Architectural Principles](#2-architectural-principles)
3.  [Core Services](#3-core-services)
4.  [Supporting Services](#4-supporting-services)
5.  [Data Flow](#5-data-flow)
6.  [Technology Stack](#6-technology-stack)

## 1. Overview

This document outlines the system architecture for the Rhajaina AI Chat Application. The architecture is designed as a scalable, resilient, and maintainable system based on a microservices pattern. It supports advanced features like multi-model AI interaction, semantic search, and collaborative workspaces.

## 2. Architectural Principles

*   **Microservices:** The system is decomposed into small, independent services that communicate over well-defined APIs. This promotes scalability, fault isolation, and independent deployment.
*   **Asynchronous Communication:** Services communicate asynchronously wherever possible to enhance resilience and responsiveness.
*   **Scalability:** Each service can be scaled independently based on its specific load, optimizing resource utilization.
*   **Stateless Services:** Core application services are designed to be stateless, simplifying scaling and load balancing. State is managed by dedicated services like `ContextManager` or persisted in databases.
*   **Security:** Security is a primary concern, with authentication, authorization, and data protection implemented at multiple layers.

```mermaid
graph TD
    subgraph "User Facing"
        Client[Client PWA]
    end

    subgraph "Core Pipeline"
        RequestProcessor --> ThinkEngine;
        ThinkEngine --> ActionEngine;
        ActionEngine --> ResponseEngine;
    end

    subgraph "Supporting Services"
        UserManager;
        ContextManager;
        UnifiedToolManager;
        VectorDBService;
        FileService;
        MetricsCollector;
        NotificationService;
    end
    
    Client --> RequestProcessor;
    RequestProcessor --> ContextManager;
    RequestProcessor --> UserManager;
    ThinkEngine --> ContextManager;
    ActionEngine --> UnifiedToolManager;
    UnifiedToolManager --> FileService;
    UnifiedToolManager --> VectorDBService;
    ResponseEngine --> NotificationService;
    ResponseEngine --> Client;

    %% Dotted lines for monitoring
    RequestProcessor -.-> MetricsCollector;
    ThinkEngine -.-> MetricsCollector;
    ActionEngine -.-> MetricsCollector;
    ResponseEngine -.-> MetricsCollector;
```

## 3. Core Services

The core of the application is the "Think → Act → Respond" pipeline, which processes user requests.

*   **RequestProcessor:** The main entry point for all user chat requests. It handles initial validation, authentication, and then orchestrates the processing pipeline by calling the `ThinkEngine`.
*   **ThinkEngine:** This service is the "brain" of the operation. It receives the user's request and context from the `RequestProcessor`. Its job is to understand the user's intent and decide on the next step, which could be a direct LLM call, a tool/action execution, or a clarifying question.
*   **ActionEngine:** Executes tools or actions as determined by the `ThinkEngine`. It interacts with the `UnifiedToolManager` to find and run the appropriate tool (e.g., semantic search, file search, external API call).
*   **ResponseEngine:** Takes the output from the `ThinkEngine` or `ActionEngine` and formats it into a user-friendly response. This may involve transforming raw tool output into natural language using an LLM.

## 4. Supporting Services

These services provide essential functionalities across the application.

*   **UserManager:** Manages user profiles, authentication, and permissions.
*   **ContextManager:** Persists and retrieves conversation history and context, providing the necessary information for context-aware conversations.
*   **UnifiedToolManager:** A registry for all available tools. It provides the `ActionEngine` with a consistent interface to discover and execute tools, whether they are internal services or external APIs.
*   **VectorDBService:** An abstraction layer over the Qdrant vector database. It handles the creation, storage, and querying of vector embeddings for chat messages and documents.
*   **FileService:** Manages file uploads, storage, metadata, and OCR processing.
*   **MetricsCollector:** Gathers performance and usage metrics from all services for monitoring and analytics.
*   **NotificationService:** Manages and sends real-time push notifications to users.

## 5. Data Flow

### Standard Chat Request Flow
1.  User sends a message via the client.
2.  The `RequestProcessor` receives the request, validates it, and retrieves context from the `ContextManager`.
3.  The `ThinkEngine` analyzes the request. For a simple query, it calls an LLM directly.
4.  The `ResponseEngine` formats the LLM's answer and sends it back to the user.

### Tool-Assisted Request Flow
1.  User sends a message that requires a tool (e.g., "Summarize my last uploaded document").
2.  `RequestProcessor` and `ContextManager` work as above.
3.  `ThinkEngine` determines that the "file summary" tool is needed and instructs the `ActionEngine`.
4.  `ActionEngine` uses the `UnifiedToolManager` to call the `FileService` to retrieve and summarize the document.
5.  The summary (tool output) is passed back to the `ThinkEngine`, which then passes it to an LLM via the `ResponseEngine` to generate a natural language response.
6.  The final response is sent to the user.

```mermaid
sequenceDiagram
    participant Client
    participant RequestProcessor
    participant ThinkEngine
    participant ActionEngine
    participant UnifiedToolManager
    participant FileService
    participant ResponseEngine

    Client->>RequestProcessor: POST /chat (message: "Summarize my doc")
    RequestProcessor->>ThinkEngine: processRequest(request)
    ThinkEngine->>ActionEngine: executeAction(action: "summarizeFile")
    ActionEngine->>UnifiedToolManager: getTool("summarizeFile")
    UnifiedToolManager->>ActionEngine: return fileSummaryTool
    ActionEngine->>FileService: summarizeLatest()
    FileService-->>ActionEngine: return summary
    ActionEngine-->>ThinkEngine: return tool_output
    ThinkEngine->>ResponseEngine: formatResponse(output)
    ResponseEngine-->>Client: return formatted_response
```

## 6. Technology Stack

*   **Backend Framework:** Node.js with Moleculer (Microservices Framework)
*   **Frontend:** Progressive Web App (PWA) using a modern JavaScript framework (e.g., React, Vue).
*   **Databases:**
    *   **Primary:** PostgreSQL (for user data, metadata, etc.)
    *   **Vector:** Qdrant (for semantic search)
    *   **Caching:** Redis (for session management and caching)
*   **Containerization & Orchestration:** Docker & Kubernetes
*   **Message Broker:** NATS or Redis Pub/Sub (for inter-service communication)

---

*Generated by Rhajaina Requirements Management System*
