const careers = require('../data/careers.json');

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
  if (/^(hi+|hii+|hello+|hey+|namaste|namaskar|salam|good morning|good afternoon|good evening|kaise ho|how are you)[!. ]*$/i.test(text)) {
    return 'greeting';
  }
  if (/^(thanks?|thank you|shukriya|dhanyavad|ok|okay|hmm|hm|yo|theek hai)[!. ]*$/i.test(text)) {
    return 'small_talk';
  }
  if (/roadmap|road map|step.?by.?step|kaise banu|how to become|become a|banna hai|ban na hai|learning path|study plan|poora plan|complete plan/.test(text)) {
    return 'roadmap';
  }
  if (/college|iit|nit|university|admission|fees/.test(text)) return 'college';
  if (/exam|ssc|upsc|railway|bank|neet|jee|sarkari|govt|government/.test(text)) return 'exam';
  if (/pareshan|presan|pareshaan|sad|stress|stressed|anxiety|tension|depress|akela|lonely|dukhi|dar lag|scared|problem|help me|nahi samajh|frustrat|hopeless/.test(text)) {
    return 'support';
  }
  if (/confus|kya\s*k(a|r)u|kya\s*kru|career|job|after|baad|banna|ban na|engineer|engin(eer|ner)|doctor|developer|ca\b|polytechnic|diploma|stream|subject/.test(text)) {
    return 'career_confusion';
  }
  return 'general_guidance';
}

function cleanMessage(message = '') {
  return String(message).replace(/\s+/g, ' ').trim().slice(0, 800);
}

function isCareerIntent(intent = '') {
  return ['career_confusion', 'exam', 'roadmap', 'college'].includes(intent);
}

function extractCareerTarget(message = '', careerData = []) {
  const text = message.toLowerCase();
  const pool = [...careerData, ...careers];

  const roadmapMatch = text.match(/(?:roadmap|plan|path|become|banna|ban na|for|ke liye|ka)\s+(?:a\s+)?(.{3,60})/i);
  if (roadmapMatch) {
    const fragment = roadmapMatch[1].trim();
    const fromFragment = pool.find((career) => {
      const title = career.title.toLowerCase();
      return fragment.includes(title) || title.includes(fragment);
    });
    if (fromFragment) return fromFragment.title;
  }

  const direct = pool.find((career) => {
    const title = career.title.toLowerCase();
    if (text.includes(title)) return true;
    return (career.interests || []).some((interest) => text.includes(String(interest).toLowerCase()));
  });
  if (direct) return direct.title;

  if (/engineer|engineering|b\.?tech|jee|pcm/.test(text)) return 'B.Tech Engineering';
  if (/software|developer|coding|programming|web dev/.test(text)) return 'Software Developer';
  if (/data scien|machine learning|ml\b|ai\b/.test(text)) return 'Data Scientist';
  if (/upsc|ias|ips|civil service/.test(text)) return 'UPSC Civil Services';
  if (/ssc|banking|bank job|railway/.test(text)) return 'SSC and Banking Jobs';
  if (/doctor|mbbs|neet|medical/.test(text)) return 'Doctor (MBBS)';
  if (/ca\b|chartered|account/.test(text)) return 'Chartered Accountant';
  if (/digital marketing|seo|social media marketing/.test(text)) return 'Digital Marketing Specialist';
  if (/diploma|polytechnic/.test(text)) return 'Polytechnic Diploma in IT';

  return careerData[0]?.title || 'Software Developer';
}

function compactContext(context = {}) {
  return {
    careers: (context.careers || []).slice(0, 3).map((career) => ({
      title: career.title,
      duration: career.duration,
      salary: career.salary,
      difficulty: career.difficulty,
      pros: career.pros,
      cons: career.cons,
    })),
    exams: (context.exams || []).slice(0, 2).map((exam) => ({
      name: exam.name,
      eligibility: exam.eligibility,
    })),
    colleges: (context.colleges || []).slice(0, 2).map((college) => ({
      name: college.name,
      type: college.type,
      fees: college.fees,
    })),
    roadmapPhases: context.fullRoadmap
      ? context.fullRoadmap.milestones?.map((m) => m.title)
      : undefined,
    notes: (context.retrievedDocuments || []).slice(0, 2).map((doc) => {
      const text = doc.content || '';
      return text.slice(0, 180);
    }),
  };
}

