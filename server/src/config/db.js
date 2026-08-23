const mongoose = require('mongoose');
const env = require('./env');

let memoryServer = null;

const connectDB = async () => {
  try {
    // Attempt standard connection with 3-second timeout
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] MongoDB Connected successfully to ${env.mongoUri}`);
  } catch (error) {
    console.warn(`[Database] Could not connect to MongoDB at ${env.mongoUri}: ${error.message}`);
    console.log('[Database] Starting in-memory MongoDB fallback (mongodb-memory-server)...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const inMemoryUri = memoryServer.getUri();
      await mongoose.connect(inMemoryUri);
      console.log(`[Database] Connected to In-Memory MongoDB at ${inMemoryUri}`);
    } catch (memError) {
      console.error('[Database] In-memory MongoDB failed to start:', memError.message);
      throw memError;
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log('[Database] MongoDB connection closed');
  } catch (err) {
    console.error('[Database] Error closing DB connection:', err);
  }
};

module.exports = { connectDB, disconnectDB };
