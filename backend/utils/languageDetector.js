const hindiRegex = /[\u0900-\u097F]/;
const hinglishWords = [
  'kya', 'kaise', 'karu', 'karna', 'hai', 'ho', 'gaya', 'ke', 'liye',
  'mujhe', 'batao', 'sarkari', 'naukri', 'padhai', 'college', 'job',
];

function detectLanguage(text = '') {
  const normalized = text.toLowerCase();
  if (hindiRegex.test(text)) return 'hindi';

  const hits = hinglishWords.filter((word) => normalized.includes(word)).length;
  if (hits >= 2) return 'hinglish';

  return 'english';
}

module.exports = { detectLanguage };
