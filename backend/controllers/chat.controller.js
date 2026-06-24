const mongoose = require('mongoose');
const Session = require('../models/session.model');
const { generateCareerAdvice, generateCareerAdviceStream } = require('../services/ai.service');
const { getCareerData, getCollegeData, getExamData } = require('../services/data.service');
const { detectLanguage } = require('../utils/languageDetector');
const { allowsCareerDecision, cleanMessage, detectIntent, extractEducation } = require('../utils/promptBuilder');
const { runMentorGraph } = require('../services/mentorGraph.service');
const {
  buildLearningSummaryAsync,
  getMemory,
  learnFromFeedback,
  learnFromPrompt,
  clearMemory,
} = require('../services/learning.service');
const { buildConversationState } = require('../services/conversationState.service');
const { buildUnderstanding } = require('../services/understanding.service');
const { selectBehaviorMode } = require('../services/behaviorEngine.service');
const { buildMentorState } = require('../services/gapEngine.service');

const memorySessions = new Map();
const memorySavedCareers = new Map();

function buildSessionSnapshot(session = {}) {
  const messages = session.messages || [];
  const savedCareers = session.savedCareers || [];
  const userMessages = messages.filter((msg) => msg.role === 'user');
  const assistantMessages = messages.filter((msg) => msg.role === 'assistant');
  const latestIntent = [...messages].reverse().find((msg) => msg.metadata?.intent)?.metadata?.intent || '';

  return {
    messages,
    savedCareers,
    stats: [
      { label: 'Messages', value: String(messages.length) },
      { label: 'Questions Asked', value: String(userMessages.length) },
      { label: 'AI Answers', value: String(assistantMessages.length) },
      { label: 'Saved Careers', value: String(savedCareers.length) },
    ],
    latestIntent,
  };
}

async function getConversationHistory(userId, limit = 5) {
  if (!userId || userId === 'guest') return [];

  if (mongoose.connection.readyState === 1) {
    const session = await Session.findOne({ userId }).lean();
    return (session?.messages || []).slice(-limit);
  }

  return (memorySessions.get(userId) || []).slice(-limit);
}

async function getSessionSummary(userId, userProfile = {}) {
  const parts = [];

  if (userProfile.name) parts.push(`Name: ${userProfile.name}`);
  if (userProfile.education && userProfile.education !== 'unknown') {
    parts.push(`Education: ${userProfile.education}`);
  }
  if (userProfile.interests?.length) {
    parts.push(`Interests: ${userProfile.interests.slice(0, 4).join(', ')}`);
  }

  const history = await getConversationHistory(userId, 8);
  const userTopics = history
    .filter((msg) => msg.role === 'user')
    .slice(-3)
    .map((msg) => String(msg.content).slice(0, 90));

  if (userTopics.length) {
    parts.push(`Recent questions: ${userTopics.join(' | ')}`);
  }

  const learningSummary = await buildLearningSummaryAsync(userId);
  if (learningSummary) {
    parts.push(`Learned memory: ${learningSummary}`);
  }

  return parts.join('. ').slice(0, 400);
}

async function saveSessionTurn(userId, userMessage, assistantMessage, metadata) {
  if (!userId || userId === 'guest') return;

  if (mongoose.connection.readyState === 1) {
    await Session.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: { userId },
        $push: {
          messages: {
            $each: [
              { role: 'user', content: userMessage, metadata },
              { role: 'assistant', content: assistantMessage, metadata },
            ],
            $slice: -30,
          },
        },
        $addToSet: { 'preferences.askedQuestions': { $each: metadata?.mentorState?.askedQuestions || [] } }
      },
      { upsert: true }
    );
    return;
  }

  const history = memorySessions.get(userId) || [];
  history.push(
    { role: 'user', content: userMessage, metadata },
    { role: 'assistant', content: assistantMessage, metadata }
  );
  memorySessions.set(userId, history.slice(-30));
}

