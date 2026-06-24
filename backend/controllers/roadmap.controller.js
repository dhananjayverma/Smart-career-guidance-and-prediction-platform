const { createRoadmap, getRoadmapTemplates } = require('../services/roadmap.service');

async function getRoadmapTemplatesController(_req, res, next) {
  try {
    res.json({ success: true, data: getRoadmapTemplates() });
  } catch (error) {
    next(error);
  }
}

async function createRoadmapController(req, res, next) {
  try {
    const career = req.body.career || req.query.career || 'Software Developer';
    const userId = req.body.userId || req.query.userId || 'guest';
    const { getMemory } = require('../services/learning.service');
    const learnedProfile = await getMemory(userId);
    const experienceYears = learnedProfile.preferences?.experienceYears || 0;

    res.json({ success: true, data: createRoadmap(career, experienceYears) });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createRoadmap: createRoadmapController,
  getRoadmapTemplates: getRoadmapTemplatesController,
};
