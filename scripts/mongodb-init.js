// scripts/mongodb-init.js
// MongoDB initialization script for Docker container

// Create the rhajaina database
db = db.getSiblingDB('rhajaina');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "username"],
      properties: {
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
        },
        username: {
          bsonType: "string",
          minLength: 3,
          maxLength: 30
        },
        passwordHash: {
          bsonType: "string"
        },
        firstName: {
          bsonType: "string"
        },
        lastName: {
          bsonType: "string"
        },
        createdAt: {
          bsonType: "date"
        },
        updatedAt: {
          bsonType: "date"
        }
      }
    }
  }
});

db.createCollection('chats', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "title"],
      properties: {
        userId: {
          bsonType: "string"
        },
        title: {
          bsonType: "string",
          maxLength: 200
        },
        createdAt: {
          bsonType: "date"
        },
        updatedAt: {
          bsonType: "date"
        }
      }
    }
  }
});

db.createCollection('messages', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["chatId", "content", "role"],
      properties: {
        chatId: {
          bsonType: "objectId"
        },
        content: {
          bsonType: "string",
          maxLength: 10000
        },
        role: {
          bsonType: "string",
          enum: ["user", "assistant", "system"]
        },
        model: {
          bsonType: "string"
        },
        createdAt: {
          bsonType: "date"
        }
      }
    }
  }
});

// Create indexes for optimal performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });

db.chats.createIndex({ "userId": 1 });
db.chats.createIndex({ "updatedAt": -1 });

db.messages.createIndex({ "chatId": 1, "createdAt": 1 });
db.messages.createIndex({ "chatId": 1, "createdAt": -1 });

print('MongoDB initialization completed successfully!');

