const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const MentorMemory = require('../models/mentorMemory.model');
const { extractEducation } = require('../utils/promptBuilder');
const { normalizeEmotionText } = require('./emotion.service');

const MEMORY_PATH = path.join(__dirname, '../data/mentorLearning.json');
const memoryFallback = new Map();

function emptyFileMemory() {
  return {
    version: 2,
    updatedAt: new Date().toISOString(),
    users: {},
    globalPatterns: {
      emotionPhrases: {},
      careerTerms: {},
      commonQuestions: {},
    },
  };
}

function readMemoryFile() {
  try {
    if (!fs.existsSync(MEMORY_PATH)) return emptyFileMemory();
    return { ...emptyFileMemory(), ...JSON.parse(fs.readFileSync(MEMORY_PATH, 'utf8')) };
  } catch (error) {
    console.warn(`Mentor memory read failed: ${error.message}`);
    return emptyFileMemory();
  }
}

function writeMemoryFile(memory) {
  try {
    fs.writeFileSync(MEMORY_PATH, JSON.stringify({ ...memory, updatedAt: new Date().toISOString() }, null, 2));
  } catch (error) {
    console.warn(`Mentor memory write failed: ${error.message}`);
  }
}

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

function toPlainSignals(signals = {}) {
  if (signals instanceof Map) return Object.fromEntries(signals.entries());
  return signals || {};
}

function serializeMemory(memory = {}) {
  return {
    userId: memory.userId,
    version: memory.version || 2,
    promptCount: memory.promptCount || 0,
    education: memory.education || '',
    preferredBranch: memory.preferredBranch || '',
    preferences: memory.preferences || {},
    interests: toPlainSignals(memory.interests),
    branches: toPlainSignals(memory.branches),
    emotions: toPlainSignals(memory.emotions),
    intents: toPlainSignals(memory.intents),
    languages: toPlainSignals(memory.languages),
    recentNeeds: memory.recentNeeds || [],
    meta: memory.meta || {},
    updatedAt: memory.updatedAt || new Date().toISOString(),
  };
}

function createEmptyUser(userId) {
  return {
    userId,
    version: 2,
    promptCount: 0,
    interests: {},
    branches: {},
    emotions: {},
    intents: {},
    languages: {},
    recentNeeds: [],
    preferences: {},
    meta: {},
    updatedAt: new Date().toISOString(),
  };
}

function topKeys(bucket = {}, limit = 5) {
  return Object.entries(bucket)
    .sort((a, b) => (b[1]?.weight || 0) - (a[1]?.weight || 0) || (b[1]?.count || 0) - (a[1]?.count || 0))
    .slice(0, limit)
    .map(([key]) => key);
}

function calculateWeight(oldWeight = 0, signalStrength = 0.4, isRecent = true) {
  const recencyBoost = isRecent ? 0.2 : 0;
  return Number(Math.min(1, oldWeight * 0.8 + signalStrength * 0.6 + recencyBoost).toFixed(2));
}

function addSignal(memory, bucketName, key, { strength = 0.4, source = 'inferred' } = {}) {
  if (!key) return;
  const bucket = memory[bucketName] || {};
  const previous = bucket[key] || { count: 0, weight: 0, source };
  const next = {
    count: (previous.count || 0) + 1,
    weight: calculateWeight(previous.weight || 0, strength, true),
    lastUsed: new Date().toISOString(),
    source: previous.source === 'explicit' ? previous.source : source,
  };

  const isImportant = next.count >= 2 || strength >= 0.7 || source === 'explicit' || source === 'behavioral';
  if (isImportant) bucket[key] = next;
  memory[bucketName] = bucket;
}

function extractInterests(text) {
  const interests = [];
  const checks = [
    ['coding', /coding|programming|developer|software|web|app/],
    ['ai', /\bai\b|machine learning|ml|data science|artificial intelligence/],
    ['cybersecurity', /cyber|security|hacking/],
    ['cloud', /cloud|aws|devops/],
    ['government', /sarkari|government|govt|upsc|ssc|bank|railway/],
    ['medical', /doctor|medical|neet|nursing|pharmacy/],
    ['commerce', /commerce|accounts|finance|ca\b|business/],
    ['design', /design|ui|ux|figma|graphic/],
  ];

  checks.forEach(([label, regex]) => {
    if (regex.test(text)) interests.push(label);
  });

  return interests;
}

function extractBranch(text) {
  if (/cse|computer science/.test(text)) return 'B.Tech CSE';
  if (/ai\s?ds|data science branch|artificial intelligence/.test(text)) return 'B.Tech AI/Data Science';
  if (/\bit\b|information technology/.test(text)) return 'B.Tech IT';
  if (/ece|electronics/.test(text)) return 'B.Tech ECE';
  if (/mechanical/.test(text)) return 'B.Tech Mechanical';
  if (/civil/.test(text)) return 'B.Tech Civil';
  if (/bca/.test(text)) return 'BCA';
  if (/bcom|b\.com/.test(text)) return 'B.Com';
  if (/diploma|polytechnic/.test(text)) return 'Diploma';
  return '';
}

