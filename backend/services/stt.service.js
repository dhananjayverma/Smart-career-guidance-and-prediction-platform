const env = require('../config/env');

const GROQ_WHISPER_MODEL = process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo';

function resolveWhisperLanguage(language) {
  if (language === 'english') return 'en';
  if (language === 'hindi') return 'hi';
  return 'hi';
}

function buildMultipartBody(fields, file) {
  const boundary = `----NextStepVoice${Date.now()}`;
  const chunks = [];

  Object.entries(fields).forEach(([key, value]) => {
    chunks.push(
      `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
    );
  });

  chunks.push(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.filename}"\r\nContent-Type: ${file.mimeType}\r\n\r\n`
  );

  const closing = `\r\n--${boundary}--\r\n`;
  const body = Buffer.concat([
    Buffer.from(chunks.join('')),
    file.buffer,
    Buffer.from(closing),
  ]);

  return { body, contentType: `multipart/form-data; boundary=${boundary}` };
}

async function transcribeAudio(buffer, { language = 'hinglish', mimeType = 'audio/webm' } = {}) {
  if (!env.groqApiKey) {
    return { transcript: null, source: 'unavailable', error: 'GROQ_API_KEY not configured' };
  }

  const extension = mimeType.includes('wav') ? 'wav' : mimeType.includes('mp4') ? 'mp4' : 'webm';
  const { body, contentType } = buildMultipartBody(
    {
      model: GROQ_WHISPER_MODEL,
      language: resolveWhisperLanguage(language),
      response_format: 'json',
      temperature: '0',
    },
    {
      filename: `voice.${extension}`,
      mimeType,
      buffer,
    }
  );

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.groqApiKey}`,
      'Content-Type': contentType,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      transcript: null,
      source: 'groq-whisper',
      error: `Whisper failed: ${response.status} ${errorText.slice(0, 180)}`,
    };
  }

  const payload = await response.json();
  return {
    transcript: String(payload.text || '').trim(),
    source: 'groq-whisper',
  };
}

module.exports = { transcribeAudio };
