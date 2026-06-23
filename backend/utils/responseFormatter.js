const { sanitizeAssistantMessage } = require('./aiResponseParser');

function normalizeOption(option = {}) {
  return {
    name: option.name || option.title || 'Career option',
    title: option.title || option.name || 'Career option',
    duration: option.duration || option.time || 'Depends on path',
    salary: option.salary || 'Varies by skill and city',
    difficulty: option.difficulty || 'Medium',
    description: option.description || option.pros || '',
    pros: option.pros || '',
    cons: option.cons || '',
    skills: option.skills || [],
    successProbability: option.successProbability,
    riskLevel: option.riskLevel,
  };
}

function formatCareerResponse(raw = {}, fallback = {}) {
  const response = typeof raw === 'string' ? { message: raw } : raw;
  const options = Array.isArray(response.options) ? response.options.map(normalizeOption) : [];
  const fallbackMetadata = fallback.metadata || {};
  const metadata = response.metadata && typeof response.metadata === 'object'
    ? response.metadata
    : {};

  const message = sanitizeAssistantMessage(
    response.message || fallback.message || 'Career options mil gaye. Neeche best paths dekho.'
  );

  return {
    message,
    options,
    roadmap: Array.isArray(response.roadmap) ? response.roadmap : [],
    recommendation: response.recommendation || fallback.recommendation || '',
    nextQuestions: Array.isArray(response.nextQuestions) ? response.nextQuestions : [],
    metadata: { ...fallbackMetadata, ...metadata },
  };
}

module.exports = { formatCareerResponse, normalizeOption };