function extractSignals({ message = '', analysis = {}, intent = '', language = '' }) {
  const text = normalizeEmotionText(message);
  const signals = [];
  const education = extractEducation(message);
  const branch = extractBranch(text);

  if (education && education !== 'unknown') {
    signals.push({ type: 'explicit', bucket: 'preferences', key: 'education', value: education, strength: 0.9 });
  }
  if (branch) {
    signals.push({ type: 'explicit', bucket: 'branches', key: branch, value: branch, strength: 0.95 });
  }

  extractInterests(text).forEach((interest) => {
    signals.push({ type: 'inferred', bucket: 'interests', key: interest, value: interest, strength: 0.55 });
  });

  if (analysis?.emotion?.mood && analysis.emotion.mood !== 'neutral') {
    signals.push({
      type: 'emotional',
      bucket: 'emotions',
      key: analysis.emotion.mood,
      value: analysis.emotion.mood,
      strength: analysis.emotion.needsImmediateSafety ? 0.9 : 0.75,
    });
  }
  if (intent) signals.push({ type: 'behavioral', bucket: 'intents', key: intent, value: intent, strength: 0.65 });
  if (language) signals.push({ type: 'behavioral', bucket: 'languages', key: language, value: language, strength: 0.55 });

  return { text, education, branch, signals };
}

function mergeMemory(memory, { message = '', analysis = {}, intent = '', language = '' }) {
  const next = { ...createEmptyUser(memory.userId), ...serializeMemory(memory) };
  const { text, education, branch, signals } = extractSignals({ message, analysis, intent, language });

  next.promptCount += 1;
  next.updatedAt = new Date().toISOString();
  next.meta = {
    ...(next.meta || {}),
    lastIntent: intent || next.meta?.lastIntent,
    lastEmotion: analysis?.emotion?.mood || next.meta?.lastEmotion,
  };

  if (education && education !== 'unknown') next.education = education;
  if (branch) next.preferredBranch = branch;

  signals.forEach((signal) => {
    if (signal.bucket === 'preferences') {
      next.preferences = { ...(next.preferences || {}), [signal.key]: signal.value };
      return;
    }
    addSignal(next, signal.bucket, signal.key, {
      strength: signal.strength,
      source: signal.type,
    });
  });

  if (analysis?.emotion?.needsSupport && !analysis?.emotion?.needsImmediateSafety) {
    const safeNeed = text.slice(0, 80);
    if (safeNeed && (analysis.emotion.confidence || 0) >= 0.55) {
      next.recentNeeds = [safeNeed, ...(next.recentNeeds || []).filter((item) => item !== safeNeed)].slice(0, 5);
    }
  }

  return next;
}

async function getMemory(userId = 'guest') {
  if (!userId || userId === 'guest') return {};

  if (isMongoReady()) {
    try {
      const memory = await MentorMemory.findOne({ userId }).lean();
      if (memory) return serializeMemory(memory);
    } catch (error) {
      console.warn(`Mentor memory Mongo read failed: ${error.message}`);
    }
  }

  const fileMemory = readMemoryFile();
  return fileMemory.users?.[userId] || memoryFallback.get(userId) || {};
}

function getMemorySync(userId = 'guest') {
  if (!userId || userId === 'guest') return {};
  const fileMemory = readMemoryFile();
  return fileMemory.users?.[userId] || memoryFallback.get(userId) || {};
}

async function updateMemory(userId = 'guest', signals = {}) {
  if (!userId || userId === 'guest') return {};

  const existing = await getMemory(userId);
  const merged = mergeMemory({ ...createEmptyUser(userId), ...existing, userId }, signals);

  if (isMongoReady()) {
    try {
      await MentorMemory.findOneAndUpdate(
        { userId },
        {
          $set: {
            version: merged.version,
            promptCount: merged.promptCount,
            education: merged.education,
            preferredBranch: merged.preferredBranch,
            preferences: merged.preferences,
            interests: merged.interests,
            branches: merged.branches,
            emotions: merged.emotions,
            intents: merged.intents,
            languages: merged.languages,
            recentNeeds: merged.recentNeeds,
            meta: merged.meta,
          },
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.warn(`Mentor memory Mongo write failed: ${error.message}`);
    }
  }

  const fileMemory = readMemoryFile();
  fileMemory.users[userId] = merged;
  memoryFallback.set(userId, merged);
  writeMemoryFile(fileMemory);

  return merged;
}

function buildSummaryFromMemory(memory = {}) {
  if (!memory.promptCount) return '';

  const parts = [];
  if (memory.education) parts.push(`Learned education: ${memory.education}`);
  if (memory.preferredBranch) parts.push(`Preferred branch/course: ${memory.preferredBranch}`);

  const interests = topKeys(memory.interests);
  if (interests.length) parts.push(`Repeated interests: ${interests.join(', ')}`);

  const emotions = topKeys(memory.emotions, 3);
  if (emotions.length) parts.push(`Emotional pattern: ${emotions.join(', ')}`);

  if (memory.recentNeeds?.length) {
    parts.push(`Recent support context: ${memory.recentNeeds.slice(0, 2).join(' | ')}`);
  }

  return parts.join('. ').slice(0, 500);
}

async function buildLearningSummaryAsync(userId = 'guest') {
  return buildSummaryFromMemory(await getMemory(userId));
}

function buildLearningSummary(userId = 'guest') {
  return buildSummaryFromMemory(getMemorySync(userId));
}

function getUserLearning(userId = 'guest') {
  return getMemorySync(userId);
}

async function learnFromPrompt(input = {}) {
  return updateMemory(input.userId, input);
}

module.exports = {
  buildLearningSummary,
  buildLearningSummaryAsync,
  calculateWeight,
  extractSignals,
  getMemory,
  getUserLearning,
  learnFromPrompt,
  mergeMemory,
  updateMemory,
};
