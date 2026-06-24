const { normalizeEmotionText } = require('./emotion.service');

const STAGES = [
  'problem_understanding',
  'clarification',
  'solution_suggestion',
  'action_plan',
  'follow_up',
];

const PROBLEMS = {
  salary: {
    label: 'low_salary',
    words: [
      'low salary',
      'salary low',
      'kam salary',
      'kam paise',
      'paise kam',
      'underpaid',
      'package kam',
      'ctc kam',
      'increment nahi',
      'hike nahi',
      'salary nahi badh',
    ],
    requiredSignals: ['experience', 'salary', 'switch'],
  },
  career_confusion: {
    label: 'career_confusion',
    words: ['kya karu', 'kya kru', 'confused', 'confusion', 'career samajh', 'option nahi', 'which career'],
    requiredSignals: ['education', 'interest'],
  },
  study_pressure: {
    label: 'study_pressure',
    words: ['study pressure', 'padhai stress', 'pressure', 'exam stress', 'marks pressure', 'padhai nahi ho'],
    requiredSignals: ['exam', 'timeline', 'blocker'],
  },
  job_search: {
    label: 'job_search',
    words: ['job nahi mil', 'job search', 'interview nahi', 'placement nahi', 'apply kiya', 'resume reject'],
    requiredSignals: ['role', 'applications', 'skills'],
  },
  government_job: {
    label: 'government_job',
    words: ['gov job', 'govt job', 'government job', 'sarkari naukri', 'sarkari job', 'ssc', 'upsc', 'railway', 'banking job'],
    requiredSignals: ['education', 'target_exam'],
  },
};

function latestConversationState(history = []) {
  return [...history].reverse().find((msg) => msg.metadata?.conversationState)?.metadata?.conversationState || null;
}

function includesAny(text, words = []) {
  return words.some((word) => text.includes(word));
}

function detectCareerTarget(message = '') {
  const text = normalizeEmotionText(message);
  if (/cyber|security|sequeity|ethical hack|hacking|soc analyst|penetration|pentest/.test(text)) return 'cybersecurity';
  if (/full stack|mern|mean/.test(text)) return 'full stack development';
  if (/frontend|react|ui developer/.test(text)) return 'frontend development';
  if (/backend|node|api developer/.test(text)) return 'backend development';
  if (/data science|machine learning|ai ml|data analyst/.test(text)) return 'data/AI';
  if (/cloud|devops|aws|azure/.test(text)) return 'cloud/devops';
  if (/digital marketing|seo|social media/.test(text)) return 'digital marketing';
  return '';
}

function isCareerGoalMessage(message = '') {
  const text = normalizeEmotionText(message);
  return Boolean(
    detectCareerTarget(text)
    || /jana chahta|jaana chahta|jana hai|jaana hai|me jana|mein jana|banna|ban na|career banana|field me/.test(text)
  );
}

function detectProblem(message = '', intent = '') {
  const text = normalizeEmotionText(message);

  for (const [key, config] of Object.entries(PROBLEMS)) {
    if (includesAny(text, config.words)) {
      return {
        key,
        label: config.label,
        requiredSignals: config.requiredSignals,
      };
    }
  }

  if (intent === 'career_confusion' && /confus|kya\s*karu|kya\s*kru|which career|career|option|best|better|choose|select|roadmap|kaise|how/.test(text)) {
    return {
      key: 'career_confusion',
      label: PROBLEMS.career_confusion.label,
      requiredSignals: PROBLEMS.career_confusion.requiredSignals,
    };
  }

  if (intent === 'government_job') {
    return {
      key: 'government_job',
      label: PROBLEMS.government_job.label,
      requiredSignals: PROBLEMS.government_job.requiredSignals,
    };
  }

  if (isCareerGoalMessage(message)) {
    return {
      key: 'career_confusion',
      label: PROBLEMS.career_confusion.label,
      requiredSignals: PROBLEMS.career_confusion.requiredSignals,
    };
  }

  if (intent === 'support' && /study|padhai|exam|marks/.test(text)) {
    return {
      key: 'study_pressure',
      label: PROBLEMS.study_pressure.label,
      requiredSignals: PROBLEMS.study_pressure.requiredSignals,
    };
  }

  return null;
}

function detectUserSituation(message = '', userProfile = {}) {
  const text = normalizeEmotionText(message);
  if (/job|salary|company|office|experience|exp|ctc|package|switch|interview/.test(text)) {
    return 'working_professional';
  }
  if (userProfile.education && userProfile.education !== 'unknown') return 'student';
  if (/class|school|college|exam|padhai|12th|10th|btech|bca|graduate/.test(text)) return 'student';
  return 'unknown';
}

