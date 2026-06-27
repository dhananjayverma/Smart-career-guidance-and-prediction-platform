const express = require('express');
const multer = require('multer');
const { speechToText, textToSpeech, voiceChat } = require('../controllers/voice.controller');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

router.post('/stt', upload.single('audio'), speechToText);
router.post('/tts', textToSpeech);
router.post('/chat', upload.single('audio'), voiceChat);

module.exports = router;
