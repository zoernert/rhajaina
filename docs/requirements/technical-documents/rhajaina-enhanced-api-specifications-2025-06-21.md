<!-- filepath: outputs/technical-documents/rhajaina-enhanced-api-specifications-2025-06-21.md -->
# Rhajaina Enhanced API Specifications

**Document Type:** Technical  
**Generated:** 2025-06-21T19:26:54.597Z  
**Project:** Rhajaina AI Chat Application

---

# Rhajaina Enhanced API Specifications

## 1. AI Model Management APIs

### Model Selection and Switching

**Description:** Retrieves a list of available AI models and allows switching between them.

**Endpoint:** `/models`

**Method:** `GET`

**Request:**

```
{}
```

**Response:**

```json
{
  "models": [
    {
      "id": "model1",
      "name": "GPT-3.5",
      "description": "OpenAI GPT-3.5 Turbo",
      "status": "available"
    },
    {
      "id": "model2",
      "name": "LLama-2-70B",
      "description": "Meta LLama 2 70B",
      "status": "available"
    }
  ]
}
```

**Error Codes:**

*   `404`: Models not found.
*   `500`: Internal server error.

**Endpoint:** `/models/{model_id}/switch`

**Method:** `POST`

**Request:**

```json
{}
```

**Response:**

```json
{
  "message": "Model switched successfully to {model_id}"
}
```

**Error Codes:**

*   `400`: Invalid model ID.
*   `404`: Model not found.
*   `500`: Internal server error.

### Context Management APIs

**Description:** Manages the context (history) of the conversation with the AI model.

**Endpoint:** `/context`

**Method:** `GET`

**Request:**

```json
{}
```

**Response:**

```json
{
  "context": [
    {
      "user": "Hello",
      "ai": "Hi there!"
    },
    {
      "user": "How are you?",
      "ai": "I am doing well, thank you!"
    }
  ]
}
```

**Error Codes:**

* `500`: Internal server error.

**Endpoint:** `/context/clear`

**Method:** `POST`

**Request:**

```json
{}
```

**Response:**

```json
{
  "message": "Context cleared successfully"
}
```

**Error Codes:**

* `500`: Internal server error.

### Token Usage Tracking Endpoints

**Description:** Tracks the token usage for each model.

**Endpoint:** `/token_usage`

**Method:** `GET`

**Request:**

```json
{}
```

**Response:**

```json
{
  "model1": {
    "input_tokens": 1000,
    "output_tokens": 500
  },
  "model2": {
    "input_tokens": 2000,
    "output_tokens": 1000
  }
}
```

**Error Codes:**

* `500`: Internal server error.

### Model Health Monitoring APIs

**Description:** Monitors the health of the AI models.

**Endpoint:** `/model_health`

**Method:** `GET`

**Request:**

```json
{}
```

**Response:**

```json
{
  "model1": {
    "status": "healthy",
    "uptime": "99.9%"
  },
  "model2": {
    "status": "degraded",
    "uptime": "95%"
  }
}
```

**Error Codes:**

* `500`: Internal server error.

### Fallback Chain Configuration

**Description:** Configures the fallback chain for the AI models.

**Endpoint:** `/fallback_chain`

**Method:** `GET`

**Request:**

```json
{}
```

**Response:**

```json
{
  "chain": [
    "model1",
    "model2"
  ]
}
```

**Error Codes:**

* `500`: Internal server error.

**Endpoint:** `/fallback_chain`

**Method:** `POST`

**Request:**

```json
{
  "chain": [
    "model2",
    "model1"
  ]
}
```

**Response:**

```json
{
  "message": "Fallback chain updated successfully"
}
```

**Error Codes:**

* `400`: Invalid model ID in chain.
* `500`: Internal server error.

## 2. Vector Search APIs

### Embedding Generation Endpoints

**Description:** Generates embeddings for text.

**Endpoint:** `/embeddings`

**Method:** `POST`

**Request:**

```json
{
  "text": "This is a sample text."
}
```

**Response:**

```json
{
  "embedding": [0.1, 0.2, 0.3, ...]
}
```

**Error Codes:**

*   `400`: Invalid text.
*   `500`: Internal server error.

### Similarity Search APIs

**Description:** Searches for similar vectors.

**Endpoint:** `/similarity_search`

**Method:** `POST`

**Request:**

```json
{
  "embedding": [0.1, 0.2, 0.3, ...],
  "top_k": 10
}
```

**Response:**

```json
{
  "results": [
    {
      "id": "doc1",
      "score": 0.9
    },
    {
      "id": "doc2",
      "score": 0.8
    }
  ]
}
```

**Error Codes:**

*   `400`: Invalid embedding.
*   `500`: Internal server error.

### Collection Management Endpoints

**Description:** Manages vector collections.

**Endpoint:** `/collections`

**Method:** `POST`

**Request:**

