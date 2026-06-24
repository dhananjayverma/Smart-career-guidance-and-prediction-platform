function hasPlanLanguage(message = '') {
  return /roadmap|plan|steps|step by step|kaise|how to|action|strategy|next kya|kya karu|kya kru/i.test(message);
}

function hasEnoughInfo(conversationState = {}) {
  if (!conversationState.currentProblem) return true;
  if (conversationState.stage === 'solution_suggestion') return true;
  if (conversationState.stage === 'action_plan') return true;
  if (conversationState.stage === 'follow_up') return true;
  return !conversationState.needsMentorClarification;
}

function selectBehaviorMode({ message = '', intent = '', understanding = {}, conversationState = {}, analysis = {} }) {
  const emotion = analysis.emotion || {};

  if (emotion.needsImmediateSafety) {
    return {
      mode: 'SUPPORT',
      reason: 'Immediate safety signal detected',
      enoughInfo: false,
      shouldAsk: true,
    };
  }

  if (emotion.needsSupport && Number(emotion.confidence || 0) >= 0.55) {
    return {
      mode: 'SUPPORT',
      reason: 'User sounds emotionally stressed and needs support first',
      enoughInfo: false,
      shouldAsk: true,
    };
  }

  if (conversationState.needsMentorClarification || !hasEnoughInfo(conversationState)) {
    return {
      mode: 'ASK',
      reason: 'Useful context is missing before advice',
      enoughInfo: false,
      shouldAsk: true,
    };
  }

  if (intent === 'roadmap' || conversationState.stage === 'action_plan' || hasPlanLanguage(message)) {
    return {
      mode: 'PLAN',
      reason: 'User is ready for concrete steps',
      enoughInfo: true,
      shouldAsk: false,
    };
  }

  if (understanding.problem || understanding.target || intent !== 'general_guidance') {
    return {
      mode: 'GUIDE',
      reason: 'Problem or goal is clear enough to guide',
      enoughInfo: true,
      shouldAsk: false,
    };
  }

  return {
    mode: 'GUIDE',
    reason: 'General helpful answer',
    enoughInfo: true,
    shouldAsk: false,
  };
}

module.exports = {
  hasEnoughInfo,
  selectBehaviorMode,
};
