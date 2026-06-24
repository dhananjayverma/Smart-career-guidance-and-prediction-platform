function normalizeEmotionText(message = '') {
  return String(message)
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const emotionPatterns = [
  {
    mood: 'crisis',
    words: ['marna hai', 'suicide', 'khud ko harm', 'self harm', 'zinda nahi rehna', 'end my life', 'kill myself'],
    weight: 8,
  },
  {
    mood: 'depressed',
    words: ['depress', 'dukhi', 'hopeless', 'worthless', 'rona aa raha', 'give up', 'kuch nahi ho sakta', 'faida nahi', 'akela', 'lonely', 'thak gaya', 'haar gaya'],
    weight: 5,
  },
  {
    mood: 'stressed',
    words: ['stress', 'stressed', 'tension', 'pareshan', 'presan', 'pareshaan', 'pressure', 'dar', 'scared', 'anxiety', 'ghabra', 'dimag kharab', 'overload', 'panic', 'samajh nahi aa raha', 'nhi ho pa raha'],
    weight: 4,
  },
  {
    mood: 'confused',
    words: ['confused', 'confusion', 'samajh nahi', 'samjh nhi', 'kya karu', 'kya kru', 'doubt', 'unclear', 'lost', 'kya banaun', 'kuch samajh nhi', 'option nahi pata'],
    weight: 3,
  },
  {
    mood: 'motivated',
    words: ['motivated', 'ready', 'karna hai', 'banna hai', 'goal', 'dream', 'excited', 'passion', 'mehnat karunga', 'serious hu'],
    weight: 2,
  },
  {
    mood: 'curious',
    words: ['batao', 'tell me', 'explain', 'kaise', 'how', 'what is', 'kya hai', 'sikhao', 'teach', 'detail me'],
    weight: 1,
  },
];

function analyzeEmotion(message = '') {
  const text = normalizeEmotionText(message);
  const scores = emotionPatterns.map((pattern) => ({
    mood: pattern.mood,
    score: pattern.words.reduce((sum, word) => sum + (text.includes(word) ? pattern.weight : 0), 0),
  }));

  const top = scores.sort((a, b) => b.score - a.score)[0];
  const mood = top?.score ? top.mood : 'neutral';
  const confidence = top?.score ? Math.min(0.98, 0.45 + top.score / 10) : 0.35;
  const intensity = top?.score >= 8 ? 'high' : top?.score >= 4 ? 'medium' : 'low';

  return {
    mood,
    confidence: Number(confidence.toFixed(2)),
    intensity,
    needsSupport: ['crisis', 'depressed', 'stressed'].includes(mood),
    needsImmediateSafety: mood === 'crisis',
    tone: mood === 'motivated' ? 'energetic' : mood === 'curious' ? 'informative' : mood === 'neutral' ? 'calm' : 'supportive',
    signals: scores.filter((item) => item.score > 0).map((item) => item.mood),
  };
}

function detectConfusion(message = '') {
  const text = normalizeEmotionText(message);
  const signals = [
    ['unclear_goal', /kya karu|kya kru|samajh nahi|samjh nhi|confus|doubt|option nahi/.test(text)],
    ['overthinking', /bahut soch|overthink|dar|risk|galat|pressure|tension/.test(text)],
    ['decision_stuck', /choose|select|best|better|ya|vs/.test(text)],
  ].filter(([, active]) => active).map(([name]) => name);

  return {
    isConfused: signals.length > 0,
    signals,
    level: signals.length >= 2 ? 'high' : signals.length === 1 ? 'medium' : 'low',
  };
}

module.exports = { analyzeEmotion, detectConfusion, normalizeEmotionText };
