const mongoose = require('mongoose');

class MongoDBConnection {
  constructor() {
    this.isConnected = false;
  }

  async connect(uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rhajaina') {
    try {
      if (this.isConnected) {
        console.log('MongoDB already connected');
        return;
      }

      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      this.isConnected = true;
      console.log('MongoDB connected successfully');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (!this.isConnected) {
        console.log('MongoDB not connected');
        return;
      }

      await mongoose.connection.close();
      this.isConnected = false;
      console.log('MongoDB disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  getConnection() {
    return mongoose.connection;
  }

  isConnectionReady() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

// Create singleton instance
const mongoConnection = new MongoDBConnection();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT. Gracefully shutting down...');
  await mongoConnection.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM. Gracefully shutting down...');
  await mongoConnection.disconnect();
  process.exit(0);
});

module.exports = mongoConnection;
