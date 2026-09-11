import mongoose from 'mongoose';

let mongoMemoryServer = null;

export async function connectDB(uri) {
  const mongoUri = uri || process.env.MONGODB_URI;

  if (mongoUri) {
    try {
      const conn = await mongoose.connect(mongoUri);
      console.log(`[Database] MongoDB connected to ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
      return conn;
    } catch (err) {
      console.error('[Database] Failed to connect to configured MongoDB URI:', err.message);
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
      console.log('[Database] Falling back to in-memory MongoDB for local development/testing...');
    }
  }

  // Fallback to in-memory MongoDB when no URI is provided or connection fails in dev
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServer.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log('[Database] Connected to in-memory MongoDB instance:', memoryUri);
    return conn;
  } catch (err) {
    console.error('[Database] In-memory MongoDB initialization failed:', err.message);
    throw err;
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      mongoMemoryServer = null;
    }
    console.log('[Database] MongoDB disconnected cleanly');
  } catch (err) {
    console.error('[Database] Error during disconnect:', err.message);
  }
}
