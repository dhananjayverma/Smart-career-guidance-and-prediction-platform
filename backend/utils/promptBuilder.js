const careers = require('../data/careers.json');

function extractEducation(message = '') {
  const text = message.toLowerCase();
  if (/10th|\b10\b|dasvi|matric|10वीं/.test(text)) return '10th';
  if (/12th|\b12\b|barahvi|intermediate|12वीं/.test(text)) return '12th';
  if (/graduate|graduation|degree/.test(text)) return 'graduation';
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
  if (/ssc|upsc|railway|bank|sarkari|\bgov\b|govt|government|police|state psc|psc|government job|govt job|gov job/.test(text)) return 'government_job';
  if (/exam|ssc|upsc|railway|bank|neet|jee|sarkari|govt|government/.test(text)) return 'exam';
  if (/pareshan|presan|pareshaan|sad|stress|stressed|anxiety|tension|depress|akela|lonely|dukhi|dar lag|scared|problem|help me|nahi samajh|frustrat|hopeless/.test(text)) {
    return 'support';
  }
  if (/confus|kya\s*(karu|kru)|career|job|after|baad|banna|ban na|jana chahta|jaana chahta|jana hai|jaana hai|me jana|mein jana|kaise|how to|which|best|better|choose|select|cyber|sequeity|ethical hack|doctor|ca\b|polytechnic|diploma|stream|subject/.test(text)) {
    return 'career_confusion';
  }
  return 'general_guidance';
}

function cleanMessage(message = '') {
  return String(message).replace(/\s+/g, ' ').trim().slice(0, 800);
}

function isCareerIntent(intent = '') {
  return ['career_confusion', 'exam', 'government_job', 'roadmap', 'college'].includes(intent);
}

