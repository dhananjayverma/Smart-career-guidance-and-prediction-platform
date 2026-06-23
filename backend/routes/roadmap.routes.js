const express = require('express');
const { createRoadmap, getRoadmapTemplates } = require('../controllers/roadmap.controller');

const router = express.Router();

router.get('/', getRoadmapTemplates);
router.post('/', createRoadmap);

module.exports = router;
