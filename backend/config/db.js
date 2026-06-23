const mongoose = require('mongoose');
const env = require('./env');

async function connectDb() {
  if (!env.mongoUri) {
    console.log('MongoDB disabled: MONGO_URI not set. Using JSON + in-memory session fallback.');
    return null;
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  console.log('MongoDB connected');
  return mongoose.connection;
}

module.exports = { connectDb };