function allowsCareerDecision(intent = '') {
  return ['career_confusion'].includes(intent);
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
    'Answer the student’s latest message directly. Do not answer a different topic, do not invent a new question, and do not force career advice when the user is asking for support or clarification.',
    'Emotional intelligence is mandatory: detect stress, fear, confusion, shame, anger, or sadness before giving advice.',
    'Follow a mentor conversation state: understand the problem, clarify, then suggest a solution, then action plan, then follow up.',
    'Hard rule: when a student first shares a problem, validate it and provide a friendly, high-level overview or context first, then ask a clarifying question. Do not jump directly to long roadmaps, career list, or complex strategy before clarifying.',
    'Human mentor rule: Never ask more than one question. Never repeat a question already answered. If enough information exists, answer directly. Ask only the single most valuable next question. If the user asks a comparison, opinion, difference, pros and cons, or general guidance question, provide the best possible answer first. Do not immediately switch to clarification mode. Only ask one follow-up question if it will improve personalization.',
    'If the student sounds upset, first validate their feeling in 1-2 natural lines, then ask one gentle clarifying question. Do not jump directly into career lists.',
    'For high-risk self-harm language, ask them to contact a trusted person immediately and seek emergency/local crisis support. Stay calm and supportive.',
    'Talk like a caring mentor: friendly, clear, empathetic, and professional.',
    'Do not overuse words like "Beta". Avoid gendered self-references like "dunga" or "dungi"; use neutral phrases like "main suggest karunga/karungi" only when necessary, or simply "NextStep AI suggests".',
    'NEVER show JSON, code, or technical format to the user.',
    'Return ONE JSON object only (for the system to parse). Inside "message" write your FULL human reply:',
    '- Short greeting only if natural, then answer their exact question',
    '- Use sections only when the user asks for options, comparison, roadmap, exams, colleges, or a plan',
    '- Use numbered career options with Pros and Cons only when career options are actually useful',
    '- For India-specific career/exam/college questions, include realistic exams, streams, and timelines',
    '- If they passed 10th and ask career/stream advice: explain Science vs Commerce vs Diploma clearly',
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
  conversationState = {},
  understanding = {},
  behavior = {},
  mentorState = {},
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
  if (userProfile.experienceYears) {
    hints.push(`Experience: ${userProfile.experienceYears} years`);
  }
  if (userProfile.currentRole) {
    hints.push(`Current Role: ${userProfile.currentRole}`);
  }
  if (userProfile.careerStage) {
    hints.push(`Career Stage: ${userProfile.careerStage}`);
  }
  if (emotion.mood && emotion.mood !== 'neutral') {
    hints.push(`Mood: ${emotion.mood} (${emotion.intensity || 'low'} intensity)`);
  }
  if (analysis?.decision?.bestPath?.title) {
    hints.push(`Best match: ${analysis.decision.bestPath.title}`);
  }
  if (conversationState.stage) {
    hints.push(`Conversation stage: ${conversationState.stage}`);
  }
  if (conversationState.currentProblem) {
    hints.push(`Current problem: ${conversationState.currentProblem}`);
  }
  if (understanding.userType && understanding.userType !== 'unknown') {
    hints.push(`User type: ${understanding.userType}`);
  }
  if (understanding.confidence) {
    hints.push(`Understanding confidence: ${understanding.confidence}`);
  }
  if (behavior.mode) {
    hints.push(`Response mode: ${behavior.mode}`);
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
    government_job: 'Answer government job preparation questions. Ask education level and preferred exam category before recommending a specific path.',
    career_confusion: 'Acknowledge confusion, then give 2-3 clear career paths with pros/cons.',
    general_guidance: 'Answer directly and helpfully.',
  }[intent] || 'Answer directly and helpfully.';

  const compact = compactContext(context);

  return [
    hints.length ? hints.join('. ') : '',
    userProfile.learningSummary ? `Learned user memory: ${userProfile.learningSummary}` : '',
    analysis?.coachHint ? `Coach hint: ${analysis.coachHint}` : '',
    conversationState.needsMentorClarification
      ? 'State rule: clarification is helpful. Provide a friendly high-level answer or guidance first to keep the conversation engaging, then ask a gentle follow-up question to clarify the missing details.'
      : '',
    mentorState.intent
      ? `Reasoning Layer: ${JSON.stringify({
        userGoal: mentorState.reasoning?.userGoal || mentorState.intent,
        queryType: mentorState.queryType || 'general',
        knownFacts: mentorState.reasoning?.knownFacts || [],
        criticalUnknown: mentorState.reasoning?.criticalUnknown || '',
        canAnswerNow: Boolean(mentorState.reasoning?.canAnswerNow),
        nextQuestion: mentorState.reasoning?.nextQuestion || '',
      })}\nResponse Planner Decision: ${JSON.stringify(mentorState.responsePlan || {})}`
      : '',
    mentorState.queryType === 'comparison'
      ? 'Comparison rule: The student is asking to compare options. You must provide a direct, helpful, and balanced comparison first. Do not enter clarification mode. Do not ask questions before answering. Explain the pros/cons or differences first, and then ask at most one optional follow-up question at the very end to help them narrow down.'
      : '',
    mentorState.shouldAsk
      ? 'Gap rule: provide a direct, helpful high-level answer or guidance first, and then ask exactly ONE follow-up question (criticalUnknown/nextQuestion) at the very end to help personalize further. Do not ask multiple questions.'
      : '',
    mentorState.enoughInfo || mentorState.canAnswerNow
      ? 'Gap rule: enough information is available. Stop asking basic clarification questions and give practical advice now.'
      : '',
    conversationState.stage === 'solution_suggestion'
      ? 'State rule: enough context is available. Now give a practical strategy, not more basic questions.'
      : '',
    conversationState.stage === 'action_plan'
      ? 'State rule: convert the chosen strategy into exact next steps.'
      : '',
    behavior.mode === 'ASK'
      ? 'Behavior rule: ask 1-3 useful questions only; keep the conversation moving. Do not include Career Options, Roadmap, Pros/Cons, or a long plan.'
      : '',
    behavior.mode === 'SUPPORT'
      ? 'Behavior rule: validate emotion first, keep advice gentle, and ask a simple next question. Do not include Career Options, Roadmap, Pros/Cons, or a long plan.'
      : '',
    behavior.mode === 'GUIDE'
      ? 'Behavior rule: give direction and tradeoffs, then one practical next question.'
      : '',
    behavior.mode === 'PLAN'
      ? 'Behavior rule: give concrete numbered steps with timeline or sequence.'
      : '',
    `Intent: ${intent}. ${intentLine}`,
    careerMode ? 'Include career options when useful.' : 'Keep options=[], roadmap=[], recommendation="" unless asked.',
    !allowsCareerDecision(intent) ? 'Do not recommend a best-match career. Do not mention skill gap, radar, success probability, or a career decision card.' : '',
    intent === 'government_job' ? 'For government job queries, focus on exam categories like SSC, Banking, Railway, UPSC, Police, State PSC. Ask class/qualification and target exam category. Keep options=[], roadmap=[], recommendation="".' : '',
    emotion.needsImmediateSafety ? 'Start with safety support. Keep it short, caring, and urgent.' : '',
    emotion.needsSupport ? 'Start with empathy. Keep answer short and emotionally safe. Ask only one next question.' : '',
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
  allowsCareerDecision,
};
