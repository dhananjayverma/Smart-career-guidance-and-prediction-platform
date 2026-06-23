const { getAllCareers, getCareerData } = require('./data.service');

function scoreCareer(career, { education = '', interest = '' } = {}) {
  let score = 0;
  const normalizedInterest = String(interest).toLowerCase();
  const tokens = normalizedInterest
    .replace(/enginner|enginr|engneer/g, 'engineer')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  if (career.educationLevels.includes(education)) score += 4;
  if (interest) {
    const text = `${career.category} ${career.interests.join(' ')} ${career.skills.join(' ')}`.toLowerCase();
    if (text.includes(normalizedInterest)) score += 5;
    tokens.forEach((token) => {
      if (text.includes(token)) score += 2;
    });
  }
  score += career.growthScore || 0;
  return score;
}

function getCareerSuggestions(filters = {}) {
  const pool = getCareerData(filters);
  const source = pool.length ? pool : getAllCareers();

  return source
    .map((career) => ({ ...career, score: scoreCareer(career, filters) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ score, ...career }) => career);
}

module.exports = { getCareerSuggestions };
