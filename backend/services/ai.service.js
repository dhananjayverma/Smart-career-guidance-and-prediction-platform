const { getCareerSuggestions } = require('./career.service');
const { createRoadmap } = require('./roadmap.service');
const { askAI, streamAI } = require('./aiProvider');
const { executeMentorRequest, executeMentorStream } = require('./mentorPipeline.service');
const { getStaticResponse } = require('./templateEngine.service');
const { parseAiResponse, extractStreamingMessagePreview } = require('../utils/aiResponseParser');
const {
  buildCareerPrompt,
  buildSystemPrompt,
  extractCareerTarget,
  isCareerIntent,
} = require('../utils/promptBuilder');
const { formatCareerResponse } = require('../utils/responseFormatter');
const { retrieveRelevantContext } = require('./rag.service');

const MAX_CONTEXT_CHARS = 2000;

function normalizeRoadmapMilestones(milestones = []) {
  return milestones.map((milestone) => ({
    title: milestone.title,
    duration: milestone.duration,
    tasks: (milestone.tasks || []).map((task) => (
      typeof task === 'string' ? task : task.title || String(task)
    )),
  }));
}

function formatRoadmapMessage(roadmap, careerTitle, language) {
  const isEnglish = language === 'english';
  const header = isEnglish
    ? `Here is your complete roadmap to become a ${careerTitle}:`
    : `Yeh raha ${careerTitle} ka complete step-by-step roadmap:`;

  const phases = roadmap.map((phase, index) => {
    const tasks = phase.tasks.map((task) => `  • ${task}`).join('\n');
    return `${index + 1}. ${phase.title} (${phase.duration})\n${tasks}`;
  }).join('\n\n');

  return `${header}\n\n${phases}`;
}

