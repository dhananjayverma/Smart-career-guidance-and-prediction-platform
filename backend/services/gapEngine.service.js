const { extractEducation } = require('../utils/promptBuilder');
const { normalizeEmotionText } = require('./emotion.service');

const CONFIDENCE_THRESHOLD = 80;

const REQUIRED_FIELDS = {
  government_job: ['education', 'target_exam'],
  career_confusion: ['education', 'interest'],
  career_switch: ['current_role', 'target_field'],
  roadmap: ['goal'],
};

const QUESTION_COPY = {
  government_job: {
    education: {
      hinglish: 'Graduate ho ya 12th pass?',
      hindi: 'Aap graduate hain ya 12th pass?',
      english: 'Are you a graduate or 12th pass?',
      nextQuestions: ['Graduate', '12th pass'],
    },
    target_exam: {
      hinglish: 'SSC, Banking, Railway, UPSC, Police ya State PSC me kis side jana hai?',
      hindi: 'SSC, Banking, Railway, UPSC, Police ya State PSC me se kis taraf jana chahte hain?',
      english: 'Which side interests you: SSC, Banking, Railway, UPSC, Police, or State PSC?',
      nextQuestions: ['SSC', 'Banking', 'Railway', 'UPSC'],
    },
  },
  career_confusion: {
    education: {
      hinglish: 'Abhi tum 10th, 12th, college, graduate ya working me se kis stage par ho?',
      hindi: 'Abhi aap 10th, 12th, college, graduate ya working me se kis stage par hain?',
      english: 'What stage are you in right now: 10th, 12th, college, graduate, or working?',
      nextQuestions: ['10th', '12th', 'College', 'Graduate'],
    },
    interest: {
      hinglish: 'Sabse zyada interest kis cheez me hai: tech, government job, business, design, medical, ya kuch aur?',
      hindi: 'Sabse zyada interest kis cheez me hai: tech, government job, business, design, medical, ya kuch aur?',
      english: 'What interests you most: tech, government jobs, business, design, medical, or something else?',
      nextQuestions: ['Tech', 'Government job', 'Business', 'Design'],
    },
  },
  career_switch: {
    current_role: {
      hinglish: 'Abhi tumhara current role kya hai?',
      hindi: 'Abhi aapka current role kya hai?',
      english: 'What is your current role?',
      nextQuestions: ['Developer', 'Student', 'Data role'],
    },
    target_field: {
      hinglish: 'Switch karke kis field me jana chahte ho?',
      hindi: 'Switch karke kis field me jana chahte hain?',
      english: 'Which field do you want to switch into?',
      nextQuestions: ['AI/ML', 'Cybersecurity', 'Cloud/DevOps'],
    },
  },
  roadmap: {
    goal: {
      hinglish: 'Roadmap kis goal ke liye chahiye?',
      hindi: 'Roadmap kis goal ke liye chahiye?',
      english: 'What goal do you need a roadmap for?',
      nextQuestions: ['Software developer', 'SSC', 'Cybersecurity'],
    },
  },
};

function field(value, confidence, source = 'message') {
  return { value, confidence, source };
}

function getPreviousGapState(history = []) {
  return [...history].reverse().find((msg) => msg.metadata?.mentorState)?.metadata?.mentorState || null;
}

function resolveIntent(detectedIntent = '', message = '', history = []) {
  const previous = getPreviousGapState(history);
  const text = normalizeEmotionText(message);
  const looksLikeShortAnswer = text.split(/\s+/).filter(Boolean).length <= 5;

  if (
    previous?.intent
    && previous?.missing?.length
    && ['general_guidance', 'small_talk'].includes(detectedIntent)
    && looksLikeShortAnswer
  ) {
    return previous.intent;
  }

  return detectedIntent;
}

function extractEducationEntity(message = '') {
  const text = normalizeEmotionText(message);
  const education = extractEducation(message);
  if (education && education !== 'unknown') return field(education, 95);
  if (/graduate|graduation|degree/.test(text)) return field('graduation', 95);
  if (/12th|barahvi|intermediate/.test(text)) return field('12th', 95);
  if (/10th|dasvi|matric/.test(text)) return field('10th', 95);
  return null;
}

