const { normalizeEmotionText } = require('./emotion.service');
const { detectCareerTarget, detectProblem } = require('./conversationState.service');

function detectProblemByCombination(message = '', emotion = {}) {
  const text = normalizeEmotionText(message);
  const hasSalary = /salary|ctc|package|increment|hike|paise|underpaid/.test(text);
  const hasNegativeTone = (
    emotion.needsSupport
    || /low|kam|nahi|frustrat|pareshan|tension|stuck|problem|underpaid/.test(text)
  );

  if (hasSalary && hasNegativeTone) {
    return {
      key: 'salary',
      label: 'low_salary',
      confidence: 0.86,
    };
  }

  if (/job nahi mil|resume reject|interview nahi|apply/.test(text)) {
    return {
      key: 'job_search',
      label: 'job_search',
      confidence: 0.78,
    };
  }

  if (/pressure|stress|padhai nahi|marks|exam/.test(text) && emotion.needsSupport) {
    return {
      key: 'study_pressure',
      label: 'study_pressure',
      confidence: 0.82,
    };
  }

  return null;
}

function detectUserType(message = '', userProfile = {}) {
  const text = normalizeEmotionText(message);
  if (/salary|ctc|package|company|office|working|job|experience|exp|developer|engineer|manager|switch/.test(text)) {
    return 'working_professional';
  }
  if (/college|btech|bca|graduate|graduation|semester|degree/.test(text)) return 'college_student';
  if (/10th|12th|school|board|jee|neet/.test(text)) return 'school_student';
  if (userProfile.education && userProfile.education !== 'unknown') return 'student';
  return 'unknown';
}

function calculateConfidence({ emotion = {}, intent = '', problem = null, target = '', userType = '' }) {
  let confidence = 0.42;
  if (intent && intent !== 'general_guidance') confidence += 0.14;
  if (problem?.label) confidence += problem.confidence ? problem.confidence * 0.22 : 0.18;
  if (target) confidence += 0.12;
  if (userType && userType !== 'unknown') confidence += 0.1;
  if (emotion.confidence) confidence += Math.min(0.12, Number(emotion.confidence) * 0.12);
  return Number(Math.min(0.96, confidence).toFixed(2));
}

function buildUnderstanding({ message = '', intent = '', analysis = {}, conversationState = {}, userProfile = {} }) {
  const emotion = analysis.emotion || {};
  const detected = detectProblemByCombination(message, emotion) || detectProblem(message, intent);
  const problem = detected
    ? {
        key: detected.key || conversationState.problemKey || '',
        label: detected.label || conversationState.currentProblem || '',
      }
    : conversationState.currentProblem
      ? {
          key: conversationState.problemKey || '',
          label: conversationState.currentProblem,
        }
      : null;
  const target = detectCareerTarget(message) || conversationState.target || '';
  const userType = conversationState.userSituation && conversationState.userSituation !== 'unknown'
    ? conversationState.userSituation
    : detectUserType(message, userProfile);

  return {
    emotion: emotion.mood || 'neutral',
    intent,
    problem: problem?.label || '',
    problemKey: problem?.key || '',
    target,
    userType,
    stage: conversationState.stage || 'follow_up',
    confidence: calculateConfidence({ emotion, intent, problem, target, userType }),
    signals: {
      needsSupport: Boolean(emotion.needsSupport),
      needsImmediateSafety: Boolean(emotion.needsImmediateSafety),
      knownContext: conversationState.knownSignals || [],
      missingContext: (conversationState.requiredSignals || []).filter(
        (signal) => !(conversationState.knownSignals || []).includes(signal)
      ),
    },
  };
}

module.exports = {
  buildUnderstanding,
  detectProblemByCombination,
  detectUserType,
};