function buildStateStrategyResponse({ conversationState = {}, behavior = {}, language = 'hinglish', userProfile = {} }) {
  const isEnglish = language === 'english';
  const problem = conversationState.problemKey;
  const target = conversationState.target;
  const userName = userProfile.name ? `${userProfile.name}, ` : '';
  const mode = behavior.mode || (conversationState.stage === 'action_plan' ? 'PLAN' : 'GUIDE');

  if (!['solution_suggestion', 'action_plan'].includes(conversationState.stage) && mode !== 'PLAN') {
    return null;
  }

  if (problem === 'salary') {
    return {
      message: isEnglish
        ? `${userName}now the situation is clear: you are feeling underpaid, so the best move is not random applying. Use a focused salary-growth plan.\n\n1. Resume: rewrite projects with measurable impact, tech stack, scale, and business result.\n2. Skill upgrade: add backend depth, system design basics, testing, TypeScript/Next.js, and one deployment story.\n3. Market check: compare your CTC with similar roles, then shortlist 20 realistic companies.\n4. Switch pipeline: apply to 8-12 targeted roles weekly and track callbacks.\n5. Negotiation: negotiate after offers; avoid quoting desperation, quote market value and impact.\n\nNext best step: share your experience + CTC + target role, and I can make a sharper 30-day switch plan.`
        : `${userName}ab situation clear hai: tu underpaid feel kar raha hai, isliye random apply nahi, focused salary-growth plan chahiye.\n\n1. Resume: projects ko measurable impact, tech stack, scale aur result ke saath rewrite kar.\n2. Skill upgrade: backend depth, system design basics, testing, TypeScript/Next.js aur ek deployed project story add kar.\n3. Market check: apni CTC ko similar roles se compare kar, phir 20 realistic companies shortlist kar.\n4. Switch pipeline: weekly 8-12 targeted roles par apply kar aur callbacks track kar.\n5. Negotiation: offer ke baad negotiate kar; desperation nahi, market value aur impact quote kar.\n\nNext best step: experience + CTC + target role bata de, main 30-day switch plan aur sharper bana dunga.`,
      nextQuestions: isEnglish
        ? ['Make 30-day switch plan', 'Improve resume bullets', 'Interview prep plan']
        : ['30-day switch plan banao', 'Resume bullets improve karo', 'Interview prep plan'],
      recommendation: 'salary_growth_plan',
    };
  }

  if (problem === 'job_search') {
    return {
      message: isEnglish
        ? `${userName}job search needs diagnosis, not just more applications.\n\n1. Fix targeting: choose one role and one resume version for it.\n2. Proof: add 2 strong projects with live links, GitHub, and impact bullets.\n3. Applications: send fewer but better applications, with referrals where possible.\n4. Interview loop: revise role-specific fundamentals and do 2 mocks weekly.\n5. Tracking: mark every application as applied, rejected, interview, or follow-up.\n\nIf callbacks are low, resume/targeting is the issue. If interviews fail, prep/storytelling is the issue.`
        : `${userName}job search me sirf aur applications nahi, diagnosis chahiye.\n\n1. Targeting fix: ek role choose kar aur uske liye ek focused resume version bana.\n2. Proof: 2 strong projects add kar live link, GitHub aur impact bullets ke saath.\n3. Applications: kam but better applications bhej, referrals priority par.\n4. Interview loop: role-specific fundamentals revise kar aur weekly 2 mocks kar.\n5. Tracking: har application ko applied, rejected, interview, ya follow-up me track kar.\n\nCallbacks low hain to resume/targeting issue hai. Interviews fail ho rahe hain to prep/storytelling issue hai.`,
      nextQuestions: isEnglish ? ['Review my resume plan', 'Target role help', 'Mock interview plan'] : ['Resume plan review', 'Target role help', 'Mock interview plan'],
      recommendation: 'job_search_diagnosis',
    };
  }

  if (problem === 'study_pressure') {
    return {
      message: isEnglish
        ? `${userName}let us reduce the pressure into a small system.\n\n1. List only the chapters/topics that matter for the next test.\n2. Study in 45-minute blocks: concept, examples, then questions.\n3. Keep one daily revision slot for weak topics.\n4. Do not chase perfect notes; chase solved questions.\n5. Every night, write tomorrow's 3 tasks only.\n\nStart with the easiest high-mark topic today so momentum comes back.`
        : `${userName}pressure ko ek small system me todte hain.\n\n1. Sirf next test ke important chapters/topics list kar.\n2. 45-minute blocks me padh: concept, examples, phir questions.\n3. Weak topics ke liye daily ek revision slot rakh.\n4. Perfect notes ke peeche mat bhaag; solved questions ke peeche ja.\n5. Har raat sirf kal ke 3 tasks likh.\n\nAaj easiest high-mark topic se start kar, momentum wapas aayega.`,
      nextQuestions: isEnglish ? ['Make study timetable', 'Fix focus problem', 'Revision plan'] : ['Study timetable banao', 'Focus problem fix', 'Revision plan'],
      recommendation: 'study_pressure_plan',
    };
  }

  if (problem === 'career_confusion' || target) {
    return {
      message: isEnglish
        ? `${userName}${target ? `${target} is a clear direction.` : 'your career direction is becoming clearer.'} Use this decision filter:\n\n1. Fit: does the field match your interest and patience level?\n2. Proof: can you build one small project or portfolio sample in 2 weeks?\n3. Market: are there internships/jobs around this skill?\n4. Plan: learn foundation first, then one practical project, then applications.\n\nDo not choose only by hype. Choose the path where you can show proof of skill fastest.`
        : `${userName}${target ? `${target} direction clear lag raha hai.` : 'career direction ab thodi clear ho rahi hai.'} Is decision filter se choose kar:\n\n1. Fit: kya field interest aur patience level se match karti hai?\n2. Proof: kya 2 weeks me ek small project/portfolio sample bana sakta hai?\n3. Market: kya is skill ke internships/jobs available hain?\n4. Plan: pehle foundation, phir practical project, phir applications.\n\nSirf hype se choose mat kar. Wo path choose kar jahan skill ka proof fastest dikha sake.`,
      nextQuestions: isEnglish ? ['Make roadmap', 'Compare options', 'Project ideas'] : ['Roadmap banao', 'Options compare karo', 'Project ideas'],
      recommendation: target || 'career_decision_filter',
    };
  }

  return null;
}

