const { createRoadmap } = require('./roadmap.service');

function difficultyPenalty(difficulty = '') {
  if (/very hard/i.test(difficulty)) return 18;
  if (/hard/i.test(difficulty)) return 12;
  if (/medium/i.test(difficulty)) return 6;
  return 3;
}

function demandBonus(growth = '') {
  if (/very high|highest/i.test(growth)) return 18;
  if (/high/i.test(growth)) return 12;
  return 7;
}

function predictOutcome(career, emotion, confusion) {
  const base = 50;
  const growth = demandBonus(career.growth);
  const difficulty = difficultyPenalty(career.difficulty);
  const emotionalAdjustment = emotion.needsSupport ? -5 : emotion.mood === 'motivated' ? 7 : 0;
  const clarityAdjustment = confusion.isConfused ? -4 : 4;
  const successProbability = Math.max(25, Math.min(92, base + growth - difficulty + emotionalAdjustment + clarityAdjustment + (career.growthScore || 0) * 3));
  const failureRisk = 100 - successProbability;

  return {
    successProbability,
    failureRisk,
    effortLevel: career.difficulty || 'Medium',
    riskLevel: failureRisk > 45 ? 'High' : failureRisk > 28 ? 'Medium' : 'Low',
  };
}

function analyzeSkillGap(career, knownSkills = []) {
  const known = knownSkills.map((skill) => skill.toLowerCase());
  const missing = (career.skills || []).filter((skill) => !known.includes(skill.toLowerCase()));

  return {
    target: career.title,
    missingSkills: missing,
    missingCount: missing.length,
    nextSkill: missing[0] || '',
  };
}

function buildCareerDecision(careers = [], { emotion, confusion, knownSkills = [] }) {
  const ranked = careers.map((career) => {
    const outcome = predictOutcome(career, emotion, confusion);
    const skillGap = analyzeSkillGap(career, knownSkills);
    return {
      ...career,
      outcome,
      skillGap,
      decisionScore: outcome.successProbability - skillGap.missingCount * 3 + (career.growthScore || 0) * 4,
    };
  }).sort((a, b) => b.decisionScore - a.decisionScore);

  const best = ranked[0] || null;
  const backup = ranked[1] || null;

  return {
    bestPath: best ? {
      id: best.id,
      title: best.title,
      reason: `${best.growth} growth, ${best.salary} salary range, and ${best.duration} path.`,
      outcome: best.outcome,
      skillGap: best.skillGap,
      roadmapPreview: createRoadmap(best.title).milestones.slice(0, 2),
    } : null,
    backupPath: backup ? {
      id: backup.id,
      title: backup.title,
      outcome: backup.outcome,
    } : null,
    rankedPaths: ranked.slice(0, 3).map((career) => ({
      title: career.title,
      successProbability: career.outcome.successProbability,
      riskLevel: career.outcome.riskLevel,
      missingSkills: career.skillGap.missingSkills,
    })),
  };
}

module.exports = { analyzeSkillGap, buildCareerDecision, predictOutcome };
