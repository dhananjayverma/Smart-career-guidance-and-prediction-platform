const { analyzeEmotion, detectConfusion } = require('./emotion.service');
const { buildCareerDecision } = require('./decision.service');
const { allowsCareerDecision } = require('../utils/promptBuilder');

function runLocalMentorGraph({ message, intent, careerData, userProfile = {} }) {
  const emotion = analyzeEmotion(message);
  const confusion = detectConfusion(message);
  const decisionMode = allowsCareerDecision(intent);
  const decision = decisionMode
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
      ? 'Acknowledge their feelings warmly like a caring friend. Ask what happened. Do not jump to career advice yet.'
      : intent === 'greeting'
        ? 'Greet warmly, introduce yourself, ask what they need help with today.'
        : intent === 'roadmap'
          ? 'Provide a COMPLETE phase-by-phase roadmap with durations and specific tasks. Be thorough.'
          : decisionMode
            ? 'Listen to their exact question first. Give a direct answer, then options with honest pros/cons.'
            : 'Answer naturally like ChatGPT. Match their tone. Be helpful and conversational.',
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
      decisionMode: null,
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
      const decisionMode = allowsCareerDecision(state.intent);

      return {
        decisionMode,
        decision: decisionMode
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
        ? 'Acknowledge their feelings warmly like a caring friend. Ask what happened. Do not jump to career advice yet.'
        : state.intent === 'greeting'
          ? 'Greet warmly, introduce yourself, ask what they need help with today.'
          : state.intent === 'roadmap'
            ? 'Provide a COMPLETE phase-by-phase roadmap with durations and specific tasks. Be thorough.'
            : state.decisionMode
              ? 'Listen to their exact question first. Give a direct answer, then options with honest pros/cons.'
              : 'Answer naturally like ChatGPT. Match their tone. Be helpful and conversational.',
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