function detectAnswerSignals(message = '', problemKey = '') {
  const text = normalizeEmotionText(message);
  const signals = new Set();
  const target = detectCareerTarget(message);

  if (/\b\d+(\.\d+)?\s*(year|yr|years|saal|mahine|month|months)\b/.test(text) || /\bfresher\b/.test(text)) {
    signals.add('experience');
  }
  if (/\b\d+(\.\d+)?\s*(k|lpa|lakh|lakhs|lac|lacs|ctc|rs|₹)\b/.test(text)) {
    signals.add('salary');
  }
  if (/switch|apply|interview|resume|naukri|linkedin|job portal|try kiya|try nahi/.test(text)) {
    signals.add('switch');
  }
  if (/10th|\b10\b|dasvi|matric|12th|\b12\b|barahvi|intermediate|graduate|graduation|degree|college|school|class/.test(text)) {
    signals.add('education');
  }
  // Clean 'computer science' and 'cse' from interest detection because they represent general education, not target options/interests.
  const cleanInterestText = text.replace(/computer science/g, '').replace(/\bcse\b/g, '');
  if (target || /interest|pasand|like|coding|design|marketing|business|teaching|medical|commerce|science|developer|full stack|frontend|backend|software|cyber|security|sequeity|hacking/.test(cleanInterestText)) {
    signals.add('interest');
  }
  if (/family|money|time|location|city|english|weak|problem|constraint|issue/.test(text)) {
    signals.add('constraint');
  }
  if (/jee|neet|exam|board|semester|test/.test(text)) {
    signals.add('exam');
  }
  if (/ssc|upsc|banking|bank|railway|police|state psc|psc/.test(text)) {
    signals.add('target_exam');
  }
  if (/month|week|din|date|deadline|attempt|next year|is saal/.test(text)) {
    signals.add('timeline');
  }
  if (/focus|time|backlog|concept|marks|fear|dar|stress|nahi ho/.test(text)) {
    signals.add('blocker');
  }
  if (/frontend|backend|full stack|developer|software|engineer|role|field|domain|profile/.test(text)) {
    signals.add('role');
  }
  if (/\b\d+\s*(apply|applied|application|companies|company)\b/.test(text) || /apply|applied/.test(text)) {
    signals.add('applications');
  }
  if (/skill|react|node|java|python|sql|project|dsa/.test(text)) {
    signals.add('skills');
  }

  const relevant = PROBLEMS[problemKey]?.requiredSignals || [];
  return relevant.filter((signal) => signals.has(signal));
}

function mergeSignals(previous = [], current = []) {
  return Array.from(new Set([...(previous || []), ...(current || [])]));
}

function chooseStage({ previousState, problem, signals }) {
  if (!problem) return 'follow_up';
  const signalCount = (signals || []).length;
  const requiredCount = problem.requiredSignals?.length || 3;

  if (signalCount >= requiredCount) return 'solution_suggestion';

  if (!previousState?.currentProblem || previousState.currentProblem !== problem.label) {
    if (signalCount > 0) return 'clarification';
    return 'problem_understanding';
  }

  if (previousState.stage === 'solution_suggestion') return 'action_plan';
  if (previousState.stage === 'action_plan') return 'follow_up';
  return 'clarification';
}

