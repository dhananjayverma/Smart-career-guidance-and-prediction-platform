const crypto = require('crypto');
const { sanitizeAssistantMessage } = require('../utils/aiResponseParser');
const env = require('../config/env');

const TTL_MS = Number(env.cacheTtlMs || 60 * 60 * 1000);
const MAX_ENTRIES = Number(env.cacheMaxEntries || 500);

class MemoryCache {
  constructor({ ttlMs = TTL_MS, maxEntries = MAX_ENTRIES } = {}) {
    this.store = new Map();
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses += 1;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses += 1;
      return null;
    }

    this.hits += 1;
    return entry.value;
  }

  set(key, value) {
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
      createdAt: Date.now(),
    });
  }

  delete(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  stats() {
    const total = this.hits + this.misses;
    return {
      size: this.store.size,
      maxEntries: this.maxEntries,
      ttlMs: this.ttlMs,
      hits: this.hits,
      misses: this.misses,
      hitRate: total ? Number((this.hits / total).toFixed(3)) : 0,
    };
  }
}

const responseCache = new MemoryCache();

function normalizeForCache(message = '') {
  return String(message).toLowerCase().replace(/\s+/g, ' ').trim();
}

function buildCacheKey({ message, language = 'hinglish', intent = 'general_guidance' }) {
  const payload = `${intent}|${language}|${normalizeForCache(message)}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function getCachedResponse(key) {
  const value = responseCache.get(key);
  if (!value) return null;

  if (value.message) {
    const cleaned = sanitizeAssistantMessage(value.message);
    if (cleaned !== value.message) {
      const fixed = { ...value, message: cleaned };
      responseCache.set(key, fixed);
      return fixed;
    }
  }

  return value;
}

function setCachedResponse(key, value) {
  responseCache.set(key, value);
}

function getCacheStats() {
  return responseCache.stats();
}

module.exports = {
  buildCacheKey,
  getCachedResponse,
  setCachedResponse,
  getCacheStats,
  responseCache,
};
