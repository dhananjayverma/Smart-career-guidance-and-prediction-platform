import { useCallback, useEffect, useRef, useState } from 'react';

function stripForSpeech(text: string) {
  return text.replace(/\*\*/g, '').replace(/^[-*]\s+/gm, '').trim();
}

export function useTextToSpeech(language: 'hindi' | 'hinglish' | 'english') {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const speechLang = language === 'english' ? 'en-IN' : 'hi-IN';

  const stopLevelMonitor = useCallback(() => {
    if (analyserFrameRef.current) {
      cancelAnimationFrame(analyserFrameRef.current);
      analyserFrameRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    stopLevelMonitor();
    setIsSpeaking(false);
  }, [stopLevelMonitor]);

  useEffect(() => () => {
    stopSpeaking();
    audioContextRef.current?.close().catch(() => undefined);
  }, [stopSpeaking]);

  const monitorAudioElement = useCallback((audio: HTMLAudioElement) => {
    const context = audioContextRef.current || new AudioContext();
    audioContextRef.current = context;

    const source = context.createMediaElementSource(audio);
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(context.destination);

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((sum, value) => sum + value, 0) / data.length;
      setAudioLevel(Math.min(1, avg / 90));
      analyserFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const speakBrowser = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        if (!('speechSynthesis' in window)) {
          resolve();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(stripForSpeech(text));
        utterance.lang = speechLang;
        utterance.rate = 0.95;
        utterance.pitch = 1;

        let levelTimer: number | null = null;
        utterance.onstart = () => {
          setIsSpeaking(true);
          levelTimer = window.setInterval(() => {
            setAudioLevel(0.35 + Math.random() * 0.45);
          }, 90);
        };
        utterance.onend = () => {
          if (levelTimer) window.clearInterval(levelTimer);
          stopLevelMonitor();
          setIsSpeaking(false);
          resolve();
        };
        utterance.onerror = () => {
          if (levelTimer) window.clearInterval(levelTimer);
          stopLevelMonitor();
          setIsSpeaking(false);
          resolve();
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }),
    [speechLang, stopLevelMonitor]
  );

  const speakFromBase64 = useCallback(
    (base64: string, mimeType = 'audio/mpeg') =>
      new Promise<void>((resolve) => {
        const audio = new Audio(`data:${mimeType};base64,${base64}`);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsSpeaking(true);
          monitorAudioElement(audio);
        };
        audio.onended = () => {
          stopLevelMonitor();
          setIsSpeaking(false);
          audioRef.current = null;
          resolve();
        };
        audio.onerror = () => {
          stopLevelMonitor();
          setIsSpeaking(false);
          audioRef.current = null;
          resolve();
        };

        audio.play().catch(() => resolve());
      }),
    [monitorAudioElement, stopLevelMonitor]
  );

  const speak = useCallback(
    async (text: string, audio?: { base64?: string | null; mimeType?: string | null }) => {
      stopSpeaking();
      if (audio?.base64) {
        await speakFromBase64(audio.base64, audio.mimeType || 'audio/mpeg');
        return;
      }
      await speakBrowser(text);
    },
    [speakBrowser, speakFromBase64, stopSpeaking]
  );

  return {
    isSpeaking,
    audioLevel,
    speak,
    stopSpeaking,
  };
}
