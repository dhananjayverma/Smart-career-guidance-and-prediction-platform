function extractEducation(message = '') {
  const text = message.toLowerCase();
  if (/\b10(th)?\b|matric|dasvi|10वीं/.test(text)) return '10th';
  if (/\b12(th)?\b|intermediate|barahvi|12वीं/.test(text)) return '12th';
  if (/\b(graduate|graduation|bca|btech|b\.tech|ba|bcom|bsc)\b/.test(text)) return 'graduation';
  if (/8th|9th|school/.test(text)) return 'school';
  return 'unknown';
}

function detectIntent(message = '') {
  const text = message.toLowerCase().trim();
  if (/^(hi+|hii+|hello+|hey+|namaste|namaskar|salam|good morning|good afternoon|good evening)[!. ]*$/.test(text)) {
    return 'greeting';
  }
  if (/^(thanks?|thank you|ok|okay|hmm|hm|yo)[!. ]*$/.test(text)) {
    return 'small_talk';
  }
  if (/college|iit|nit|university|admission|fees/.test(text)) return 'college';
  if (/roadmap|plan|kaise banu|how to become|steps/.test(text)) return 'roadmap';
  if (/exam|ssc|upsc|railway|bank|neet|jee|sarkari|govt|government/.test(text)) return 'exam';
  if (/pareshan|presan|pareshaan|sad|stress|stressed|anxiety|tension|depress|akela|lonely|dukhi|dar lag|scared|problem|help me/.test(text)) {
    return 'support';
  }
  if (/confus|kya\s*k(a|r)u|kya\s*kru|career|job|after|baad|banna|ban na|engineer|engin(eer|ner)|doctor|developer|ca\b|polytechnic|diploma|stream|subject/.test(text)) {
    return 'career_confusion';
  }
  return 'general_guidance';
}

function cleanMessage(message = '') {
  return String(message).replace(/\s+/g, ' ').trim().slice(0, 1200);
}

function isCareerIntent(intent = '') {
  return ['career_confusion', 'exam', 'roadmap', 'college'].includes(intent);
}

function buildCareerPrompt({ message, language, intent, context, sessionSummary, analysis }) {
  const careerMode = isCareerIntent(intent);

  return [
    'You are NextStep AI, a warm ChatGPT-like assistant for Indian students.',
    'You can answer general questions, emotional support messages, study questions, career questions, exam questions, and college questions.',
    `Reply language style: ${language}. Use simple, supportive words.`,
    `Detected intent: ${intent}.`,
    `Mentor intelligence analysis: ${JSON.stringify(analysis || {}).slice(0, 4000)}`,
    'Use retrieved RAG documents as the knowledge base when relevant. Prefer them over generic assumptions.',
    careerMode
      ? 'Career mode: answer the exact career question directly first, then give paths/options. If user says engineer banna hai, explain engineering routes clearly: after 10th choose 11th-12th PCM + JEE/state entrance, or polytechnic diploma + lateral entry, or CS/software route.'
      : 'General chat mode: answer the user directly. Do not force career advice. Do not return career options, salary cards, college lists, exam paths, or roadmap unless the user asks for them.',
    'Use mentor tone: bhai tension mat le, simple language, practical steps, no over-generic answer.',
    'If the user sounds upset, first acknowledge feelings kindly, ask one gentle follow-up, and suggest one small immediate step. Do not give medical diagnosis.',
    'Important: Do not repeat old assistant messages from session history. Treat the latest student message as primary.',
    'Session summary is only for personalization. If it conflicts with the latest student message, ignore session summary completely.',
    'Your first sentence must answer the latest student message directly.',
    'Return only valid JSON with: message, options, roadmap, recommendation, nextQuestions. Do not wrap JSON in markdown fences.',
    careerMode
      ? 'Each career option must include name, duration, salary, difficulty, pros, cons. Roadmap items must include title, duration, tasks.'
      : 'For general chat mode, options must be [], roadmap must be [], and recommendation should be "" unless directly useful.',
    `Student message: ${message}`,
    `Optional session memory: ${sessionSummary || 'No previous context'}`,
    `Relevant data: ${JSON.stringify(context).slice(0, 8000)}`,
  ].join('\n');
}

module.exports = {
  buildCareerPrompt,
  cleanMessage,
  detectIntent,
  extractEducation,
  isCareerIntent,
};
