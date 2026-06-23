const { getCollegeData } = require('../services/data.service');

async function getColleges(req, res, next) {
  try {
    const colleges = getCollegeData({
      search: req.query.search,
      location: req.query.location,
      type: req.query.type,
      state: req.query.state,
    });

    res.json({
      success: true,
      data: colleges,
      meta: {
        count: colleges.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getColleges };
