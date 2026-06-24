function getEmotion(input = {}) {
  return input.analysis?.emotion || {};
}

function shouldUseCache(input = {}) {
  if (input.skipCache) return false;
  if (shouldUseLocalEmotion(input)) return false;
  return (input.conversationHistory || []).length === 0;
}

function shouldUseLocalEmotion(input = {}) {
  const emotion = getEmotion(input);
  return (
    input.intent === 'support'
    || emotion.needsImmediateSafety
    || (emotion.needsSupport && Number(emotion.confidence || 0) >= 0.55)
  );
}

function selectResponseRoute(input = {}, { hasCache = false, hasTemplate = false } = {}) {
  const emotion = getEmotion(input);

  if (emotion.needsImmediateSafety) {
    return {
      route: 'crisis-local',
      reason: 'Immediate safety signal detected',
      useLocalFallback: true,
      skipCache: true,
      skipTemplate: true,
      skipAI: true,
    };
  }

  if (input.conversationState?.needsMentorClarification) {
    return {
      route: 'conversation-state-local',
      reason: `Conversation stage requires ${input.conversationState.stage} before solution`,
      useLocalFallback: true,
      skipCache: true,
      skipTemplate: true,
      skipAI: true,
    };
  }

  if (shouldUseLocalEmotion(input)) {
    return {
      route: 'emotion-local',
      reason: 'Support/stress message should be answered locally first',
      useLocalFallback: true,
      skipCache: true,
      skipTemplate: true,
      skipAI: true,
    };
  }

  if (hasCache && shouldUseCache(input)) {
    return {
      route: 'cache',
      reason: 'Fresh user query can reuse cached deterministic answer',
    };
  }

  if (hasTemplate) {
    return {
      route: 'template',
      reason: 'Matched local mentor template',
      skipAI: true,
    };
  }

  return {
    route: 'ai',
    reason: 'Needs generative answer',
  };
}

module.exports = {
  selectResponseRoute,
  shouldUseCache,
  shouldUseLocalEmotion,
};
