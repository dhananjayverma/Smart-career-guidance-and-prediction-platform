const env = require('../config/env');
const { getCareerSuggestions } = require('./career.service');
const { createRoadmap } = require('./roadmap.service');
const { buildCareerPrompt, isCareerIntent } = require('../utils/promptBuilder');
const { formatCareerResponse } = require('../utils/responseFormatter');
const { retrieveRelevantContext } = require('./rag.service');

function parseAiJson(content = '{}') {
  const raw = typeof content === 'string' ? content.trim() : JSON.stringify(content);
  const withoutFence = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch (error) {
    const start = withoutFence.indexOf('{');
    const end = withoutFence.lastIndexOf('}');

    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(withoutFence.slice(start, end + 1));
    }

    throw error;
  }
}

function createSmallTalkAnswer({ intent, language }) {
  const isEnglish = language === 'english';
  const message = intent === 'greeting'
    ? (isEnglish
      ? 'Hi! I am NextStep AI, your career mentor. Tell me your class, stream, interest, or confusion and I will guide you step by step.'
      : 'Hi! Main NextStep AI hoon, aapka career mentor. Apni class, stream, interest ya confusion batao, main step-by-step guide karunga.')
    : (isEnglish
      ? 'Got it. Ask me anything about careers, exams, colleges, skills, or roadmaps.'
      : 'Samajh gaya. Career, exam, college, skills ya roadmap ke baare me kuch bhi pooch sakte ho.');

  return formatCareerResponse({
    message,
    options: [],
    roadmap: [],
    recommendation: '',
    nextQuestions: [
      'Aap abhi kaunsi class ya course me ho?',
      'Aapko tech, government, medical, commerce ya business me kya pasand hai?',
      'Aapka main confusion kya hai?',
    ],
    metadata: { aiMode: 'rule-based' },
  });
}

function createFallbackAnswer({ message, language, education, intent, careerData, examData, collegeData, analysis }) {
  if (!isCareerIntent(intent)) {
    const isEnglish = language === 'english';
    const supportive = intent === 'support';

    return formatCareerResponse({
      message: supportive
        ? (isEnglish
          ? 'I hear you. It sounds like you are feeling stressed right now. Take one slow breath, drink some water, and tell me what happened. I am here with you.'
          : 'Main samajh raha hoon. Aap abhi stressed ya pareshan feel kar rahe ho. Ek slow breath lo, thoda paani piyo, aur batao kya hua. Main yahin hoon.')
        : (isEnglish
          ? `I can help with that. Tell me a little more about: "${message}".`
          : `Haan, main help kar sakta hoon. Thoda aur batao: "${message}".`),
      options: [],
      roadmap: [],
      recommendation: '',
      nextQuestions: supportive
        ? ['Kya hua?', 'Ye feeling kab se ho rahi hai?', 'Aap abhi safe ho?']
        : ['Aap exactly kya samajhna chahte ho?', 'Short answer chahiye ya detail me?', 'Hindi, Hinglish ya English?'],
      metadata: { aiMode: 'local-fallback' },
    });
  }

  const options = careerData.slice(0, 4).map((career) => ({
    name: career.title,
    duration: career.duration,
    salary: career.salary,
    difficulty: career.difficulty,
    pros: career.pros,
    cons: career.cons,
    skills: career.skills,
    successProbability: analysis?.decision?.rankedPaths?.find((path) => path.title === career.title)?.successProbability,
    riskLevel: analysis?.decision?.rankedPaths?.find((path) => path.title === career.title)?.riskLevel,
  }));

  const first = careerData[0];
  const bestPath = analysis?.decision?.bestPath;
  const roadmap = first ? createRoadmap(first.title).milestones : [];
  const tone = language === 'english'
    ? 'I analyzed your education, interests, and available Indian career paths.'
    : 'Maine aapki education, interest aur India ke career options analyze kiye.';

  const intentLine = {
    college: `College angle se ${collegeData.length} options match hue.`,
    exam: `Exam path ke liye ${examData.length} useful exams mil rahe hain.`,
    roadmap: 'Roadmap ke liye step-by-step plan ready hai.',
    career_confusion: 'Confusion normal hai, isliye maine balanced options rakhe hain.',
    general_guidance: 'Aapke question ke hisaab se best next steps ye hain.',
  }[intent] || 'Best next steps ye hain.';

  const directMessage = bestPath
    ? `Bhai simple answer: ${bestPath.title} tumhare liye strongest path lag raha hai. Success chance approx ${bestPath.outcome.successProbability}% hai, risk ${bestPath.outcome.riskLevel} hai. Missing skills: ${bestPath.skillGap.missingSkills.join(', ') || 'basic skills clear hain'}.`
    : `${tone} ${intentLine}`;

  return formatCareerResponse({
    message: directMessage,
    options,
    roadmap,
    recommendation: bestPath
      ? `${bestPath.title} start karo. Backup option: ${analysis?.decision?.backupPath?.title || 'Diploma/skill route'}.`
      : first
      ? `${first.title} strong option hai agar aap ${first.skills.slice(0, 2).join(' + ')} daily practice kar sakte ho.`
      : 'Pehle apni education, interest aur budget clear karo, phir path choose karo.',
    nextQuestions: [
      'Aapki current class/qualification kya hai?',
      'Aapko tech, business, medical ya government me se kya pasand hai?',
      'Aap job jaldi chahte ho ya long-term degree path?',
    ],
    metadata: { aiMode: 'local-fallback', analysis },
  });
}

