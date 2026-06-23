const templates = require('../data/mentorTemplates.json');
const { formatCareerResponse } = require('../utils/responseFormatter');

const sortedTemplates = [...templates].sort((a, b) => {
  const longest = (items) => Math.max(...items.patterns.map((pattern) => pattern.length));
  return longest(b) - longest(a);
});

function normalizeQuestion(message = '') {
  return String(message).toLowerCase().replace(/\s+/g, ' ').trim();
}

function matchTemplate({ message }) {
  const text = normalizeQuestion(message);

  for (const template of sortedTemplates) {
    const matched = template.patterns.some((pattern) => text.includes(pattern.toLowerCase()));
    if (matched) return template;
  }

  return null;
}

function buildTemplateResponse(template, { language = 'hinglish' } = {}) {
  return formatCareerResponse({
    message: template.message,
    options: template.options || [],
    roadmap: template.roadmap || [],
    recommendation: template.recommendation || '',
    nextQuestions: template.nextQuestions || [],
    metadata: {
      aiMode: 'template-engine',
      templateId: template.id,
      provider: 'template',
      language,
    },
  });
}

function getStaticResponse({ language = 'hinglish' } = {}) {
  const isEnglish = language === 'english';

  return formatCareerResponse({
    message: isEnglish
      ? 'Our AI is briefly busy. Try again in a few seconds — or ask about React roadmap, Node.js, Full Stack, interview prep, or resume tips for instant answers.'
      : 'AI abhi thoda busy hai. Kuch seconds baad try karo — ya React roadmap, Node.js, Full Stack, interview prep, resume tips pucho, instant answer milega.',
    options: [],
    roadmap: [],
    recommendation: isEnglish ? 'Try a specific question like "React roadmap" or "interview preparation".' : '"React roadmap" ya "interview preparation" pucho.',
    nextQuestions: [
      'React roadmap do',
      'Full stack developer kaise banun?',
      'Interview preparation tips',
      'Resume review tips',
    ],
    metadata: {
      aiMode: 'static-fallback',
      provider: 'static',
    },
  });
}

function getTemplateStats() {
  return {
    totalTemplates: templates.length,
    categories: templates.map((item) => item.id),
  };
}

module.exports = {
  matchTemplate,
  buildTemplateResponse,
  getStaticResponse,
  getTemplateStats,
};
