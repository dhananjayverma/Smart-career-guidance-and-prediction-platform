import { useCallback, useEffect, useRef, useState } from 'react';
import type { MentorAvatarState } from '../components/MentorAvatar';
import { sendVoiceChatMessage, synthesizeVoice } from '../lib/api';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useTextToSpeech } from './useTextToSpeech';

interface VoiceConversationOptions {
  language: 'hindi' | 'hinglish' | 'english';
  userId: string;
  education: string;
  profile: { name?: string; interests?: string[] };
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
  onError?: (message: string) => void;
  onStatus?: (message: string) => void;
  sendTextMessage: (text: string) => Promise<{ message: string }>;
}

export function useVoiceConversation(options: VoiceConversationOptions) {
  const {
    language,
    userId,
    education,
    profile,
    onTranscript,
    onResponse,
    onError,
    onStatus,
    sendTextMessage,
  } = options;

  const [talkMode, setTalkMode] = useState(false);
  const [avatarState, setAvatarState] = useState<MentorAvatarState>('idle');
  const talkModeRef = useRef(false);
  const busyRef = useRef(false);
  const loopTimerRef = useRef<number | null>(null);

  const { isListening, isSupported, listenOnceAsync, recordAudio, stopListening } = useSpeechRecognition(language);
  const { isSpeaking, audioLevel, speak, stopSpeaking } = useTextToSpeech(language);

  useEffect(() => {
    talkModeRef.current = talkMode;
  }, [talkMode]);

  useEffect(() => {
    if (isListening) setAvatarState('listening');
    else if (isSpeaking) setAvatarState('speaking');
    else if (busyRef.current) setAvatarState('thinking');
    else if (talkMode) setAvatarState('idle');
  }, [isListening, isSpeaking, talkMode]);

  const clearLoopTimer = useCallback(() => {
    if (loopTimerRef.current) {
      window.clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
  }, []);

  const runTalkTurn = useCallback(async () => {
    if (!talkModeRef.current || busyRef.current) return;

    busyRef.current = true;
    setAvatarState('listening');
    onStatus?.('Listening... speak now');

    try {
      const blob = await recordAudio({
        onStart: () => onStatus?.('Recording your voice...'),
      });

      if (!talkModeRef.current) return;

      setAvatarState('thinking');

      if (blob) {
        onStatus?.('Understanding your voice...');
        try {
          const voiceResult = await sendVoiceChatMessage({
            audio: blob,
            userId,
            education,
            language,
            profile,
          });
          onTranscript?.(voiceResult.transcript);
          onResponse?.(voiceResult.message);
          await speak(voiceResult.message, {
            base64: voiceResult.voice?.audio,
            mimeType: voiceResult.voice?.mimeType,
          });
          return;
        } catch {
          onStatus?.('Server voice failed, using browser speech...');
        }
      }

      onStatus?.('Speak your question...');
      const transcript = await listenOnceAsync((message) => onError?.(message));
      if (!transcript || !talkModeRef.current) return;

      onTranscript?.(transcript);
      setAvatarState('thinking');
      const result = await sendTextMessage(transcript);
      onResponse?.(result.message);
      const tts = await synthesizeVoice(result.message, language).catch(() => null);
      await speak(result.message, {
        base64: tts?.audio,
        mimeType: tts?.mimeType,
      });
    } catch {
      onError?.('Voice turn failed. Try again.');
    } finally {
      busyRef.current = false;
      if (talkModeRef.current) {
        clearLoopTimer();
        loopTimerRef.current = window.setTimeout(() => {
          runTalkTurn();
        }, 600);
      }
    }
  }, [
    clearLoopTimer,
    education,
    language,
    listenOnceAsync,
    onError,
    onResponse,
    onStatus,
    onTranscript,
    profile,
    recordAudio,
    sendTextMessage,
    speak,
    userId,
  ]);

  const startTalkMode = useCallback(() => {
    if (!isSupported && !navigator.mediaDevices?.getUserMedia) {
      onError?.('Voice talk mode is not supported in this browser');
      return;
    }
    stopSpeaking();
    stopListening();
    setTalkMode(true);
    talkModeRef.current = true;
    onStatus?.('Talk mode on — speak with your mentor');
    clearLoopTimer();
    loopTimerRef.current = window.setTimeout(() => {
      runTalkTurn();
    }, 400);
  }, [clearLoopTimer, isSupported, onError, onStatus, runTalkTurn, stopListening, stopSpeaking]);

  const stopTalkMode = useCallback(() => {
    setTalkMode(false);
    talkModeRef.current = false;
    busyRef.current = false;
    clearLoopTimer();
    stopListening();
    stopSpeaking();
    setAvatarState('idle');
    onStatus?.('Talk mode off');
  }, [clearLoopTimer, onStatus, stopListening, stopSpeaking]);

  useEffect(() => () => {
    clearLoopTimer();
    stopListening();
    stopSpeaking();
  }, [clearLoopTimer, stopListening, stopSpeaking]);

  return {
    talkMode,
    avatarState,
    audioLevel,
    isListening,
    isSpeaking,
    isSupported,
    startTalkMode,
    stopTalkMode,
    listenOnceAsync,
    recordAudio,
    stopListening,
    speak,
    stopSpeaking,
  };
}