```json
{
  "name": "my_collection"
}
```

**Response:**

```json
{
  "message": "Collection created successfully"
}
```

**Error Codes:**

*   `400`: Invalid collection name.
*   `500`: Internal server error.

### Metadata Filtering APIs

**Description:** Filters vectors based on metadata.

**Endpoint:** `/metadata_filter`

**Method:** `POST`

**Request:**

```json
{
  "metadata": {
    "author": "John Doe"
  }
}
```

**Response:**

```json
{
  "results": [
    {
      "id": "doc1",
      "score": 0.9
    },
    {
      "id": "doc2",
      "score": 0.8
    }
  ]
}
```

**Error Codes:**

*   `400`: Invalid metadata.
*   `500`: Internal server error.

### Performance Optimization Settings

**Description:** Settings to optimize the performance of vector search.

**Endpoint:** `/performance_settings`

**Method:** `GET`

**Request:**

```json
{}
```

**Response:**

```json
{
  "index_type": "HNSW",
  "n_clusters": 16
}
```

**Error Codes:**

* `500`: Internal server error.

## 3. File Management APIs

### File Upload and Processing Endpoints

**Description:** Uploads and processes files.

**Endpoint:** `/files/upload`

**Method:** `POST`

**Request:**

```
Multipart/form-data
```

**Response:**

```json
{
  "file_id": "file123"
}
```

**Error Codes:**

*   `400`: Invalid file format.
*   `500`: Internal server error.

### OCR and Content Extraction APIs

**Description:** Extracts content from files using OCR.

**Endpoint:** `/files/{file_id}/ocr`

**Method:** `POST`

**Request:**

```json
{}
```

**Response:**

```json
{
  "text": "Extracted text from the file."
}
```

**Error Codes:**

*   `404`: File not found.
*   `500`: Internal server error.

### Vectorization Pipeline APIs

**Description:** Vectorizes the content of a file.

**Endpoint:** `/files/{file_id}/vectorize`

**Method:** `POST`

**Request:**

```json
{}
```

**Response:**

```json
{
  "message": "File vectorized successfully"
}
```

**Error Codes:**

*   `404`: File not found.
*   `500`: Internal server error.

### File Metadata Management

**Description:** Manages file metadata.

**Endpoint:** `/files/{file_id}/metadata`

**Method:** `GET`

**Request:**

```json
{}
```

**Response:**

```json
{
  "name": "document.pdf",
  "size": 1024
}
```

**Error Codes:**

*   `404`: File not found.
*   `500`: Internal server error.

### Content Search and Retrieval

**Description:** Searches and retrieves content from files.

**Endpoint:** `/files/search`

**Method:** `POST`

**Request:**

```json
{
  "query": "keyword"
}
```

**Response:**

```json
{
  "results": [
    {
      "file_id": "file123",
      "score": 0.9
    }
  ]
}
```

**Error Codes:**

*   `500`: Internal server error.

## 4. Collaboration APIs

### Workspace Management Endpoints

**Description:** Manages workspaces.

**Endpoint:** `/workspaces`

**Method:** `POST`

**Request:**

```json
{
  "name": "my_workspace"
}
```

**Response:**

```json
{
  "workspace_id": "workspace123"
}
```

**Error Codes:**

*   `400`: Invalid workspace name.
*   `500`: Internal server error.

### User and Team Management APIs

**Description:** Manages users and teams.

**Endpoint:** `/users`

**Method:** `POST`

**Request:**

```json
{
  "username": "john.doe",
  "password": "password"
}
```

**Response:**

```json
{
  "user_id": "user123"
}
```

**Error Codes:**

*   `400`: Invalid username or password.
*   `500`: Internal server error.

### Sharing and Permissions APIs

**Description:** Manages sharing and permissions.

**Endpoint:** `/workspaces/{workspace_id}/share`

**Method:** `POST`

**Request:**

```json
{
  "user_id": "user123",
  "permission": "read"
}
```

**Response:**

```json
{
  "message": "Workspace shared successfully"
}
```

**Error Codes:**

*   `400`: Invalid user ID or permission.
*   `404`: Workspace not found.
*   `500`: Internal server error.

### Real-time Collaboration Endpoints

**Description:** Enables real-time collaboration.

**Endpoint:** `/collaboration/start`

**Method:** `POST`

**Request:**

```json
{
  "document_id": "doc123"
}
```

**Response:**

```json
{
  "session_id": "session123"
}
```

**Error Codes:**

*   `404`: Document not found.
*   `500`: Internal server error.

### Analytics and Reporting APIs

**Description:** Provides analytics and reporting.

**Endpoint:** `/analytics/usage`

**Method:** `GET`

**Request:**

```json
{}
```

**Response:**

```json
{
  "total_users": 100,
  "active_users": 50
}
```

**Error Codes:**

*   `500`: Internal server error.

---

*Generated by Rhajaina Requirements Management System*