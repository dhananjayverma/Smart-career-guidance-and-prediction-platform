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
  let plain = {};
  if (signals instanceof Map) {
    plain = Object.fromEntries(signals.entries());
  } else {
    plain = signals || {};
  }
  
  // Unescape dot placeholder keys from MongoDB
  const unescaped = {};
  for (const [key, val] of Object.entries(plain)) {
    const unescapedKey = key.replace(/__dot__/g, '.');
    unescaped[unescapedKey] = val;
  }
  return unescaped;
}

function toMongoMap(signals = {}) {
  const plain = toPlainSignals(signals);
  const escaped = {};
  for (const [key, val] of Object.entries(plain)) {
    const escapedKey = key.replace(/\./g, '__dot__');
    escaped[escapedKey] = val;
  }
  return new Map(Object.entries(escaped));
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
    professions: toPlainSignals(memory.professions),
    problems: toPlainSignals(memory.problems),
    emotions: toPlainSignals(memory.emotions),
    intents: toPlainSignals(memory.intents),
    languages: toPlainSignals(memory.languages),
    feedback: toPlainSignals(memory.feedback),
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
    professions: {},
    problems: {},
    emotions: {},
    intents: {},
    languages: {},
    feedback: {},
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

function extractExperience(message = '') {
  const text = message.toLowerCase();
  const experiencePatterns = [
    /(\d+(\.\d+)?)\s*(year|years|yr|yrs)/i,
    /(\d+(\.\d+)?)\s*(saal)/i,
    /(\d+(\.\d+)?)\s*(exp|experience)/i
  ];
  for (const pattern of experiencePatterns) {
    const match = text.match(pattern);
    if (match) {
      const val = parseFloat(match[1]);
      if (!isNaN(val)) return val;
    }
  }
  return 0;
}

function extractCurrentRole(message = '') {
  const text = message.toLowerCase();
  const roles = [
    'software engineer',
    'software developer',
    'devops engineer',
    'backend developer',
    'frontend developer',
    'full stack developer',
    'sde',
    'qa engineer',
    'data scientist',
    'data analyst'
  ];
  for (const role of roles) {
    if (text.includes(role)) {
      return role.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }
  return '';
}

function extractProfession(text) {
  const directMatch = text.match(/\b(?:main|mai|me|i am|i'm)\s+(?:ek\s+|a\s+|an\s+)?([a-z0-9 .+#-]{2,40}?\s+(?:dev|developer|engineer|designer|analyst|student|professional))\b/);
  if (/\bmern\b|full stack|fullstack/.test(text)) return 'MERN/full-stack developer';
  if (/frontend|react developer|ui developer/.test(text)) return 'frontend developer';
  if (/backend|node developer|api developer/.test(text)) return 'backend developer';
  if (/software engineer|software developer/.test(text)) return 'software developer';
  if (/data analyst|data scientist|machine learning engineer|ml engineer/.test(text)) return 'data/AI professional';
  if (/student|college|btech|bca|12th|10th/.test(text)) return 'student';
  if (directMatch) return directMatch[1].trim();
  return '';
}

function extractProblemSignal({ text = '', understanding = {}, conversationState = {} }) {
  if (understanding.problem) return understanding.problem;
  if (conversationState.currentProblem) return conversationState.currentProblem;
  if (/salary|ctc|package|underpaid|increment|hike/.test(text) && /low|kam|nahi|stuck|problem|frustrat/.test(text)) {
    return 'low_salary';
  }
  if (/job nahi|resume reject|interview nahi|apply/.test(text)) return 'job_search';
  if (/stress|pressure|tension|pareshan|frustrat/.test(text)) return 'stress_support';
  return '';
}

function extractSignals({
  message = '',
  analysis = {},
  intent = '',
  language = '',
  understanding = {},
  conversationState = {},
}) {
  const text = normalizeEmotionText(message);
  const signals = [];
  const education = extractEducation(message);
  const branch = extractBranch(text);
  const profession = extractProfession(text);
  const problem = extractProblemSignal({
    text,
    understanding,
    conversationState,
  });

  if (education && education !== 'unknown') {
    signals.push({ type: 'explicit', bucket: 'preferences', key: 'education', value: education, strength: 0.9 });
  }
  if (branch) {
    signals.push({ type: 'explicit', bucket: 'branches', key: branch, value: branch, strength: 0.95 });
  }
  if (profession) {
    signals.push({ type: 'explicit', bucket: 'professions', key: profession, value: profession, strength: 0.9 });
  }
  if (problem) {
    signals.push({ type: 'problem', bucket: 'problems', key: problem, value: problem, strength: 0.82 });
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

function mergeMemory(memory, { message = '', analysis = {}, intent = '', language = '', understanding = {}, conversationState = {}, mentorState = {} }) {
  const next = { ...createEmptyUser(memory.userId), ...serializeMemory(memory) };
  const { text, education, branch, signals } = extractSignals({
    message,
    analysis,
    intent,
    language,
    understanding,
    conversationState,
  });

  next.promptCount += 1;
  next.updatedAt = new Date().toISOString();
  next.meta = {
    ...(next.meta || {}),
    lastIntent: intent || next.meta?.lastIntent,
    lastEmotion: analysis?.emotion?.mood || next.meta?.lastEmotion,
  };

  if (education && education !== 'unknown') next.education = education;
  if (branch) next.preferredBranch = branch;

  const expYears = extractExperience(message);
  const role = extractCurrentRole(message);

  if (!next.preferences) next.preferences = {};
  
  // Merge askedQuestions
  if (Array.isArray(mentorState?.askedQuestions)) {
    const asked = new Set(next.preferences.askedQuestions || []);
    mentorState.askedQuestions.forEach((q) => asked.add(q));
    next.preferences.askedQuestions = Array.from(asked);
  }

  if (expYears > 0) {
    next.preferences.experienceYears = expYears;
  }
  if (role) {
    next.preferences.currentRole = role;
  }

  // Career stage detection
  if (next.preferences.experienceYears >= 2) {
    next.preferences.careerStage = 'experienced';
  } else if (next.education && next.education !== 'unknown') {
    next.preferences.careerStage = 'student';
  } else if (next.preferences.experienceYears > 0) {
    next.preferences.careerStage = 'beginner';
  }

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
            interests: toMongoMap(merged.interests),
            branches: toMongoMap(merged.branches),
            professions: merged.professions,
            problems: merged.problems,
            emotions: toMongoMap(merged.emotions),
            intents: toMongoMap(merged.intents),
            languages: toMongoMap(merged.languages),
            feedback: merged.feedback,
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

  const professions = topKeys(memory.professions, 2);
  if (professions.length) parts.push(`Profession/profile: ${professions.join(', ')}`);

  const problems = topKeys(memory.problems, 3);
  if (problems.length) parts.push(`Repeated problems: ${problems.join(', ')}`);

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

async function learnFromFeedback(userId = 'guest', feedback = {}) {
  if (!userId || userId === 'guest') return {};

  const existing = await getMemory(userId);
  const next = { ...createEmptyUser(userId), ...existing, userId };
  const rating = feedback.rating === 'down' ? 'thumbs_down' : 'thumbs_up';
  addSignal(next, 'feedback', rating, {
    strength: rating === 'thumbs_up' ? 0.75 : 0.85,
    source: 'explicit',
  });

  if (feedback.intent) {
    addSignal(next, 'intents', feedback.intent, {
      strength: rating === 'thumbs_up' ? 0.45 : 0.35,
      source: 'feedback',
    });
  }

  if (feedback.problem) {
    addSignal(next, 'problems', feedback.problem, {
      strength: rating === 'thumbs_up' ? 0.55 : 0.35,
      source: 'feedback',
    });
  }

  next.meta = {
    ...(next.meta || {}),
    lastFeedback: rating,
    lastFeedbackAt: new Date().toISOString(),
  };

  if (isMongoReady()) {
    try {
      await MentorMemory.findOneAndUpdate(
        { userId },
        {
          $set: {
            version: next.version,
            promptCount: next.promptCount,
            education: next.education,
            preferredBranch: next.preferredBranch,
            preferences: next.preferences,
            interests: next.interests,
            branches: next.branches,
            professions: next.professions,
            problems: next.problems,
            emotions: next.emotions,
            intents: next.intents,
            languages: next.languages,
            feedback: next.feedback,
            recentNeeds: next.recentNeeds,
            meta: next.meta,
          },
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.warn(`Mentor feedback Mongo write failed: ${error.message}`);
    }
  }

  const fileMemory = readMemoryFile();
  fileMemory.globalPatterns = {
    emotionPhrases: {},
    careerTerms: {},
    commonQuestions: {},
    ...(fileMemory.globalPatterns || {}),
  };
  fileMemory.users[userId] = next;
  const patternKey = feedback.pattern || feedback.intent || feedback.problem || 'general';
  fileMemory.globalPatterns.commonQuestions[patternKey] = {
    count: (fileMemory.globalPatterns.commonQuestions[patternKey]?.count || 0) + 1,
    lastFeedback: rating,
    updatedAt: new Date().toISOString(),
  };
  memoryFallback.set(userId, next);
  writeMemoryFile(fileMemory);
  return next;
}

async function clearMemory(userId = 'guest') {
  if (!userId || userId === 'guest') return {};

  if (isMongoReady()) {
    try {
      await MentorMemory.deleteOne({ userId });
    } catch (error) {
      console.warn(`Mentor memory Mongo delete failed: ${error.message}`);
    }
  }

  const fileMemory = readMemoryFile();
  if (fileMemory.users && fileMemory.users[userId]) {
    delete fileMemory.users[userId];
    writeMemoryFile(fileMemory);
  }
  memoryFallback.delete(userId);

  return createEmptyUser(userId);
}

async function backfillJsonToMongo() {
  if (!isMongoReady()) {
    console.log('Skipping backfill: MongoDB not connected.');
    return;
  }

  try {
    const fileMemory = readMemoryFile();
    const users = fileMemory.users || {};
    const userIds = Object.keys(users);
    
    if (userIds.length === 0) {
      console.log('No users found in JSON for backfilling.');
      return;
    }

    console.log(`Starting backfill of ${userIds.length} users from JSON to MongoDB...`);
    let backfilledCount = 0;
    
    for (const userId of userIds) {
      const existingInMongo = await MentorMemory.findOne({ userId }).lean();
      if (!existingInMongo) {
        const merged = users[userId];
        await MentorMemory.create({
          userId,
          version: merged.version || 2,
          promptCount: merged.promptCount || 0,
          education: merged.education || '',
          preferredBranch: merged.preferredBranch || '',
          preferences: merged.preferences || {},
          interests: toMongoMap(merged.interests),
          branches: toMongoMap(merged.branches),
          emotions: toMongoMap(merged.emotions),
          intents: toMongoMap(merged.intents),
          languages: toMongoMap(merged.languages),
          recentNeeds: merged.recentNeeds || [],
          meta: merged.meta || {},
        });
        backfilledCount++;
      }
    }
    
    console.log(`Backfill completed. Processed ${userIds.length} users, inserted ${backfilledCount} new users into MongoDB.`);
  } catch (error) {
    console.error(`Backfill failed: ${error.message}`);
  }
}

module.exports = {
  buildLearningSummary,
  buildLearningSummaryAsync,
  calculateWeight,
  extractSignals,
  getMemory,
  getUserLearning,
  learnFromFeedback,
  learnFromPrompt,
  mergeMemory,
  updateMemory,
  clearMemory,
  backfillJsonToMongo,
};