function buildFullRoadmapContext(message, careerData, intent, userProfile = {}) {
  if (intent !== 'roadmap' && !/roadmap|road map|step.?by.?step|kaise banu|how to become|study plan|learning path/i.test(message)) {
    return null;
  }

  const careerTitle = extractCareerTarget(message, careerData);
  const experienceYears = userProfile.experienceYears || 0;
  const roadmapData = createRoadmap(careerTitle, experienceYears);
  const milestones = normalizeRoadmapMilestones(
    roadmapData.milestones.map((m) => ({
      title: m.title,
      duration: m.duration,
      tasks: m.tasks.map((t) => t.title || t),
    }))
  );

  return {
    title: roadmapData.title,
    totalDuration: roadmapData.totalDuration,
    skills: roadmapData.skills,
    milestones,
  };
}

function createFallbackAnswer(input) {
  const {
    message,
    language,
    intent,
    careerData = [],
    analysis,
    userProfile = {},
    fullRoadmap = null,
    conversationState = {},
    behavior = {},
    mentorState = {},
  } = input;
  const isEnglish = language === 'english';
  const userName = userProfile.name ? `${userProfile.name}, ` : '';
  const emotion = analysis?.emotion || {};
  const learnedBranch = userProfile.preferredBranch ? ` (${userProfile.preferredBranch})` : '';

  if (intent === 'greeting') {
    return formatCareerResponse({
      message: isEnglish
        ? `Hello ${userName}I'm NextStep AI, your career mentor. What would you like to talk about today?`
        : `Namaste ${userName}Main NextStep AI hoon. Aaj kis cheez me help chahiye?`,
      options: [],
      roadmap: [],
      recommendation: '',
      nextQuestions: [isEnglish ? 'What class are you in?' : 'Aap kaunsi class me ho?'],
      metadata: { aiMode: 'local-engine', provider: 'local' },
    });
  }

  if (conversationState?.needsMentorClarification && conversationState.localResponse) {
    return formatCareerResponse({
      message: conversationState.localResponse.message,
      options: [],
      roadmap: [],
      recommendation: '',
      nextQuestions: conversationState.localResponse.nextQuestions || [],
      metadata: {
        aiMode: 'conversation-state-engine',
        provider: 'local',
        conversationStage: conversationState.stage,
        problem: conversationState.currentProblem,
        behaviorMode: behavior.mode || 'ASK',
      },
    });
  }

  const stateStrategy = buildStateStrategyResponse({
    conversationState,
    behavior,
    language,
    userProfile,
  });

  if (stateStrategy) {
    return formatCareerResponse({
      message: stateStrategy.message,
      options: [],
      roadmap: [],
      recommendation: stateStrategy.recommendation,
      nextQuestions: stateStrategy.nextQuestions,
      metadata: {
        aiMode: 'conversation-state-engine',
        provider: 'local',
        conversationStage: conversationState.stage,
        problem: conversationState.currentProblem,
        behaviorMode: behavior.mode || 'GUIDE',
      },
    });
  }

  if (!isCareerIntent(intent)) {
    const supportive = intent === 'support' || emotion.needsSupport;
    const safety = emotion.needsImmediateSafety;
    return formatCareerResponse({
      message: safety
        ? (isEnglish
          ? `${userName}I'm really glad you told me. Please do not stay alone right now. Call someone you trust immediately, and if you may hurt yourself, contact local emergency support now. Tell me only one thing: are you safe at this moment?`
          : `${userName}achha ki tumne bataya. Abhi please akela mat raho. Kisi trusted person ko turant call karo, aur agar khud ko harm karne ka risk hai to local emergency help lo. Bas ek cheez batao: kya tum abhi safe ho?`)
        : supportive
        ? (isEnglish
          ? `${userName}I hear you. It sounds heavy right now, and your feeling is valid. We can slow it down. What is troubling you most: career confusion, study pressure, family pressure, or something else?`
          : `${userName}samajh raha hoon, abhi pressure heavy lag raha hoga. Pehle isko simple karte hain. Sabse zyada pareshaani kis cheez ki hai: career confusion${learnedBranch}, study pressure, family pressure, ya kuch aur?`)
        : (isEnglish ? `I can help with: "${message}".` : `Main help kar sakta hoon: "${message}".`),
      options: [],
      roadmap: [],
      recommendation: '',
      nextQuestions: supportive && !safety
        ? [
            isEnglish ? 'Career confusion' : 'Career confusion',
            isEnglish ? 'Study pressure' : 'Study pressure',
            isEnglish ? 'Family pressure' : 'Family pressure',
          ]
        : [],
      metadata: { aiMode: 'local-engine', provider: 'local', behaviorMode: behavior.mode },
    });
  }

  if (intent === 'government_job') {
    const targetExam = mentorState.known?.target_exam || conversationState.known?.target_exam || '';
    const knownEducation = mentorState.known?.education || conversationState.known?.education || '';

    if (mentorState.enoughInfo && targetExam) {
      return formatCareerResponse({
        message: isEnglish
          ? `${targetExam} is a practical government-job target for your level${knownEducation ? ` (${knownEducation})` : ''}.\n\n1. Syllabus: first finish the official syllabus and previous-year paper pattern.\n2. Daily routine: 2 hours concepts, 1 hour practice, 30 minutes revision.\n3. Mock tests: start sectional mocks after basics, then one full mock weekly.\n4. Current affairs: 20-30 minutes daily if your exam needs GK/current affairs.\n5. Timeline: give yourself 6-12 focused months instead of switching between exams.\n\nStart with one previous-year paper today so you know the real level.`
          : `${targetExam} tumhare liye practical government-job target ho sakta hai${knownEducation ? ` (${knownEducation})` : ''}.\n\n1. Syllabus: pehle official syllabus aur previous-year paper pattern clear karo.\n2. Daily routine: 2 hours concepts, 1 hour practice, 30 minutes revision.\n3. Mock tests: basics ke baad sectional mocks, phir weekly ek full mock.\n4. Current affairs: exam me GK/current affairs hai to daily 20-30 minutes.\n5. Timeline: 6-12 months focused preparation rakho, exams ke beech jump mat karo.\n\nAaj ek previous-year paper solve/scan karo, real level samajh aa jayega.`,
        options: [],
        roadmap: [],
        recommendation: `${targetExam} focused preparation`,
        nextQuestions: isEnglish
          ? ['Make weekly timetable', 'Syllabus breakdown', 'Best books/resources']
          : ['Weekly timetable banao', 'Syllabus breakdown', 'Books/resources'],
        metadata: { aiMode: 'local-engine', provider: 'local', behaviorMode: behavior.mode },
      });
    }

    return formatCareerResponse({
      message: isEnglish
        ? `${userName}got it. You want to prepare for a government job.\n\nFirst tell me 2 things:\n1. Are you 12th pass, graduate, or still studying?\n2. Which government job type interests you most: SSC, Banking, Railway, UPSC, Police, or State PSC?\n\nThen I can give you the exact preparation strategy.`
        : `${userName}samajh gaya. Tum government job ke liye prepare karna chahte ho.\n\nBas 2 cheezein batao:\n1. 12th pass ho, graduate ho, ya abhi studying?\n2. Kis type ki govt job me interest hai: SSC, Banking, Railway, UPSC, Police, ya State PSC?\n\nPhir main exact preparation strategy bataunga.`,
      options: [],
      roadmap: [],
      recommendation: '',
      nextQuestions: isEnglish
        ? ['12th pass', 'Graduate', 'Choose exam type']
        : ['12th pass', 'Graduate', 'Exam type choose karna hai'],
      metadata: { aiMode: 'local-engine', provider: 'local', behaviorMode: behavior.mode },
    });
  }

  if (intent === 'roadmap' && fullRoadmap) {
    const roadmap = fullRoadmap.milestones;
    return formatCareerResponse({
      message: formatRoadmapMessage(roadmap, fullRoadmap.title, language),
      options: [],
      roadmap,
      recommendation: isEnglish ? `Start with: "${roadmap[0]?.title}".` : `Shuru karo: "${roadmap[0]?.title}".`,
      nextQuestions: [],
      metadata: { aiMode: 'local-engine', provider: 'local', behaviorMode: behavior.mode },
    });
  }

  const options = careerData.slice(0, 3).map((career) => ({
    name: career.title,
    duration: career.duration,
    salary: career.salary,
    difficulty: career.difficulty,
    pros: career.pros,
    cons: career.cons,
    skills: career.skills,
  }));

  const bestPath = analysis?.decision?.bestPath;

  return formatCareerResponse({
    message: bestPath
      ? (isEnglish
        ? `${bestPath.title} looks like your strongest path (~${bestPath.outcome.successProbability}% match).`
        : `${bestPath.title} sabse strong path lag raha hai.`)
      : (isEnglish ? 'Here are practical career options for you.' : 'Yeh practical career options hain.'),
    options,
    roadmap: [],
    recommendation: bestPath?.title || careerData[0]?.title || '',
    nextQuestions: [isEnglish ? 'Want a full roadmap?' : 'Full roadmap chahiye?'],
    metadata: { aiMode: 'local-engine', provider: 'local', analysis, behaviorMode: behavior.mode },
  });
}

