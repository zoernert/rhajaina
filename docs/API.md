# Rhajaina AI Chat - API Documentation

## Authentication

All API endpoints require authentication via JWT tokens.

```http
Authorization: Bearer <jwt-token>
```

## Core Endpoints

### Chat API

#### Send Message
```http
POST /api/chat/message
Content-Type: application/json

{
  "message": "Hello, how can you help me?",
  "conversationId": "optional-conversation-id",
  "context": {}
}
```

#### Get Conversation History
```http
GET /api/chat/conversations/{conversationId}
```

### User Management

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error Handling

Error responses include:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Rate Limiting

- 100 requests per minute per user
- 1000 requests per hour per user
- Burst limit: 20 requests per 10 seconds