async function getSession(req, res, next) {
  try {
    const userId = req.params.userId || req.query.userId || 'guest';

    if (!userId || userId === 'guest') {
      return res.json({ success: true, data: buildSessionSnapshot() });
    }

    if (mongoose.connection.readyState === 1) {
      const session = await Session.findOne({ userId }).lean();
      return res.json({ success: true, data: buildSessionSnapshot(session || {}) });
    }

    return res.json({
      success: true,
      data: buildSessionSnapshot({
        messages: memorySessions.get(userId) || [],
        savedCareers: memorySavedCareers.get(userId) || [],
      }),
    });
  } catch (error) {
    next(error);
  }
}

async function saveCareer(req, res, next) {
  try {
    const userId = req.params.userId || req.body.userId || 'guest';
    const career = {
      id: req.body.id || req.body.title,
      title: req.body.title,
      source: req.body.source || 'chat',
      metadata: req.body.metadata || {},
      savedAt: new Date(),
    };

    if (!career.title) {
      return res.status(400).json({ success: false, message: 'career title is required' });
    }

    if (!userId || userId === 'guest') {
      return res.json({ success: true, data: career });
    }

    if (mongoose.connection.readyState === 1) {
      const session = await Session.findOneAndUpdate(
        { userId },
        {
          $setOnInsert: { userId },
          $pull: { savedCareers: { title: career.title } },
        },
        { upsert: true, new: true }
      );
      session.savedCareers.push(career);
      await session.save();
      return res.json({ success: true, data: buildSessionSnapshot(session.toObject()) });
    }

    const saved = (memorySavedCareers.get(userId) || []).filter((item) => item.title !== career.title);
    saved.push(career);
    memorySavedCareers.set(userId, saved);
    return res.json({
      success: true,
      data: buildSessionSnapshot({
        messages: memorySessions.get(userId) || [],
        savedCareers: saved,
      }),
    });
  } catch (error) {
    next(error);
  }
}

async function clearSessionMessages(req, res, next) {
  try {
    const userId = req.params.userId || req.body.userId || 'guest';

    if (!userId || userId === 'guest') {
      return res.json({ success: true, data: buildSessionSnapshot() });
    }

    if (mongoose.connection.readyState === 1) {
      const session = await Session.findOneAndUpdate(
        { userId },
        { $set: { messages: [] }, $setOnInsert: { userId } },
        { upsert: true, new: true }
      ).lean();

      return res.json({ success: true, data: buildSessionSnapshot(session || {}) });
    }

    memorySessions.set(userId, []);
    return res.json({
      success: true,
      data: buildSessionSnapshot({
        messages: [],
        savedCareers: memorySavedCareers.get(userId) || [],
      }),
    });
  } catch (error) {
    next(error);
  }
}