async function callOpenAiCompatible({ prompt }) {
  const isOpenAi = env.aiProvider === 'openai';
  const apiKey = isOpenAi ? env.openAiApiKey : env.groqApiKey;
  if (!apiKey) return null;

  if (!isOpenAi) {
    const langChainResult = await callLangChainGroq({ prompt, apiKey });
    if (langChainResult) return langChainResult;
  }

  const endpoint = isOpenAi
    ? 'https://api.openai.com/v1/chat/completions'
    : 'https://api.groq.com/openai/v1/chat/completions';
  const model = env.aiModel || (isOpenAi ? 'gpt-4o-mini' : 'llama-3.1-8b-instant');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You generate practical Indian career guidance in strict JSON.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI provider failed with ${response.status}: ${errorText.slice(0, 300)}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content || '{}';
  const parsed = parseAiJson(content);

  return {
    ...parsed,
    metadata: {
      ...(parsed.metadata || {}),
      aiMode: isOpenAi ? 'openai' : 'groq',
      model,
    },
  };
}

async function callLangChainGroq({ prompt, apiKey }) {
  try {
    const [{ ChatGroq }, { HumanMessage, SystemMessage }] = await Promise.all([
      import('@langchain/groq'),
      import('@langchain/core/messages'),
    ]);
    const model = env.aiModel || 'llama-3.1-8b-instant';
    const llm = new ChatGroq({
      apiKey,
      model,
      temperature: 0.4,
      modelKwargs: {
        response_format: { type: 'json_object' },
      },
    });
    const response = await llm.invoke([
      new SystemMessage('You are NextStep AI. Return only valid JSON without markdown fences.'),
      new HumanMessage(prompt),
    ]);
    const content = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);
    const parsed = parseAiJson(content);

    return {
      ...parsed,
      metadata: {
        ...(parsed.metadata || {}),
        aiMode: 'langchain-groq',
        model,
      },
    };
  } catch (error) {
    console.warn(`LangChain Groq unavailable: ${error.message}`);
    return null;
  }
}

async function generateCareerAdvice(input) {
  if (input.intent === 'greeting') {
    return createSmallTalkAnswer(input);
  }

  const careerMode = isCareerIntent(input.intent);
  const careerData = careerMode
    ? (input.careerData.length ? input.careerData : getCareerSuggestions({ education: input.education, interest: input.message }))
    : [];
  const context = {
    careers: careerData,
    exams: careerMode ? input.examData : [],
    colleges: careerMode ? input.collegeData : [],
  };
  const rag = await retrieveRelevantContext(input.message, 6);

  const enrichedInput = {
    ...input,
    analysis: {
      ...(input.analysis || {}),
      ragMode: rag.mode,
      ragDocuments: rag.documents.map((doc) => doc.metadata),
    },
  };

  const fallback = createFallbackAnswer({ ...enrichedInput, careerData });
  const prompt = buildCareerPrompt({
    ...enrichedInput,
    context: {
      ...context,
      ragMode: rag.mode,
      retrievedDocuments: rag.documents,
    },
  });

  try {
    const aiResult = await callOpenAiCompatible({ prompt });
    if (!aiResult) return fallback;
    const formatted = formatCareerResponse(aiResult, fallback);

    if (!careerMode) {
      return {
        ...formatted,
        options: [],
        roadmap: [],
        recommendation: '',
      };
    }

    return formatted;
  } catch (error) {
    console.warn(`AI fallback used: ${error.message}`);
    return {
      ...fallback,
      metadata: {
        ...fallback.metadata,
        fallbackReason: error.message,
      },
    };
  }
}

module.exports = { generateCareerAdvice };
