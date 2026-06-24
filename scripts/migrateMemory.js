const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { connectDb } = require('../backend/config/db');
const MentorMemory = require('../backend/models/mentorMemory.model');

const MEMORY_PATH = path.join(__dirname, '../backend/data/mentorLearning.json');

function normalizeSignals(signals = {}) {
  return Object.fromEntries(
    Object.entries(signals).map(([key, value]) => [
      key,
      typeof value === 'number'
        ? { count: value, weight: Math.min(1, value / 3), lastUsed: new Date(), source: 'legacy' }
        : value,
    ])
  );
}

async function main() {
  if (!fs.existsSync(MEMORY_PATH)) {
    console.log('No mentorLearning.json found. Nothing to migrate.');
    return;
  }

  const connection = await connectDb();
  if (!connection) {
    console.log('MongoDB unavailable. Migration skipped.');
    return;
  }

  const fileMemory = JSON.parse(fs.readFileSync(MEMORY_PATH, 'utf8'));
  const users = Object.entries(fileMemory.users || {});

  for (const [userId, memory] of users) {
    await MentorMemory.findOneAndUpdate(
      { userId },
      {
        $set: {
          version: 2,
          promptCount: memory.promptCount || 0,
          education: memory.education || '',
          preferredBranch: memory.preferredBranch || '',
          preferences: memory.preferences || {},
          interests: normalizeSignals(memory.interests),
          branches: normalizeSignals(memory.branches),
          emotions: normalizeSignals(memory.emotions),
          intents: normalizeSignals(memory.intents),
          languages: normalizeSignals(memory.languages),
          recentNeeds: memory.recentNeeds || [],
          meta: {
            ...(memory.meta || {}),
            migratedFrom: 'mentorLearning.json',
            migratedAt: new Date(),
          },
        },
      },
      { upsert: true }
    );
  }

  console.log(`Migrated ${users.length} mentor memory records.`);
}

main()
  .catch((error) => {
    console.error(`Memory migration failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
