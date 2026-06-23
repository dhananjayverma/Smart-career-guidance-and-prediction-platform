const { buildCacheKey, getCachedResponse, setCachedResponse } = require('./cache.service');
const { scheduleTask } = require('./requestQueue.service');
const { matchTemplate, buildTemplateResponse, getStaticResponse } = require('./templateEngine.service');

function shouldUseCache(input) {
  if (input.skipCache) return false;
  return (input.conversationHistory || []).length === 0;
}

function tagResponse(response, pipeline, extra = {}) {
  return {
    ...response,
    metadata: {
      ...(response.metadata || {}),
      pipeline,
      ...extra,
    },
  };
}

async function executeMentorRequest({ input, getAiResponse, buildFallback }) {
  const cacheKey = buildCacheKey({
    message: input.message,
    language: input.language,
    intent: input.intent,
  });

  if (shouldUseCache(input)) {
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return tagResponse(cached, 'cache', { cacheKey });
    }
  }

  const template = matchTemplate({ message: input.message });
  if (template) {
    const response = buildTemplateResponse(template, { language: input.language });
    if (shouldUseCache(input)) {
      setCachedResponse(cacheKey, response);
    }
    return tagResponse(response, 'template', { templateId: template.id });
  }

  try {
    const aiResponse = await scheduleTask(
      () => getAiResponse(input),
      `chat-${input.intent || 'general'}`
    );

    if (aiResponse) {
      if (shouldUseCache(input)) {
        setCachedResponse(cacheKey, aiResponse);
      }
      return aiResponse;
    }
  } catch (error) {
    console.warn(`Queued AI request failed: ${error.message}`);
  }

  const fallback = buildFallback(input);
  if (fallback) {
    return tagResponse(fallback, 'local-engine');
  }

  return tagResponse(getStaticResponse({ language: input.language }), 'static-fallback');
}

async function executeMentorStream({ input, streamAiResponse, buildFallback, onDelta, onDone }) {
  const cacheKey = buildCacheKey({
    message: input.message,
    language: input.language,
    intent: input.intent,
  });

  const finish = (response, pipeline, extra = {}) => {
    onDone(tagResponse(response, pipeline, extra));
  };

  if (shouldUseCache(input)) {
    const cached = getCachedResponse(cacheKey);
    if (cached?.message) {
      onDelta(cached.message);
      return finish(cached, 'cache', { cacheKey });
    }
  }

  const template = matchTemplate({ message: input.message });
  if (template) {
    const response = buildTemplateResponse(template, { language: input.language });
    if (shouldUseCache(input)) {
      setCachedResponse(cacheKey, response);
    }
    onDelta(response.message);
    return finish(response, 'template', { templateId: template.id });
  }

  try {
    const response = await scheduleTask(
      () => streamAiResponse(input, onDelta),
      `stream-${input.intent || 'general'}`
    );

    if (response) {
      if (shouldUseCache(input)) {
        setCachedResponse(cacheKey, response);
      }
      return finish(response, response.metadata?.pipeline || 'ai-stream');
    }
  } catch (error) {
    console.warn(`Queued stream failed: ${error.message}`);
  }

  const fallback = buildFallback(input);
  const finalResponse = fallback || getStaticResponse({ language: input.language });
  onDelta(finalResponse.message);
  finish(finalResponse, fallback ? 'local-engine' : 'static-fallback');
}

module.exports = {
  executeMentorRequest,
  executeMentorStream,
  shouldUseCache,
};
