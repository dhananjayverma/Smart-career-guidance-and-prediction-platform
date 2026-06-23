const express = require('express');
const { chat, getSession, saveCareer } = require('../controllers/chat.controller');

const router = express.Router();

router.post('/', chat);
router.get('/session/:userId', getSession);
router.post('/session/:userId/saved-careers', saveCareer);

module.exports = router;
