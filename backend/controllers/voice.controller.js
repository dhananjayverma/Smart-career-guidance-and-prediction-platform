const { transcribeAudio } = require('../services/stt.service');
const { synthesizeSpeech } = require('../services/tts.service');
const { processChatBody } = require('./chat.controller');

async function speechToText(req, res, next) {
  try {
    if (!req.file?.buffer?.length) {
      return res.status(400).json({ success: false, message: 'audio file is required' });
    }

    const language = req.body.language || 'hinglish';
    const result = await transcribeAudio(req.file.buffer, {
      language,
      mimeType: req.file.mimetype || 'audio/webm',
    });

    if (!result.transcript) {
      return res.status(422).json({
        success: false,
        message: result.error || 'Could not transcribe audio',
        data: result,
      });
    }

    return res.json({
      success: true,
      data: {
        transcript: result.transcript,
        source: result.source,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function textToSpeech(req, res, next) {
  try {
    const text = String(req.body.text || '').trim();
    if (!text) {
      return res.status(400).json({ success: false, message: 'text is required' });
    }

    const result = await synthesizeSpeech(text, {
      language: req.body.language || 'hinglish',
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function voiceChat(req, res, next) {
  try {
    if (!req.file?.buffer?.length) {
      return res.status(400).json({ success: false, message: 'audio file is required' });
    }

    const language = req.body.language || 'hinglish';
    let profile = {};
    if (req.body.profile) {
      try {
        profile = typeof req.body.profile === 'string' ? JSON.parse(req.body.profile) : req.body.profile;
      } catch {
        profile = {};
      }
    }

    const stt = await transcribeAudio(req.file.buffer, {
      language,
      mimeType: req.file.mimetype || 'audio/webm',
    });

    if (!stt.transcript) {
      return res.status(422).json({
        success: false,
        message: stt.error || 'Could not understand audio. Try again or type your question.',
        data: { sttSource: stt.source },
      });
    }

    const chatResult = await processChatBody({
      message: stt.transcript,
      userId: req.body.userId || 'guest',
      education: req.body.education,
      language,
      profile,
    });

    const tts = await synthesizeSpeech(chatResult.data.message, { language });

    return res.json({
      success: true,
      data: {
        transcript: stt.transcript,
        sttSource: stt.source,
        ...chatResult.data,
        voice: {
          audio: tts.audio,
          mimeType: tts.mimeType,
          source: tts.source,
          text: tts.text || chatResult.data.message,
        },
      },
    });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
}

module.exports = { speechToText, textToSpeech, voiceChat };
