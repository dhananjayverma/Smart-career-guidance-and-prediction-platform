const express = require('express');
const { getSuggestions, getCareers } = require('../controllers/career.controller');

const router = express.Router();

router.get('/', getCareers);
router.get('/suggestions', getSuggestions);

module.exports = router;
