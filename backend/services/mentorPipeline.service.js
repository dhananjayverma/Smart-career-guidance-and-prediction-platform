const { buildCacheKey, getCachedResponse, setCachedResponse } = require('./cache.service');
const { scheduleTask } = require('./requestQueue.service');
const { matchTemplate, buildTemplateResponse, getStaticResponse } = require('./templateEngine.service');
const { selectResponseRoute, shouldUseCache } = require('./decisionEngine.service');

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

function personalizeTemplateResponse(response, input = {}) {
  if (!['career_confusion', 'roadmap'].includes(input.intent)) return response;

  const profile = input.userProfile || {};
  const interests = Array.isArray(profile.interests) ? profile.interests.slice(0, 3) : [];
  const contextBits = [
    profile.preferredBranch ? `branch/course: ${profile.preferredBranch}` : '',
    interests.length ? `interest: ${interests.join(', ')}` : '',
  ].filter(Boolean);

  if (!contextBits.length || !response?.message) return response;

  return {
    ...response,
    message: `${response.message}\n\nTumhare context ke hisaab se (${contextBits.join(', ')}), pehla best step foundation strong karke ek practical project banana hai.`,
    metadata: {
      ...(response.metadata || {}),
      personalized: true,
    },
  };
}

async function executeMentorRequest({ input, getAiResponse, buildFallback }) {
  const cacheKey = buildCacheKey({
    message: input.message,
    language: input.language,
    intent: input.intent,
  });

  const cached = shouldUseCache(input) ? getCachedResponse(cacheKey) : null;
  const template = matchTemplate({ message: input.message });
  const route = selectResponseRoute(input, {
    hasCache: Boolean(cached),
    hasTemplate: Boolean(template),
  });

  if (route.useLocalFallback) {
    const response = buildFallback(input);
    if (response) {
      const pipeline = route.route === 'conversation-state-local'
        ? 'conversation-state-engine'
        : 'local-emotion-engine';
      return tagResponse(response, pipeline, { routeReason: route.reason });
    }
  }

  if (route.route === 'cache' && cached) {
    return tagResponse(cached, 'cache', { cacheKey, routeReason: route.reason });
  }

  if (route.route === 'template' && template) {
    const response = personalizeTemplateResponse(buildTemplateResponse(template, { language: input.language }), input);
    if (shouldUseCache(input) && !response.metadata?.personalized) {
      setCachedResponse(cacheKey, response);
    }
    return tagResponse(response, 'template', { templateId: template.id, routeReason: route.reason });
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

  const cached = shouldUseCache(input) ? getCachedResponse(cacheKey) : null;
  const template = matchTemplate({ message: input.message });
  const route = selectResponseRoute(input, {
    hasCache: Boolean(cached),
    hasTemplate: Boolean(template),
  });

  if (route.useLocalFallback) {
    const response = buildFallback(input);
    if (response) {
      onDelta(response.message);
      const pipeline = route.route === 'conversation-state-local'
        ? 'conversation-state-engine'
        : 'local-emotion-engine';
      return finish(response, pipeline, { routeReason: route.reason });
    }
  }

  if (route.route === 'cache' && cached?.message) {
    onDelta(cached.message);
    return finish(cached, 'cache', { cacheKey, routeReason: route.reason });
  }

  if (route.route === 'template' && template) {
    const response = personalizeTemplateResponse(buildTemplateResponse(template, { language: input.language }), input);
    if (shouldUseCache(input) && !response.metadata?.personalized) {
      setCachedResponse(cacheKey, response);
    }
    onDelta(response.message);
    return finish(response, 'template', { templateId: template.id, routeReason: route.reason });
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
