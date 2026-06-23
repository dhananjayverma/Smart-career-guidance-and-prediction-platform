const env = require('../config/env');
const { parseAiResponse, parseRetryDelayMs, sleep } = require('../utils/aiResponseParser');
const { scheduleTask } = require('./requestQueue.service');

const MAX_TOKENS = Number(process.env.AI_MAX_TOKENS || 700);

const OPENROUTER_MODELS = (process.env.OPENROUTER_MODELS || [
  'deepseek/deepseek-chat-v3-0324',
  'qwen/qwen-2.5-72b-instruct',
  'meta-llama/llama-3.3-70b-instruct',
].join(',')).split(',').map((model) => model.trim()).filter(Boolean);

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const TOGETHER_MODEL = process.env.TOGETHER_MODEL || 'meta-llama/Llama-3.3-70B-Instruct-Turbo';

const providerHealth = {
  groq: { healthy: true, lastFailure: 0 },
  openrouter: { healthy: true, lastFailure: 0 },
  together: { healthy: true, lastFailure: 0 },
  openai: { healthy: true, lastFailure: 0 },
};

const HEALTH_COOLDOWN_MS = 60_000;

function markProviderFailure(name) {
  providerHealth[name] = {
    healthy: false,
    lastFailure: Date.now(),
  };
}

function isProviderHealthy(name) {
  const state = providerHealth[name];
  if (!state) return true;
  if (state.healthy) return true;
  if (Date.now() - state.lastFailure > HEALTH_COOLDOWN_MS) {
    state.healthy = true;
    return true;
  }
  return false;
}

function markProviderSuccess(name) {
  providerHealth[name] = { healthy: true, lastFailure: 0 };
}

async function postChatCompletion({
  url,
  apiKey,
  model,
  messages,
  maxTokens = MAX_TOKENS,
  extraHeaders = {},
  maxRetries = 3,
  stream = false,
  onDelta,
}) {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.5,
        max_tokens: maxTokens,
        stream,
        ...(stream ? {} : { response_format: { type: 'json_object' } }),
      }),
    });

    if (response.ok) {
      if (stream) {
        return consumeStream(response, onDelta);
      }

      const payload = await response.json();
      return {
        content: payload.choices?.[0]?.message?.content || '{}',
        model,
      };
    }

    const errorText = await response.text();
    lastError = new Error(`${response.status}: ${errorText.slice(0, 280)}`);

    if (response.status === 429 && attempt < maxRetries) {
      const waitMs = parseRetryDelayMs(errorText, attempt);
      console.warn(`Rate limited on ${model}, waiting ${waitMs}ms (attempt ${attempt + 1})`);
      await sleep(waitMs);
      continue;
    }

    throw lastError;
  }

  throw lastError || new Error('Chat completion failed');
}

async function consumeStream(response, onDelta) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Streaming not supported in this environment');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;

      const data = trimmed.slice(5).trim();
      if (!data || data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        const chunk = parsed.choices?.[0]?.delta?.content || '';
        if (chunk) {
          fullText += chunk;
          if (onDelta) onDelta(chunk);
        }
      } catch (error) {
      }
    }
  }

  return { content: fullText, model: 'stream' };
}

async function callGroq(messages, maxTokens = MAX_TOKENS) {
  if (!env.groqApiKey) throw new Error('Groq API key not configured');

  const result = await postChatCompletion({
    url: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: env.groqApiKey,
    model: env.aiModel || GROQ_MODEL,
    messages,
    maxTokens,
    maxRetries: 3,
  });

  markProviderSuccess('groq');
  return {
    ...parseAiResponse(result.content),
    metadata: { aiMode: 'groq', model: result.model, provider: 'groq' },
  };
}

