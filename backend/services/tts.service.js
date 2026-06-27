const env = require('../config/env');

const OPENAI_TTS_MODEL = process.env.OPENAI_TTS_MODEL || 'tts-1';
const OPENAI_TTS_VOICE = process.env.OPENAI_TTS_VOICE || 'nova';

function stripMarkdown(text = '') {
  return String(text)
    .replace(/\*\*/g, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 4096);
}

function resolveOpenAiVoice(language) {
  if (language === 'english') return OPENAI_TTS_VOICE;
  return process.env.OPENAI_TTS_VOICE_HI || 'nova';
}

async function synthesizeSpeech(text, { language = 'hinglish' } = {}) {
  const cleanText = stripMarkdown(text);
  if (!cleanText) {
    return { audio: null, mimeType: null, source: 'empty' };
  }

  if (env.openAiApiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.openAiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_TTS_MODEL,
          voice: resolveOpenAiVoice(language),
          input: cleanText,
          response_format: 'mp3',
        }),
      });

      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        return {
          audio: buffer.toString('base64'),
          mimeType: 'audio/mpeg',
          source: 'openai-tts',
        };
      }
    } catch (error) {
      console.warn('OpenAI TTS failed:', error.message);
    }
  }

  return {
    audio: null,
    mimeType: null,
    source: 'browser-fallback',
    text: cleanText,
  };
}

module.exports = { synthesizeSpeech, stripMarkdown };
