const mongoose = require('mongoose');
const env = require('./env');

async function connectDb() {
  if (!env.mongoUri) {
    console.log('MongoDB disabled: MONGO_URI not set. Using JSON + in-memory session fallback.');
    return null;
  }

  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log('MongoDB connected');
    return mongoose.connection;
  } catch (error) {
    console.warn(`MongoDB unavailable: ${error.message}`);
    console.warn('Continuing with JSON data + in-memory session fallback.');
    return null;
  }
}

module.exports = { connectDb };