function buildChatMessages(input) {
  const conversationHistory = input.conversationHistory || [];
  const hasHistory = conversationHistory.length > 0;

  const history = conversationHistory
    .slice(-5)
    .map((turn) => ({
      role: turn.role === 'assistant' ? 'assistant' : 'user',
      content: String(turn.content || '').slice(0, 280),
    }))
    .filter((turn) => turn.content);

  const systemPrompt = buildSystemPrompt(input);
  let userPrompt = buildCareerPrompt({
    ...input,
    hasHistory,
    sessionSummary: input.sessionSummary,
    context: input.promptContext,
  });

  if (userPrompt.length > MAX_CONTEXT_CHARS) {
    userPrompt = userPrompt.slice(0, MAX_CONTEXT_CHARS);
  }

  const summaryBlock = !hasHistory && input.sessionSummary
    ? [{ role: 'system', content: `Session summary: ${input.sessionSummary.slice(0, 300)}` }]
    : [];

  return [
    { role: 'system', content: systemPrompt },
    ...summaryBlock,
    ...history,
    { role: 'user', content: userPrompt },
  ];
}

function mergeRoadmapIntoResponse(formatted, fullRoadmap, intent) {
  if (!fullRoadmap || intent !== 'roadmap') return formatted;

  const aiRoadmap = Array.isArray(formatted.roadmap) && formatted.roadmap.length
    ? formatted.roadmap
    : fullRoadmap.milestones;

  return {
    ...formatted,
    roadmap: normalizeRoadmapMilestones(aiRoadmap),
    message: formatted.message || formatRoadmapMessage(fullRoadmap.milestones, fullRoadmap.title, 'hinglish'),
  };
}