function buildSystemPrompt({ language, userProfile = {} }) {
  const name = userProfile.name ? ` Student name: ${userProfile.name}.` : '';
  const lang = language === 'english' ? 'English' : language === 'hindi' ? 'Hindi' : 'Hinglish';

  return [
    `You are NextStep AI — a warm, caring career mentor for Indian students.${name} Reply in natural ${lang}.`,
    'Talk like ChatGPT: friendly, clear, empathetic. Use "Beta" or their name when natural.',
    'NEVER show JSON, code, or technical format to the user.',
    'Return ONE JSON object only (for the system to parse). Inside "message" write your FULL human reply:',
    '- Short greeting if needed, then answer their exact question',
    '- Use line breaks and numbered steps for roadmaps',
    '- Be specific for India: exams, streams, realistic timelines',
    '- If they passed 10th: explain Science vs Commerce vs Diploma clearly',
    'JSON keys: message (string, main reply), options (array), roadmap (array of {title,duration,tasks}), recommendation (string), nextQuestions (array of 2-3 questions).',
  ].join(' ');
}

function buildCareerPrompt({
  message,
  intent,
  context,
  analysis,
  userProfile = {},
  fullRoadmap = null,
  hasHistory = false,
  sessionSummary = '',
}) {
  const careerMode = isCareerIntent(intent);
  const emotion = analysis?.emotion || {};
  const hints = [];

  if (userProfile.education && userProfile.education !== 'unknown') {
    hints.push(`Education: ${userProfile.education}`);
  }
  if (userProfile.interests?.length) {
    hints.push(`Interests: ${userProfile.interests.slice(0, 3).join(', ')}`);
  }
  if (emotion.mood && emotion.mood !== 'neutral') {
    hints.push(`Mood: ${emotion.mood}`);
  }
  if (analysis?.decision?.bestPath?.title) {
    hints.push(`Best match: ${analysis.decision.bestPath.title}`);
  }

  const intentLine = {
    greeting: 'Greet warmly and ask what they need help with.',
    small_talk: 'Reply naturally and ask one helpful follow-up.',
    support: 'Acknowledge feelings first, then one small practical step.',
    roadmap: fullRoadmap
      ? `Give COMPLETE roadmap for "${fullRoadmap.title}" in message + roadmap array. Phases: ${fullRoadmap.milestones.map((m) => m.title).join(', ')}.`
      : 'Give a complete phase-by-phase roadmap with tasks.',
    college: 'Answer college question with specific practical advice.',
    exam: 'Explain exam path, eligibility, and preparation timeline.',
    career_confusion: 'Acknowledge confusion, then give 2-3 clear career paths with pros/cons.',
    general_guidance: 'Answer directly and helpfully.',
  }[intent] || 'Answer directly and helpfully.';

  const compact = compactContext(context);

  return [
    hints.length ? hints.join('. ') : '',
    `Intent: ${intent}. ${intentLine}`,
    careerMode ? 'Include career options when useful.' : 'Keep options=[], roadmap=[], recommendation="" unless asked.',
    emotion.needsSupport ? 'Start with empathy.' : '',
    !hasHistory && sessionSummary ? `Profile/context: ${sessionSummary.slice(0, 300)}` : '',
    `Context: ${JSON.stringify(compact).slice(0, 2000)}`,
    `Student message: ${message}`,
  ].filter(Boolean).join('\n');
}

module.exports = {
  buildCareerPrompt,
  buildSystemPrompt,
  cleanMessage,
  compactContext,
  detectIntent,
  extractEducation,
  extractCareerTarget,
  isCareerIntent,
};
