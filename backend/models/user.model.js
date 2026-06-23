const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: String,
    education: String,
    interests: [String],
    language: {
      type: String,
      enum: ['hindi', 'hinglish', 'english'],
      default: 'hinglish',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
