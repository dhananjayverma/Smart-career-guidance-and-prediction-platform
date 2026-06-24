const mongoose = require('mongoose');

const signalSchema = new mongoose.Schema(
  {
    count: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    lastUsed: Date,
    source: { type: String, default: 'inferred' },
  },
  { _id: false }
);

const mentorMemorySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    version: { type: Number, default: 1 },
    promptCount: { type: Number, default: 0 },
    education: String,
    preferredBranch: String,
    preferences: mongoose.Schema.Types.Mixed,
    interests: { type: Map, of: signalSchema, default: {} },
    branches: { type: Map, of: signalSchema, default: {} },
    emotions: { type: Map, of: signalSchema, default: {} },
    intents: { type: Map, of: signalSchema, default: {} },
    languages: { type: Map, of: signalSchema, default: {} },
    recentNeeds: { type: [String], default: [] },
    meta: {
      lastIntent: String,
      lastEmotion: String,
      source: { type: String, default: 'mentor-memory-service' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.MentorMemory || mongoose.model('MentorMemory', mentorMemorySchema);
