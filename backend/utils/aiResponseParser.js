function parseAiJson(content = '{}') {
  const raw = typeof content === 'string' ? content.trim() : JSON.stringify(content);
  const withoutFence = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const start = withoutFence.indexOf('{');
  const end = withoutFence.lastIndexOf('}');
  const candidate = start !== -1 && end > start
    ? withoutFence.slice(start, end + 1)
    : withoutFence;

  return JSON.parse(candidate);
}

function looksLikeJsonPayload(text = '') {
  const trimmed = String(text).trim();
  return trimmed.startsWith('{') && /"message"\s*:/.test(trimmed);
}

function unescapeJsonString(value = '') {
  return String(value)
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function extractMessageFromJsonLike(text = '') {
  const trimmed = String(text).trim();
  if (!looksLikeJsonPayload(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = parseAiJson(trimmed);
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.message === 'string' && parsed.message.trim()) {
        return parsed.message.trim();
      }
    }
  } catch (error) {
  }

  const match = trimmed.match(/"message"\s*:\s*"((?:\\.|[^"\\])*)"/s);
  if (match) {
    return unescapeJsonString(match[1]).trim();
  }

  return trimmed
    .replace(/^\{\s*"message"\s*:\s*"/, '')
    .replace(/"\s*,\s*"options".*$/s, '')
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .trim();
}

function extractStreamingMessagePreview(buffer = '') {
  const match = String(buffer).match(/"message"\s*:\s*"((?:\\.|[^"\\])*)(?:"|$)/s);
  if (!match) return '';
  return unescapeJsonString(match[1]);
}

function normalizeAiPayload(content = '{}') {
  if (content && typeof content === 'object' && !Array.isArray(content)) {
    return {
      message: extractMessageFromJsonLike(content.message || ''),
      options: Array.isArray(content.options) ? content.options : [],
      roadmap: Array.isArray(content.roadmap) ? content.roadmap : [],
      recommendation: typeof content.recommendation === 'string' ? content.recommendation : '',
      nextQuestions: Array.isArray(content.nextQuestions) ? content.nextQuestions : [],
      metadata: content.metadata && typeof content.metadata === 'object' ? content.metadata : {},
    };
  }

  const text = String(content).trim();
  if (!text) {
    throw new Error('Empty AI response');
  }

  if (looksLikeJsonPayload(text)) {
    try {
      const parsed = parseAiJson(text);
      return normalizeAiPayload(parsed);
    } catch (error) {
      return {
        message: extractMessageFromJsonLike(text),
        options: [],
        roadmap: [],
        recommendation: '',
        nextQuestions: [],
        metadata: {},
      };
    }
  }

  return {
    message: text,
    options: [],
    roadmap: [],
    recommendation: '',
    nextQuestions: [],
    metadata: {},
  };
}

function parseAiResponse(content = '{}') {
  return normalizeAiPayload(content);
}

function sanitizeAssistantMessage(message = '') {
  const cleaned = extractMessageFromJsonLike(message);
  if (!cleaned || looksLikeJsonPayload(cleaned)) {
    return 'Main aapki help kar sakta hoon. Thoda aur clearly batao — aap abhi kis class me ho aur kya career soch rahe ho?';
  }
  return cleaned;
}

function extractRetrySeconds(errorText = '') {
  const match = String(errorText).match(/try again in ([\d.]+)s/i);
  return match ? parseFloat(match[1]) : null;
}

function parseRetryDelayMs(errorText = '', attempt = 0) {
  const seconds = extractRetrySeconds(errorText);
  if (seconds !== null) {
    return Math.ceil(seconds * 1000) + 300;
  }
  return 1200 * (attempt + 1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  parseAiJson,
  parseAiResponse,
  normalizeAiPayload,
  sanitizeAssistantMessage,
  extractMessageFromJsonLike,
  extractStreamingMessagePreview,
  looksLikeJsonPayload,
  parseRetryDelayMs,
  extractRetrySeconds,
  sleep,
};
