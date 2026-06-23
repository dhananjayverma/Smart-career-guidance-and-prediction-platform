const express = require('express');
const { getColleges } = require('../controllers/college.controller');

const router = express.Router();

router.get('/', getColleges);

module.exports = router;
