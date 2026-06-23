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

function buildFullRoadmapContext(message, careerData, intent) {
  if (intent !== 'roadmap' && !/roadmap|road map|step.?by.?step|kaise banu|how to become|study plan|learning path/i.test(message)) {
    return null;
  }

  const careerTitle = extractCareerTarget(message, careerData);
  const roadmapData = createRoadmap(careerTitle);
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
  } = input;
  const isEnglish = language === 'english';
  const userName = userProfile.name ? `${userProfile.name}, ` : '';
  const emotion = analysis?.emotion || {};

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

  if (!isCareerIntent(intent)) {
    const supportive = intent === 'support' || emotion.needsSupport;
    return formatCareerResponse({
      message: supportive
        ? (isEnglish
          ? "I hear you. What you're feeling is valid. Tell me what's going on."
          : 'Main samajh sakta hoon. Jo feel kar rahe ho valid hai. Batao kya ho raha hai?')
        : (isEnglish ? `I can help with: "${message}".` : `Main help kar sakta hoon: "${message}".`),
      options: [],
      roadmap: [],
      recommendation: '',
      nextQuestions: [],
      metadata: { aiMode: 'local-engine', provider: 'local' },
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
      metadata: { aiMode: 'local-engine', provider: 'local' },
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
    metadata: { aiMode: 'local-engine', provider: 'local', analysis },
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

function finalizeResponse(raw, input, fallback) {
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
  const fullRoadmap = buildFullRoadmapContext(input.message, careerData, input.intent);

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

async function generateCareerAdvice(input) {
  const rag = await retrieveRelevantContext(input.message, 2);
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
          pipeline: 'ai',
        },
      };
    },
  });
}

async function generateCareerAdviceStream(input, { onDelta, onDone }) {
  const rag = await retrieveRelevantContext(input.message, 2);
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
          pipeline: 'ai-stream',
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