function extractTargetExamEntity(message = '') {
  const text = normalizeEmotionText(message);
  if (/upsc|ias|ips|civil service/.test(text)) return field('UPSC', 95);
  if (/ssc|cgl|chsl|mts/.test(text)) return field('SSC', 95);
  if (/bank|banking|ibps|sbi|po|clerk/.test(text)) return field('Banking', 92);
  if (/railway|rrb|alp|ntpc/.test(text)) return field('Railway', 92);
  if (/police|constable|si\b|sub inspector/.test(text)) return field('Police', 90);
  if (/state psc|psc|pcs/.test(text)) return field('State PSC', 90);
  return null;
}

function extractInterestEntity(message = '') {
  const text = normalizeEmotionText(message);
  if (/government|govt|\bgov\b|sarkari|ssc|upsc|railway|banking/.test(text)) return field('government', 90);
  if (/tech|coding|software|developer|computer|it\b|ai|data|cyber|bca|btech|b\.tech|mca/.test(text)) return field('tech', 88);
  if (/business|startup|commerce|finance/.test(text)) return field('business', 86);
  if (/design|ui|ux|creative/.test(text)) return field('design', 86);
  if (/medical|doctor|neet|nursing/.test(text)) return field('medical', 88);
  return null;
}

function extractGoalEntity(message = '') {
  const text = normalizeEmotionText(message);
  const match = text.match(/(?:roadmap|plan|kaise|how to|become|banna|ban na)\s+(?:for|ke liye|ka|ki|a|an)?\s*([a-z0-9 +#./-]{3,50})/);
  return match ? field(match[1].trim(), 82) : null;
}

function extractRoleEntity(message = '') {
  const text = normalizeEmotionText(message);
  if (/frontend/.test(text)) return field('frontend developer', 88);
  if (/backend/.test(text)) return field('backend developer', 88);
  if (/full stack|mern/.test(text)) return field('full stack developer', 90);
  if (/software developer|software engineer|sde/.test(text)) return field('software developer', 88);
  if (/student|college|12th|10th|btech|bca/.test(text)) return field('student', 82);
  return null;
}

function extractTargetFieldEntity(message = '') {
  const text = normalizeEmotionText(message);
  if (/\bai\b|machine learning|\bml\b|data science/.test(text)) return field('AI/ML', 90);
  if (/cyber|security|hacking/.test(text)) return field('cybersecurity', 90);
  if (/cloud|devops|aws/.test(text)) return field('cloud/devops', 88);
  if (/product management|pm\b/.test(text)) return field('product management', 86);
  return null;
}

function extractEntities(intent = '', message = '') {
  const entities = {};
  const add = (key, entity) => {
    if (entity) entities[key] = entity;
  };

  const text = message.toLowerCase();

  // Dynamic target exam extraction based on text contents
  if (/\b(ssc|cgl|chsl)\b/i.test(text)) {
    entities.target_exam = field("SSC", 95, "dynamic_rule");
  } else if (/\b(upsc|ias|ips|civil service|civil services)\b/i.test(text)) {
    entities.target_exam = field("UPSC", 95, "dynamic_rule");
  } else if (/banking/i.test(text) || /\b(bank|po|ibps)\b/i.test(text)) {
    entities.target_exam = field("Banking", 95, "dynamic_rule");
  } else if (/railway/i.test(text) || /\b(rrb)\b/i.test(text)) {
    entities.target_exam = field("Railway", 95, "dynamic_rule");
  } else if (/police|constable/i.test(text)) {
    entities.target_exam = field("Police", 95, "dynamic_rule");
  }

  if (['government_job', 'career_confusion'].includes(intent)) {
    add('education', extractEducationEntity(message));
  }

  if (intent === 'government_job') {
    if (!entities.target_exam) {
      add('target_exam', extractTargetExamEntity(message));
    }
  }

  if (intent === 'career_confusion') {
    add('interest', extractInterestEntity(message));
  }

  if (intent === 'roadmap') {
    add('goal', extractGoalEntity(message));
  }

  if (intent === 'career_switch') {
    add('current_role', extractRoleEntity(message));
    add('target_field', extractTargetFieldEntity(message));
  }

  if (intent === 'government_job' && entities.target_exam && !entities.interest) {
    entities.interest = field('government', 86, 'derived');
  }

  return entities;
}

function entityToKnown(entities = {}) {
  return Object.entries(entities).reduce((known, [key, entity]) => {
    if (entity?.value && Number(entity.confidence || 0) >= CONFIDENCE_THRESHOLD) {
      known[key] = {
        value: entity.value,
        confidence: entity.confidence,
      };
    }
    return known;
  }, {});
}

function mergeKnown(previousKnown = {}, currentKnown = {}) {
  return { ...(previousKnown || {}), ...(currentKnown || {}) };
}

function mergeEntities(previousEntities = {}, currentEntities = {}) {
  return { ...(previousEntities || {}), ...(currentEntities || {}) };
}

function getAskedQuestions(previous = {}) {
  return Array.isArray(previous.askedQuestions) ? previous.askedQuestions : [];
}

function detectQueryType(message = '') {
  const text = message.toLowerCase();
  
  if (/\b(vs|versus|ya|or|difference|अंतर|compare|comparison|better|choose|choice|pros? and cons?|faide|nuksan)\b/.test(text)) {
    return 'comparison';
  }
  if (/\b(salary|package|ctc|pay|earning|income|paisa|kamata)\b/.test(text)) {
    return 'salary';
  }
  if (/\b(how to|kaise|step.?by.?step|process|tarika|learning path)\b/.test(text)) {
    return 'how_to';
  }
  if (/\b(switch|change|transition|shift)\b/.test(text)) {
    return 'career_switch';
  }
  if (/\b(roadmap|road map|plan|study plan)\b/.test(text)) {
    return 'roadmap';
  }
  if (/\b(exam|syllabus|eligibility|exam pattern|paper)\b/.test(text)) {
    return 'exam';
  }
  if (/\b(govt|government|sarkari|ssc|upsc|railway)\b/.test(text)) {
    return 'government_job';
  }
  if (/\b(college|university|admission|fees)\b/.test(text)) {
    return 'college';
  }
  return 'general';
}

function canGiveAdvice(intent = '', known = {}, queryType = 'general') {
  if (['comparison', 'salary', 'how_to'].includes(queryType)) {
    return true;
  }

  const getVal = (fieldName) => {
    const item = known[fieldName];
    return item && typeof item === 'object' ? item.value : item;
  };

  if (intent === 'government_job') {
    return Boolean(getVal('education') && getVal('target_exam'));
  }
  if (intent === 'career_switch') {
    return Boolean(getVal('current_role') && getVal('target_field'));
  }
  if (intent === 'roadmap') {
    return Boolean(getVal('goal'));
  }
  if (intent === 'career_confusion') {
    return Boolean(getVal('education') && getVal('interest'));
  }
  return true;
}

function hasEnoughInfo(intent = '', known = {}, queryType = 'general') {
  return canGiveAdvice(intent, known, queryType);
}

function buildQuestion(intent = '', fieldName = '', language = 'hinglish') {
  const config = QUESTION_COPY[intent]?.[fieldName];
  if (!config) {
    return {
      message: language === 'english'
        ? 'What is the most important detail I should know first?'
        : 'Sabse pehle ek important detail batao?',
      nextQuestions: [],
    };
  }

  return {
    message: config[language] || config.hinglish,
    nextQuestions: config.nextQuestions || [],
  };
}

function chooseCriticalUnknown(required = [], known = {}, askedQuestions = []) {
  const missing = required.filter((fieldName) => {
    const val = known[fieldName]?.value || known[fieldName];
    return !val;
  });
  return missing.find((fieldName) => !askedQuestions.includes(fieldName)) || '';
}

function buildReasoning({ intent = '', known = {}, criticalUnknown = '', canAnswerNow = false }) {
  const knownFacts = Object.entries(known)
    .map(([key, item]) => {
      const val = item && typeof item === 'object' ? item.value : item;
      return `${key}: ${val}`;
    });

  return {
    userGoal: intent,
    knownFacts,
    criticalUnknown,
    canAnswerNow,
    nextQuestion: canAnswerNow ? '' : criticalUnknown,
  };
}

function buildResponsePlan({ intent = '', canAnswerNow = false, criticalUnknown = '' }) {
  if (!canAnswerNow && criticalUnknown) {
    return { mode: 'ask_one_question' };
  }
  if (intent === 'roadmap') {
    return { mode: 'roadmap' };
  }
  return { mode: 'give_guidance' };
}

function buildMentorState({ message = '', detectedIntent = '', conversationHistory = [], userProfile = {}, language = 'hinglish' }) {
  const intent = resolveIntent(detectedIntent, message, conversationHistory);
  const previous = getPreviousGapState(conversationHistory);
  const sameIntent = previous?.intent === intent;
  const previousKnown = sameIntent ? previous.known || {} : {};
  const previousEntities = sameIntent ? previous.entities || {} : {};
  
  // Repetition Killer: collect all previously asked questions from history and userProfile
  const askedQuestionsSet = new Set();
  
  if (Array.isArray(conversationHistory)) {
    conversationHistory.forEach((msg) => {
      if (msg.metadata?.mentorState?.askedQuestions) {
        msg.metadata.mentorState.askedQuestions.forEach((q) => askedQuestionsSet.add(q));
      }
      if (msg.metadata?.mentorState?.criticalUnknown) {
        askedQuestionsSet.add(msg.metadata.mentorState.criticalUnknown);
      }
      if (msg.metadata?.conversationState?.nextBestQuestion) {
        askedQuestionsSet.add(msg.metadata.conversationState.nextBestQuestion);
      }
      if (msg.metadata?.askedQuestions) {
        msg.metadata.askedQuestions.forEach((q) => askedQuestionsSet.add(q));
      }
    });
  }

  if (Array.isArray(userProfile.askedQuestions)) {
    userProfile.askedQuestions.forEach((q) => askedQuestionsSet.add(q));
  }
  const previousAskedQuestions = Array.from(askedQuestionsSet);

  const entities = extractEntities(intent, message, userProfile);
  const currentKnown = entityToKnown(entities);
  
  // Initialize known from user profile memory
  const profileKnown = {};
  if (userProfile.education && userProfile.education !== 'unknown') {
    profileKnown.education = { value: userProfile.education, confidence: 95 };
  }
  if (userProfile.interests && userProfile.interests.length > 0) {
    const interestVal = Array.isArray(userProfile.interests) ? userProfile.interests[0] : userProfile.interests;
    if (interestVal && interestVal !== 'unknown') {
      profileKnown.interest = { value: interestVal, confidence: 95 };
    }
  }
  if (userProfile.currentRole && userProfile.currentRole !== '') {
    profileKnown.current_role = { value: userProfile.currentRole, confidence: 95 };
  }

  const known = {
    ...previousKnown,
    ...profileKnown,
    ...currentKnown,
  };
  const mergedEntities = mergeEntities(previousEntities, entities);
  const required = REQUIRED_FIELDS[intent] || [];
  
  const queryType = detectQueryType(message);
  const canAnswerNow = hasEnoughInfo(intent, known, queryType);
  const criticalUnknown = canAnswerNow ? '' : chooseCriticalUnknown(required, known, previousAskedQuestions);
  
  // Calculate missing fields
  const missing = required.filter((fieldName) => {
    const val = known[fieldName]?.value || known[fieldName];
    return !val;
  });

  const shouldAsk = Boolean(required.length && !canAnswerNow && criticalUnknown);
  const question = shouldAsk ? buildQuestion(intent, criticalUnknown, language) : null;
  
  const askedQuestions = shouldAsk
    ? Array.from(new Set([...previousAskedQuestions, criticalUnknown]))
    : previousAskedQuestions;

  const reasoning = buildReasoning({
    intent,
    known,
    criticalUnknown,
    canAnswerNow,
  });

  const responsePlan = buildResponsePlan({
    intent,
    canAnswerNow,
    criticalUnknown,
  });

  return {
    intent,
    queryType,
    entities: mergedEntities,
    known,
    missing,
    askedQuestions,
    criticalUnknown,
    nextBestQuestion: criticalUnknown,
    enoughInfo: canAnswerNow,
    canAnswerNow,
    shouldAsk,
    reasoning,
    responsePlan,
    localResponse: question ? {
      message: question.message,
      nextQuestions: question.nextQuestions,
    } : null,
    confidence: canAnswerNow ? 95 : 75,
  };
}

module.exports = {
  CONFIDENCE_THRESHOLD,
  REQUIRED_FIELDS,
  buildMentorState,
  extractEntities,
  entityToKnown,
  getPreviousGapState,
  hasEnoughInfo,
  resolveIntent,
};
