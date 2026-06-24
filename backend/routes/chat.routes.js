const express = require('express');
const {
  chat,
  chatStream,
  clearSessionMessages,
  getSession,
  saveCareer,
} = require('../controllers/chat.controller');

const router = express.Router();

router.post('/', chat);
router.post('/stream', chatStream);
router.get('/session/:userId', getSession);
router.delete('/session/:userId/messages', clearSessionMessages);
router.post('/session/:userId/saved-careers', saveCareer);

module.exports = router;
