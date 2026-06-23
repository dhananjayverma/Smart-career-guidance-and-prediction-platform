const emotionPatterns = [
  { mood: 'depressed', words: ['depress', 'dukhi', 'hopeless', 'worthless', 'rona', 'marna', 'give up', 'kuch nahi', 'faida nahi'], weight: 5 },
  { mood: 'stressed', words: ['stress', 'stressed', 'tension', 'pareshan', 'presan', 'pareshaan', 'pressure', 'dar', 'scared', 'anxiety', 'ghabra'], weight: 4 },
  { mood: 'confused', words: ['confused', 'confusion', 'samajh nahi', 'kya karu', 'kya kru', 'doubt', 'unclear', 'lost', 'kya banaun'], weight: 3 },
  { mood: 'motivated', words: ['motivated', 'ready', 'karna hai', 'banna hai', 'goal', 'dream', 'excited', 'passion'], weight: 2 },
  { mood: 'curious', words: ['batao', 'tell me', 'explain', 'kaise', 'how', 'what is', 'kya hai', 'sikhao', 'teach'], weight: 1 },
];

function analyzeEmotion(message = '') {
  const text = message.toLowerCase();
  const scores = emotionPatterns.map((pattern) => ({
    mood: pattern.mood,
    score: pattern.words.reduce((sum, word) => sum + (text.includes(word) ? pattern.weight : 0), 0),
  }));

  const top = scores.sort((a, b) => b.score - a.score)[0];
  const mood = top?.score ? top.mood : 'neutral';
  const confidence = top?.score ? Math.min(0.95, 0.45 + top.score / 10) : 0.35;

  return {
    mood,
    confidence: Number(confidence.toFixed(2)),
    needsSupport: ['depressed', 'stressed'].includes(mood),
    tone: mood === 'motivated' ? 'energetic' : mood === 'curious' ? 'informative' : mood === 'neutral' ? 'calm' : 'supportive',
  };
}

function detectConfusion(message = '') {
  const text = message.toLowerCase();
  const signals = [
    ['unclear_goal', /kya karu|kya kru|samajh nahi|confus|doubt/.test(text)],
    ['overthinking', /bahut soch|overthink|dar|risk|galat/.test(text)],
    ['decision_stuck', /choose|select|best|better|ya|vs/.test(text)],
  ].filter(([, active]) => active).map(([name]) => name);

  return {
    isConfused: signals.length > 0,
    signals,
    level: signals.length >= 2 ? 'high' : signals.length === 1 ? 'medium' : 'low',
  };
}

module.exports = { analyzeEmotion, detectConfusion };
