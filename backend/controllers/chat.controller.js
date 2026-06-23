const mongoose = require('mongoose');
const Session = require('../models/session.model');
const { generateCareerAdvice } = require('../services/ai.service');
const { getCareerData, getCollegeData, getExamData } = require('../services/data.service');
const { detectLanguage } = require('../utils/languageDetector');
const { cleanMessage, detectIntent, extractEducation } = require('../utils/promptBuilder');
const { runMentorGraph } = require('../services/mentorGraph.service');

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

async function getSessionSummary(userId) {
  if (!userId || userId === 'guest') return '';

  if (mongoose.connection.readyState === 1) {
    const session = await Session.findOne({ userId }).lean();
    const recentUserMessages = session?.messages
      ?.filter((msg) => msg.role === 'user')
      .slice(-4)
      .map((msg) => msg.content) || [];

    return recentUserMessages.length
      ? `Recent user context only: ${recentUserMessages.join(' | ')}`
      : '';
  }

  return (memorySessions.get(userId) || [])
    .filter((msg) => msg.role === 'user')
    .slice(-4)
    .map((msg) => msg.content)
    .join(' | ');
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
      },
      { upsert: true }
    );
    return;
  }

  const history = memorySessions.get(userId) || [];
  history.push({ role: 'user', content: userMessage }, { role: 'assistant', content: assistantMessage });
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

async function chat(req, res, next) {
  try {
    const message = cleanMessage(req.body.message);
    const userId = req.body.userId || 'guest';

    if (!message) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    const language = req.body.language || detectLanguage(message);
    const intent = detectIntent(message);
    const education = req.body.education || extractEducation(message);
    const careerLikeIntents = ['career_confusion', 'exam', 'roadmap', 'college'];
    const shouldUseCareerData = careerLikeIntents.includes(intent);
    const interest = req.body.interest || message;
    const careerData = shouldUseCareerData ? getCareerData({ education, interest }) : [];
    const examData = shouldUseCareerData ? getExamData(message) : [];
    const collegeData = shouldUseCareerData ? getCollegeData({ search: message }).slice(0, 6) : [];
    const sessionSummary = await getSessionSummary(userId);
    const analysis = await runMentorGraph({
      message,
      intent,
      careerData,
      userProfile: req.body.profile || {},
    });

    const answer = await generateCareerAdvice({
      message,
      userId,
      language,
      intent,
      education,
      careerData,
      examData,
      collegeData,
      sessionSummary,
      analysis,
    });

    const metadata = {
      language,
      intent,
      education,
      emotion: analysis.emotion,
      confusion: analysis.confusion,
      decision: analysis.decision,
      workflow: analysis.workflow,
    };
    await saveSessionTurn(userId, message, answer.message, metadata);

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

module.exports = { chat, getSession, saveCareer };
