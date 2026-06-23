const express = require('express');
const {
  getCompareOptions,
  getDashboard,
  getHome,
  getMaterials,
  getNavigation,
  getQuickQuestions,
  getSettings,
  getSimulations,
} = require('../controllers/content.controller');

const router = express.Router();

router.get('/compare', getCompareOptions);
router.get('/dashboard', getDashboard);
router.get('/home', getHome);
router.get('/materials', getMaterials);
router.get('/navigation', getNavigation);
router.get('/quick-questions', getQuickQuestions);
router.get('/settings', getSettings);
router.get('/simulations', getSimulations);

module.exports = router;
