const { buildMentorState } = require('../services/gapEngine.service');
const { buildConversationState } = require('../services/conversationState.service');
const { extractEducation } = require('../utils/promptBuilder');

console.log('=== RUNNING PIPELINE TESTS ===');

const testCases = [
  '10th pass, ab kya karu?',
  '10th kiya hai ab kya kru',
  'kya karu?',
];

let userProfile = {
  name: 'Test Student',
  education: 'unknown',
  interests: [],
  askedQuestions: [],
};

let conversationHistory = [];

for (const msg of testCases) {
  console.log(`\n--- USER MESSAGE: "${msg}" ---`);

  const education = extractEducation(msg);
  console.log('Education extracted from message:', education);

  if (education && education !== 'unknown') {
    userProfile.education = education;
  }
  console.log('User Profile education in context:', userProfile.education);

  const mentorState = buildMentorState({
    message: msg,
    detectedIntent: 'career_confusion',
    conversationHistory,
    userProfile,
    language: 'hinglish',
  });

  console.log('MENTOR STATE entities:', JSON.stringify(mentorState.entities));
  console.log('MENTOR STATE known:', JSON.stringify(mentorState.known));
  console.log('MENTOR STATE missing:', JSON.stringify(mentorState.missing));
  console.log('MENTOR STATE nextBestQuestion:', mentorState.nextBestQuestion);
  console.log('MENTOR STATE shouldAsk:', mentorState.shouldAsk);
  console.log('MENTOR STATE localResponse:', JSON.stringify(mentorState.localResponse));

  const metadata = { mentorState };
  conversationHistory.push({ role: 'user', content: msg, metadata });
  conversationHistory.push({
    role: 'assistant',
    content: mentorState.localResponse?.message || 'AI response',
    metadata,
  });
}
