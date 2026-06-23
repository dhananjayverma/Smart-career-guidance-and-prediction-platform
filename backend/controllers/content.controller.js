const compareOptions = require('../data/compare.json');
const dashboard = require('../data/dashboard.json');
const home = require('../data/home.json');
const materials = require('../data/materials.json');
const quickQuestions = require('../data/chatQuickQuestions.json');
const settings = require('../data/settings.json');
const simulations = require('../data/simulations.json');

function getCompareOptions(_req, res) {
  res.json({ success: true, data: compareOptions });
}

function getDashboard(_req, res) {
  res.json({ success: true, data: dashboard });
}

function getHome(_req, res) {
  res.json({ success: true, data: home });
}

function getNavigation(_req, res) {
  res.json({ success: true, data: dashboard.navigation || [] });
}

function getSettings(_req, res) {
  res.json({ success: true, data: settings });
}

function getMaterials(req, res) {
  const { subject = 'All', type = 'All' } = req.query;
  const filtered = materials.filter((resource) => {
    const subjectMatch = subject === 'All' || resource.subject === subject;
    const typeMatch = type === 'All' || resource.type === type;
    return subjectMatch && typeMatch;
  });

  res.json({
    success: true,
    data: {
      resources: filtered,
      subjects: ['All', ...new Set(materials.map((resource) => resource.subject))],
      types: ['All', ...new Set(materials.map((resource) => resource.type))],
    },
  });
}

function getQuickQuestions(_req, res) {
  res.json({ success: true, data: quickQuestions });
}

function getSimulations(_req, res) {
  res.json({ success: true, data: simulations });
}

module.exports = {
  getCompareOptions,
  getDashboard,
  getHome,
  getMaterials,
  getNavigation,
  getQuickQuestions,
  getSettings,
  getSimulations,
};
