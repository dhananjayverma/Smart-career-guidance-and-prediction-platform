const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    preferences: mongoose.Schema.Types.Mixed,
    savedCareers: [
      {
        id: String,
        title: String,
        source: String,
        metadata: mongoose.Schema.Types.Mixed,
        savedAt: { type: Date, default: Date.now },
      },
    ],
    messages: [messageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Session || mongoose.model('Session', sessionSchema);
