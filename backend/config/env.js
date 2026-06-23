const fs = require('fs');
const path = require('path');

function loadDotEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadDotEnv();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5001),
  mongoUri: process.env.MONGO_URI || '',
  aiProvider: (process.env.AI_PROVIDER || 'groq').toLowerCase(),
  groqApiKey: process.env.GROQ_API_KEY || process.env.GROQ_API || '',
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
  togetherApiKey: process.env.TOGETHER_API_KEY || '',
  openRouterSiteUrl: process.env.OPENROUTER_SITE_URL || '',
  openRouterAppName: process.env.OPENROUTER_APP_NAME || 'NextStep AI',
  aiModel: process.env.AI_MODEL || process.env.GROQ_MODEL || '',
  cacheTtlMs: Number(process.env.CACHE_TTL_MS || 60 * 60 * 1000),
  cacheMaxEntries: Number(process.env.CACHE_MAX_ENTRIES || 500),
  queueMinTimeMs: Number(process.env.QUEUE_MIN_TIME_MS || 1200),
  queueMaxConcurrent: Number(process.env.QUEUE_MAX_CONCURRENT || 1),
};