function shouldUseGuardedFallback(input = {}) {
  const emotion = input.analysis?.emotion || {};
  return Boolean(emotion.needsImmediateSafety);
}

function finalizeResponse(raw, input, fallback) {
  if (fallback?.message && shouldUseGuardedFallback(input)) {
    return formatCareerResponse({
      ...fallback,
      metadata: {
        ...(fallback.metadata || {}),
        pipeline: 'local-guard',
        guardedReason: input.behavior?.reason || 'mentor state requires controlled reply',
      },
    }, fallback);
  }

  let formatted = formatCareerResponse(raw, fallback);
  formatted = mergeRoadmapIntoResponse(formatted, input.fullRoadmap, input.intent);

  if (!isCareerIntent(input.intent)) {
    return {
      ...formatted,
      options: formatted.options?.length ? formatted.options : [],
      roadmap: input.intent === 'roadmap' ? formatted.roadmap : [],
      recommendation: formatted.recommendation || '',
    };
  }

  return formatted;
}

function prepareInput(input) {
  const careerMode = isCareerIntent(input.intent);
  const careerData = careerMode
    ? (input.careerData.length ? input.careerData : getCareerSuggestions({ education: input.education, interest: input.message }))
    : [];
  const fullRoadmap = buildFullRoadmapContext(input.message, careerData, input.intent, input.userProfile);

  return {
    ...input,
    careerData,
    fullRoadmap,
    userProfile: input.userProfile || {},
    fallback: createFallbackAnswer({ ...input, careerData, fullRoadmap }),
    promptContext: {
      careers: careerData,
      exams: careerMode ? input.examData?.slice(0, 2) : [],
      colleges: careerMode ? input.collegeData?.slice(0, 2) : [],
      fullRoadmap: fullRoadmap || undefined,
      retrievedDocuments: input.ragDocuments || [],
    },
  };
}