function buildClarifyingResponse(state, language = 'hinglish') {
  const isEnglish = language === 'english';
  const problem = state.problemKey;

  if (state.currentRole && state.experienceYears >= 2 && problem === 'career_confusion') {
    return isEnglish
      ? {
          message: `Bilkul ho sakta hai. Switch karna common hai after ${state.experienceYears} years of experience, but it depends on your goal.\n\nTo give you a human-like direction, tell me:\n1. What is your current tech stack?\n2. Are you switching for higher salary or interest/AI-related shift?\n3. Which field are you interested in: AI/ML, Cyber Security, Cloud/DevOps, Product Management, Data Engineering, or Blockchain?`,
          nextQuestions: ['AI/ML switch', 'Cloud/DevOps switch', 'Salary growth switch'],
        }
      : {
          message: `Bilkul ho sakta hai.\n\n${state.experienceYears} years experience ke baad switch karna common hai, lekin direction depend karti hai tumhara goal kya hai.\n\nCurrent stack kya hai?\n- MERN / Full Stack\n- Mobile Development\n- Java Backend\n- .NET\n- Other\n\nAur switch kis reason se karna chahte ho?\n- Higher salary\n- Better work-life balance\n- AI interest\n- Market demand\n- Remote jobs`,
          nextQuestions: ['AI interest', 'Higher salary', 'Better WLB'],
        };
  }

  if (problem === 'salary') {
    return isEnglish
      ? {
          message: "I get it. Feeling underpaid can be frustrating, especially when effort and salary do not match.\n\nBefore I suggest anything, help me understand 3 things:\n1. How much experience do you have?\n2. What is your current salary or CTC?\n3. Have you tried switching or negotiating yet?",
          nextQuestions: ['Share experience', 'Share current salary', 'Tried switching?'],
        }
      : {
          message: 'Samajh gaya bhai, tu underpaid feel kar raha hai. Ye genuinely frustrating hota hai jab effort aur salary match na kare.\n\nPehle thoda context samajhne de:\n1. Experience kitna hai?\n2. Current salary/CTC kitni hai?\n3. Switch ya negotiation try kiya hai ya nahi?',
          nextQuestions: ['Experience kitna hai?', 'Current salary kitni hai?', 'Switch try kiya?'],
        };
  }

  if (problem === 'study_pressure') {
    return isEnglish
      ? {
          message: 'I hear you. Study pressure can feel heavy, so let us first understand the real bottleneck before making a plan.\n\nTell me:\n1. Which exam/class is this for?\n2. How much time is left?\n3. What is the biggest blocker right now?',
          nextQuestions: ['Which exam?', 'Time left?', 'Main blocker?'],
        }
      : {
          message: 'Samajh raha hoon, padhai ka pressure heavy lag sakta hai. Plan dene se pehle real bottleneck samajhte hain.\n\nBas ye batao:\n1. Kaunsi class/exam ke liye pressure hai?\n2. Kitna time bacha hai?\n3. Sabse bada blocker kya hai?',
          nextQuestions: ['Kaunsi exam?', 'Kitna time bacha?', 'Main blocker?'],
        };
  }

  if (problem === 'job_search') {
    return isEnglish
      ? {
          message: 'Got it. Job search gets draining when effort is not converting. Before giving advice, I need the current picture.\n\nTell me:\n1. Which role are you targeting?\n2. Roughly how many applications/interviews so far?\n3. Which skills or projects are strongest on your resume?',
          nextQuestions: ['Target role?', 'Applications count?', 'Strongest skills?'],
        }
      : {
          message: 'Samajh gaya. Job search me effort ka result na aaye to demotivation hoti hai. Advice dene se pehle current picture chahiye.\n\nYe batao:\n1. Kaunsa role target kar rahe ho?\n2. Roughly kitni applications/interviews hue?\n3. Resume me strongest skills/projects kya hain?',
          nextQuestions: ['Target role?', 'Applications kitni?', 'Strong skills?'],
        };
  }

  return isEnglish
    ? {
        message: 'I understand. Before suggesting a path, I want to understand you properly.\n\nTell me:\n1. What is your current education/work situation?\n2. What options are you considering?\n3. What is your biggest constraint right now?',
        nextQuestions: ['Current situation?', 'Options?', 'Biggest constraint?'],
      }
    : {
        message: 'Samajh gaya. Direct solution dene se pehle main tera context properly samajhna chahta hoon.\n\nYe bata:\n1. Abhi education/work situation kya hai?\n2. Kaunse options consider kar raha hai?\n3. Sabse bada constraint kya hai?',
        nextQuestions: ['Current situation?', 'Options kya hain?', 'Biggest constraint?'],
      };
}