async function saveFeedback(req, res, next) {
  try {
    const userId = req.params.userId || req.body.userId || 'guest';
    const rating = req.body.rating;

    if (!['up', 'down'].includes(rating)) {
      return res.status(400).json({ success: false, message: 'rating must be up or down' });
    }

    const memory = await learnFromFeedback(userId, {
      rating,
      intent: req.body.intent,
      problem: req.body.problem,
      pattern: req.body.pattern,
      behaviorMode: req.body.behaviorMode,
      messageId: req.body.messageId,
    });

    return res.json({
      success: true,
      data: {
        rating,
        learned: Boolean(memory?.userId),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function buildChatContext(req) {
  const message = cleanMessage(req.body.message);
  const userId = req.body.userId || 'guest';

  if (!message) {
    return { error: 'message is required' };
  }

  const language = req.body.language || detectLanguage(message);
  const detectedIntent = detectIntent(message);
  const education = req.body.education || extractEducation(message);
  const conversationHistory = await getConversationHistory(userId, 5);
  const learnedProfile = await getMemory(userId);
  const learningSummary = await buildLearningSummaryAsync(userId);
  const userProfile = {
    name: req.body.profile?.name || '',
    education: req.body.education || learnedProfile.education || education,
    interests: req.body.profile?.interests || req.body.interests || Object.keys(learnedProfile.interests || {}),
    skills: req.body.profile?.skills || [],
    preferredBranch: learnedProfile.preferredBranch || '',
    learningSummary,
    experienceYears: learnedProfile.preferences?.experienceYears || 0,
    currentRole: learnedProfile.preferences?.currentRole || '',
    careerStage: learnedProfile.preferences?.careerStage || 'beginner',
    askedQuestions: learnedProfile.preferences?.askedQuestions || [],
  };
  const mentorState = buildMentorState({
    message,
    detectedIntent,
    conversationHistory,
    userProfile,
    language,
  });
  const intent = mentorState.intent;
  const careerLikeIntents = ['career_confusion', 'exam', 'government_job', 'roadmap', 'college'];
  const shouldUseCareerData = careerLikeIntents.includes(intent);
  const interest = req.body.interest || message;
  const careerData = shouldUseCareerData ? getCareerData({ education, interest }) : [];
  const examData = shouldUseCareerData ? getExamData(message) : [];
  const collegeData = shouldUseCareerData ? getCollegeData({ search: message }).slice(0, 2) : [];
  const sessionSummary = await getSessionSummary(userId, userProfile);
  const analysis = await runMentorGraph({
    message,
    intent,
    careerData,
    userProfile,
  });
  const conversationState = buildConversationState({
    message,
    intent,
    analysis,
    userProfile,
    conversationHistory,
    language,
  });
  if (mentorState.shouldAsk && mentorState.localResponse) {
    conversationState.stage = 'clarification';
    conversationState.needsMentorClarification = true;
    conversationState.localResponse = mentorState.localResponse;
    conversationState.known = mentorState.known;
    conversationState.missing = mentorState.missing;
    conversationState.askedQuestions = mentorState.askedQuestions;
    conversationState.nextBestQuestion = mentorState.criticalUnknown;
    conversationState.reasoning = mentorState.reasoning;
    conversationState.responsePlan = mentorState.responsePlan;
  }
  const understanding = buildUnderstanding({
    message,
    intent,
    analysis,
    conversationState,
    userProfile,
  });
  const behavior = selectBehaviorMode({
    message,
    intent,
    understanding,
    conversationState,
    analysis,
  });

  return {
    message,
    userId,
    language,
    intent,
    education,
    careerData,
    examData,
    collegeData,
    sessionSummary,
    conversationHistory,
    userProfile,
    analysis,
    conversationState,
    understanding,
    behavior,
    mentorState,
    stream: Boolean(req.body.stream),
  };
}

async function chat(req, res, next) {
  try {
    const context = await buildChatContext(req);
    if (context.error) {
      return res.status(400).json({ success: false, message: context.error });
    }

    console.log("USER:", context.message);
    console.log("EXTRACTED:", context.mentorState?.entities);
    console.log("MEMORY:", context.userProfile);
    console.log("KNOWN:", context.mentorState?.known);
    console.log("MISSING:", context.mentorState?.missing);
    console.log("NEXT QUESTION:", context.mentorState?.nextBestQuestion);

    const answer = await generateCareerAdvice({
      message: context.message,
      userId: context.userId,
      language: context.language,
      intent: context.intent,
      education: context.education,
      careerData: context.careerData,
      examData: context.examData,
      collegeData: context.collegeData,
      sessionSummary: context.sessionSummary,
      conversationHistory: context.conversationHistory,
      userProfile: context.userProfile,
      analysis: context.analysis,
      conversationState: context.conversationState,
      understanding: context.understanding,
      behavior: context.behavior,
      mentorState: context.mentorState,
    });

    const isClarifying = context.conversationState?.needsMentorClarification;
    const allowDecisionCard = allowsCareerDecision(context.intent);
    const metadata = {
      language: context.language,
      intent: context.intent,
      queryType: context.mentorState?.queryType || 'general',
      education: context.education,
      emotion: context.analysis.emotion,
      confusion: context.analysis.confusion,
      decision: !isClarifying && allowDecisionCard ? context.analysis.decision : null,
      ui: {
        decisionCard: !isClarifying && allowDecisionCard,
        careerCard: allowDecisionCard,
        skillGap: allowDecisionCard,
        roadmapCard: context.intent === 'roadmap',
      },
      workflow: context.analysis.workflow,
      conversationState: context.conversationState,
      understanding: context.understanding,
      behavior: context.behavior,
      mentorState: context.mentorState,
    };
    await learnFromPrompt({
      userId: context.userId,
      message: context.message,
      analysis: context.analysis,
      intent: context.intent,
      language: context.language,
      understanding: context.understanding,
      conversationState: context.conversationState,
      behavior: context.behavior,
      mentorState: context.mentorState,
    });
    await saveSessionTurn(context.userId, context.message, answer.message, metadata);

    res.json({
      success: true,
      data: {
        ...answer,
        metadata: {
          ...answer.metadata,
          ...metadata,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

async function chatStream(req, res, next) {
  try {
    const context = await buildChatContext(req);
    if (context.error) {
      return res.status(400).json({ success: false, message: context.error });
    }

    console.log("USER:", context.message);
    console.log("EXTRACTED:", context.mentorState?.entities);
    console.log("MEMORY:", context.userProfile);
    console.log("KNOWN:", context.mentorState?.known);
    console.log("MISSING:", context.mentorState?.missing);
    console.log("NEXT QUESTION:", context.mentorState?.nextBestQuestion);

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let fullMessage = '';

    await generateCareerAdviceStream(
      {
        message: context.message,
        userId: context.userId,
        language: context.language,
        intent: context.intent,
        education: context.education,
        careerData: context.careerData,
        examData: context.examData,
        collegeData: context.collegeData,
        sessionSummary: context.sessionSummary,
        conversationHistory: context.conversationHistory,
        userProfile: context.userProfile,
        analysis: context.analysis,
        conversationState: context.conversationState,
        understanding: context.understanding,
        behavior: context.behavior,
        mentorState: context.mentorState,
      },
      {
        onDelta: (chunk) => {
          fullMessage += chunk;
          res.write(`data: ${JSON.stringify({ type: 'delta', content: chunk })}\n\n`);
        },
        onDone: async (answer) => {
          const isClarifying = context.conversationState?.needsMentorClarification;
          const allowDecisionCard = allowsCareerDecision(context.intent);
          const metadata = {
            language: context.language,
            intent: context.intent,
            queryType: context.mentorState?.queryType || 'general',
            education: context.education,
            emotion: context.analysis.emotion,
            confusion: context.analysis.confusion,
            decision: !isClarifying && allowDecisionCard ? context.analysis.decision : null,
            ui: {
              decisionCard: !isClarifying && allowDecisionCard,
              careerCard: allowDecisionCard,
              skillGap: allowDecisionCard,
              roadmapCard: context.intent === 'roadmap',
            },
            workflow: context.analysis.workflow,
            conversationState: context.conversationState,
            understanding: context.understanding,
            behavior: context.behavior,
            mentorState: context.mentorState,
          };

          await learnFromPrompt({
            userId: context.userId,
            message: context.message,
            analysis: context.analysis,
            intent: context.intent,
            language: context.language,
            understanding: context.understanding,
            conversationState: context.conversationState,
            behavior: context.behavior,
            mentorState: context.mentorState,
          });
          await saveSessionTurn(context.userId, context.message, answer.message || fullMessage, metadata);

          res.write(`data: ${JSON.stringify({
            type: 'done',
            data: {
              ...answer,
              metadata: {
                ...answer.metadata,
                ...metadata,
              },
            },
          })}\n\n`);
          res.end();
        },
      }
    );
  } catch (error) {
    if (!res.headersSent) {
      next(error);
      return;
    }

    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.end();
  }
}

async function clearUserMemory(req, res, next) {
  try {
    const userId = req.params.userId || req.body.userId || 'guest';

    if (!userId || userId === 'guest') {
      return res.json({ success: true, message: 'Guest memory is not tracked.' });
    }

    await clearMemory(userId);
    return res.json({ success: true, message: 'Learned memory has been cleared successfully.' });
  } catch (error) {
    next(error);
  }
}

module.exports = { chat, chatStream, clearSessionMessages, getSession, saveCareer, clearUserMemory, saveFeedback };