async function callOpenRouter(messages, maxTokens = MAX_TOKENS) {
  if (!env.openRouterApiKey) throw new Error('OpenRouter API key not configured');

  let lastError = null;

  for (const model of OPENROUTER_MODELS) {
    try {
      const result = await postChatCompletion({
        url: 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: env.openRouterApiKey,
        model,
        messages,
        maxTokens,
        extraHeaders: {
          'HTTP-Referer': env.openRouterSiteUrl || 'http://localhost:5173',
          'X-Title': env.openRouterAppName || 'NextStep AI',
        },
        maxRetries: 2,
      });

      markProviderSuccess('openrouter');
      return {
        ...parseAiResponse(result.content),
        metadata: { aiMode: 'openrouter', model: result.model, provider: 'openrouter' },
      };
    } catch (error) {
      lastError = error;
      console.warn(`OpenRouter ${model} failed: ${error.message}`);
    }
  }

  markProviderFailure('openrouter');
  throw lastError || new Error('OpenRouter failed for all models');
}

async function callTogether(messages, maxTokens = MAX_TOKENS) {
  if (!env.togetherApiKey) throw new Error('Together AI API key not configured');

  const result = await postChatCompletion({
    url: 'https://api.together.xyz/v1/chat/completions',
    apiKey: env.togetherApiKey,
    model: TOGETHER_MODEL,
    messages,
    maxTokens,
    maxRetries: 2,
  });

  markProviderSuccess('together');
  return {
    ...parseAiResponse(result.content),
    metadata: { aiMode: 'together', model: result.model, provider: 'together' },
  };
}

async function callOpenAi(messages, maxTokens = MAX_TOKENS) {
  if (!env.openAiApiKey) throw new Error('OpenAI API key not configured');

  const result = await postChatCompletion({
    url: 'https://api.openai.com/v1/chat/completions',
    apiKey: env.openAiApiKey,
    model: env.aiModel || 'gpt-4o-mini',
    messages,
    maxTokens,
    maxRetries: 2,
  });

  markProviderSuccess('openai');
  return {
    ...parseAiResponse(result.content),
    metadata: { aiMode: 'openai', model: result.model, provider: 'openai' },
  };
}

function getProviderChain() {
  const chain = [];

  if (env.groqApiKey && isProviderHealthy('groq')) {
    chain.push(['groq', () => callGroq]);
  }
  if (env.openRouterApiKey && isProviderHealthy('openrouter')) {
    chain.push(['openrouter', () => callOpenRouter]);
  }
  if (env.togetherApiKey && isProviderHealthy('together')) {
    chain.push(['together', () => callTogether]);
  }
  if (env.openAiApiKey && env.aiProvider === 'openai' && isProviderHealthy('openai')) {
    chain.push(['openai', () => callOpenAi]);
  }

  return chain;
}

async function askAI({ messages, maxTokens = MAX_TOKENS }) {
  const chain = getProviderChain();
  if (!chain.length) return null;

  const failures = [];

  for (const [name, getCaller] of chain) {
    try {
      return await getCaller()(messages, maxTokens);
    } catch (error) {
      markProviderFailure(name);
      failures.push(`${name}: ${error.message}`);
      console.warn(`${name} failed: ${error.message}`);
    }
  }

  if (failures.length) {
    console.warn(`All AI providers failed: ${failures.join(' | ')}`);
  }

  return null;
}

async function streamAI({ messages, maxTokens = MAX_TOKENS, onDelta }) {
  if (!env.groqApiKey) {
    throw new Error('Groq API key required for streaming');
  }

  const result = await postChatCompletion({
    url: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: env.groqApiKey,
    model: env.aiModel || GROQ_MODEL,
    messages,
    maxTokens,
    maxRetries: 2,
    stream: true,
    onDelta,
  });

  markProviderSuccess('groq');
  return parseAiResponse(result.content);
}

function getProviderStatus() {
  return {
    groq: Boolean(env.groqApiKey),
    openrouter: Boolean(env.openRouterApiKey),
    together: Boolean(env.togetherApiKey),
    openai: Boolean(env.openAiApiKey),
    primary: 'groq',
    health: providerHealth,
    models: {
      groq: env.aiModel || GROQ_MODEL,
      openrouter: OPENROUTER_MODELS,
      together: TOGETHER_MODEL,
    },
  };
}

module.exports = {
  askAI,
  streamAI,
  callGroq,
  callOpenRouter,
  callTogether,
  getProviderStatus,
  MAX_TOKENS,
};