function buildDeeperResponse(state, language = 'hinglish') {
  const isEnglish = language === 'english';
  const missing = (state.requiredSignals || []).filter((signal) => !(state.knownSignals || []).includes(signal));
  const label = {
    experience: isEnglish ? 'your experience' : 'experience kitna hai',
    salary: isEnglish ? 'current salary/CTC' : 'current salary/CTC',
    switch: isEnglish ? 'switching or negotiation attempts' : 'switch/negotiation try kiya ya nahi',
    education: isEnglish ? 'current education' : 'current education',
    interest: isEnglish ? 'interests/subjects you like' : 'interest ya subjects jo pasand hain',
    constraint: isEnglish ? 'biggest constraint' : 'sabse bada constraint',
    exam: isEnglish ? 'exam/class name' : 'exam/class ka naam',
    timeline: isEnglish ? 'time left' : 'kitna time bacha hai',
    blocker: isEnglish ? 'main blocker' : 'main blocker',
    role: isEnglish ? 'target role' : 'target role',
    applications: isEnglish ? 'applications/interviews count' : 'applications/interviews count',
    skills: isEnglish ? 'strongest skills/projects' : 'strongest skills/projects',
  };
  const questions = missing.slice(0, 2).map((signal) => label[signal] || signal);

  if (state.problemKey === 'career_confusion' && state.target && missing.includes('education')) {
    return {
      message: isEnglish
        ? `Got it, you want to move into ${state.target}. Good direction.\n\nTo give the right path, tell me your current level: are you in 10th/12th, college, graduated, or already working?`
        : `Samajh gaya, tum ${state.target} me jana chahte ho. Direction clear hai.\n\nSahi roadmap dene ke liye bas current level batao: 10th/12th me ho, college me ho, graduate ho, ya already working?`,
      nextQuestions: isEnglish
        ? ['10th/12th', 'College', 'Working']
        : ['10th/12th', 'College', 'Already working'],
    };
  }

  return {
    message: isEnglish
      ? `Good, that helps. I am starting to see the situation.\n\nBefore I suggest the strategy, tell me ${questions.join(' and ')}. Then I can give you a practical answer instead of a generic one.`
      : `Achha, ye useful context hai. Situation thodi clear ho rahi hai.\n\nStrategy suggest karne se pehle ${questions.join(' aur ')} bata de. Phir main generic nahi, practical answer dunga.`,
    nextQuestions: questions,
  };
}

function buildConversationState({ message, intent, analysis = {}, userProfile = {}, conversationHistory = [], language = 'hinglish' }) {
  const previousState = latestConversationState(conversationHistory);
  const target = detectCareerTarget(message) || previousState?.target || '';
  const detectedProblem = detectProblem(message, intent) || (previousState?.problemKey ? {
    key: previousState.problemKey,
    label: previousState.currentProblem,
    requiredSignals: previousState.requiredSignals || PROBLEMS[previousState.problemKey]?.requiredSignals || [],
  } : null);
  const currentSignals = detectedProblem ? detectAnswerSignals(message, detectedProblem.key) : [];
  
  // Initialize known signals from user profile permanent memory
  const profileSignals = [];
  if (userProfile.education && userProfile.education !== 'unknown') {
    profileSignals.push('education');
  }
  if (userProfile.interests && userProfile.interests.length > 0) {
    profileSignals.push('interest');
  }
  if (userProfile.currentRole && userProfile.currentRole !== '') {
    profileSignals.push('role');
  }
  if (userProfile.experienceYears && userProfile.experienceYears > 0) {
    profileSignals.push('experience');
  }

  const knownSignals = mergeSignals(
    mergeSignals(previousState?.knownSignals, profileSignals),
    currentSignals
  );
  
  let stage = chooseStage({ previousState, problem: detectedProblem, signals: knownSignals });
  
  // experienced clarification override: if the user is experienced but has no clear target career, force clarification stage.
  const isExperiencedUser = (userProfile.currentRole && userProfile.experienceYears >= 2);
  if (isExperiencedUser && !target && detectedProblem?.key === 'career_confusion') {
    stage = 'clarification';
  }

  const emotion = analysis?.emotion || {};
  const needsMentorClarification = Boolean(
    detectedProblem
    && !emotion.needsImmediateSafety
    && ['problem_understanding', 'clarification'].includes(stage)
  );

  const state = {
    stage,
    stages: STAGES,
    userSituation: detectUserSituation(message, userProfile),
    currentProblem: detectedProblem?.label || previousState?.currentProblem || '',
    problemKey: detectedProblem?.key || previousState?.problemKey || '',
    target,
    emotion: emotion.mood || 'neutral',
    intent,
    knownSignals,
    requiredSignals: detectedProblem?.requiredSignals || previousState?.requiredSignals || [],
    needsMentorClarification,
    tone: emotion.needsSupport || emotion.mood === 'frustrated' ? 'understanding + practical' : 'warm + practical',
    experienceYears: userProfile.experienceYears || 0,
    currentRole: userProfile.currentRole || '',
  };

  if (needsMentorClarification) {
    state.localResponse = (stage === 'problem_understanding' || !knownSignals.length) || (isExperiencedUser && !target)
      ? buildClarifyingResponse(state, language)
      : buildDeeperResponse(state, language);
  }

  return state;
}

module.exports = {
  STAGES,
  PROBLEMS,
  buildConversationState,
  detectCareerTarget,
  detectProblem,
};
