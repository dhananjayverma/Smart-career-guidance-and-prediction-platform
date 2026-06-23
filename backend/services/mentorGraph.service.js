const { analyzeEmotion, detectConfusion } = require('./emotion.service');
const { buildCareerDecision } = require('./decision.service');
const { isCareerIntent } = require('../utils/promptBuilder');

function runLocalMentorGraph({ message, intent, careerData, userProfile = {} }) {
  const emotion = analyzeEmotion(message);
  const confusion = detectConfusion(message);
  const careerMode = isCareerIntent(intent);
  const decision = careerMode
    ? buildCareerDecision(careerData, {
        emotion,
        confusion,
        knownSkills: userProfile.skills || [],
      })
    : null;

  return {
    workflow: 'local-mentor-graph-v1',
    nodes: ['emotion', 'confusion', 'careerDecision', 'skillGap', 'outcomeProbability', 'responseCoach'],
    emotion,
    confusion,
    decision,
    coachHint: emotion.needsSupport
      ? 'Start with emotional support, then ask a gentle clarifying question.'
      : careerMode
        ? 'Give direct recommendation first, then options, risk, skills, and next steps.'
        : 'Answer like a general helpful assistant without forcing career cards.',
  };
}

async function runLangGraphMentor(input) {
  const { StateGraph, START, END } = await import('@langchain/langgraph');

  const graph = new StateGraph({
    channels: {
      message: null,
      intent: null,
      careerData: null,
      userProfile: null,
      emotion: null,
      confusion: null,
      decision: null,
      careerMode: null,
      coachHint: null,
      workflow: null,
      nodes: null,
    },
  });

  graph
    .addNode('emotion', async (state) => ({
      emotion: analyzeEmotion(state.message),
      workflow: 'langgraph-mentor-v1',
      nodes: ['emotion'],
    }))
    .addNode('confusion', async (state) => ({
      confusion: detectConfusion(state.message),
      nodes: [...(state.nodes || []), 'confusion'],
    }))
    .addNode('careerDecision', async (state) => {
      const careerMode = isCareerIntent(state.intent);

      return {
        careerMode,
        decision: careerMode
          ? buildCareerDecision(state.careerData || [], {
              emotion: state.emotion,
              confusion: state.confusion,
              knownSkills: state.userProfile?.skills || [],
            })
          : null,
        nodes: [...(state.nodes || []), 'careerDecision', 'skillGap', 'outcomeProbability'],
      };
    })
    .addNode('responseCoach', async (state) => ({
      coachHint: state.emotion?.needsSupport
        ? 'Start with emotional support, then ask a gentle clarifying question.'
        : state.careerMode
          ? 'Give direct recommendation first, then options, risk, skills, and next steps.'
          : 'Answer like a general helpful assistant without forcing career cards.',
      nodes: [...(state.nodes || []), 'responseCoach'],
    }))
    .addEdge(START, 'emotion')
    .addEdge('emotion', 'confusion')
    .addEdge('confusion', 'careerDecision')
    .addEdge('careerDecision', 'responseCoach')
    .addEdge('responseCoach', END);

  return graph.compile().invoke(input);
}

async function runMentorGraph(input) {
  try {
    return await runLangGraphMentor(input);
  } catch (error) {
    return {
      ...runLocalMentorGraph(input),
      workflow: 'local-mentor-graph-fallback',
      graphError: error.message,
    };
  }
}

module.exports = { runMentorGraph, runLocalMentorGraph };