function buildRagQuery(input = {}) {
  return [
    input.message,
    input.intent,
    input.understanding?.problem,
    input.understanding?.target,
    input.conversationState?.currentProblem,
    input.userProfile?.preferredBranch,
    ...(Array.isArray(input.userProfile?.interests) ? input.userProfile.interests : []),
  ].filter(Boolean).join(' ');
}

async function generateCareerAdvice(input) {
  const rag = await retrieveRelevantContext(buildRagQuery(input), 3);
  const prepared = prepareInput({
    ...input,
    ragDocuments: rag.documents,
    analysis: { ...(input.analysis || {}), ragMode: rag.mode },
  });

  return executeMentorRequest({
    input: prepared,
    buildFallback: () => prepared.fallback || getStaticResponse({ language: prepared.language }),
    getAiResponse: async (ctx) => {
      const messages = buildChatMessages(ctx);
      const aiResult = await askAI({ messages });
      if (!aiResult) return null;

      const response = finalizeResponse(aiResult, ctx, ctx.fallback);
      return {
        ...response,
        metadata: {
          ...response.metadata,
          ...aiResult.metadata,
          pipeline: response.metadata?.pipeline || 'ai',
        },
      };
    },
  });
}

async function generateCareerAdviceStream(input, { onDelta, onDone }) {
  const rag = await retrieveRelevantContext(buildRagQuery(input), 3);
  const prepared = prepareInput({
    ...input,
    ragDocuments: rag.documents,
    analysis: { ...(input.analysis || {}), ragMode: rag.mode },
  });

  return executeMentorStream({
    input: prepared,
    buildFallback: () => prepared.fallback || getStaticResponse({ language: prepared.language }),
    onDelta,
    onDone,
    streamAiResponse: async (ctx, emitDelta) => {
      const messages = buildChatMessages(ctx);
      let fullText = '';
      let lastPreview = '';

      await streamAI({
        messages,
        onDelta: (chunk) => {
          fullText += chunk;
          const preview = extractStreamingMessagePreview(fullText);
          if (preview && preview.length > lastPreview.length) {
            lastPreview = preview;
            emitDelta(preview);
          }
        },
      });

      const parsed = parseAiResponse(fullText);
      const response = finalizeResponse(parsed, ctx, ctx.fallback);

      if (response.message && response.message !== lastPreview) {
        emitDelta(response.message);
      }

      return {
        ...response,
        metadata: {
          ...response.metadata,
          pipeline: response.metadata?.pipeline || 'ai-stream',
          provider: 'groq',
        },
      };
    },
  });
}

module.exports = {
  generateCareerAdvice,
  generateCareerAdviceStream,
};
