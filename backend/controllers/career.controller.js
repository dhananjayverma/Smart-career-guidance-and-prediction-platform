const { getAllCareers } = require('../services/data.service');
const { getCareerSuggestions } = require('../services/career.service');

async function getCareers(req, res, next) {
  try {
    const { category = 'All' } = req.query;
    const careers = getAllCareers().filter((career) => category === 'All' || career.category === category);
    res.json({ success: true, data: careers });
  } catch (error) {
    next(error);
  }
}

async function getSuggestions(req, res, next) {
  try {
    const filters = {
      education: req.query.education,
      interest: req.query.interest,
      category: req.query.category,
    };
    res.json({ success: true, data: getCareerSuggestions(filters) });
  } catch (error) {
    next(error);
  }
}

module.exports = { getCareers, getSuggestions };
