import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export function useSpeechRecognition(language: 'hindi' | 'hinglish' | 'english') {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const speechLang = language === 'english' ? 'en-IN' : 'hi-IN';

  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor();
    setIsSupported(Boolean(Ctor));

    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = speechLang;
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [speechLang]);

  const stopMediaStream = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    stopMediaStream();
  }, [stopMediaStream]);

  const listenOnce = useCallback(
    (onResult: (transcript: string) => void, onError?: (message: string) => void) => {
      const recognition = recognitionRef.current;
      if (!recognition) {
        onError?.('Voice input not supported in this browser');
        return () => undefined;
      }

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => {
        setIsListening(false);
        onError?.('Voice input error. Try again.');
      };
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim();
        if (transcript) onResult(transcript);
      };

      try {
        recognition.start();
      } catch {
        onError?.('Microphone is busy. Try again.');
        return () => undefined;
      }

      return () => {
        recognition.stop();
        setIsListening(false);
      };
    },
    []
  );

  const recordAudio = useCallback(
    async (
      options: {
        maxMs?: number;
        silenceMs?: number;
        onStart?: () => void;
        onStop?: () => void;
      } = {}
    ): Promise<Blob | null> => {
      const { maxMs = 12000, silenceMs = 1800, onStart, onStop } = options;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        chunksRef.current = [];

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';

        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        let silenceStartedAt: number | null = null;
        let stopped = false;

        const stopRecording = () => {
          if (stopped) return;
          stopped = true;
          if (recorder.state !== 'inactive') recorder.stop();
          onStop?.();
        };

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };

        const monitor = window.setInterval(() => {
          analyser.getByteFrequencyData(data);
          const volume = data.reduce((sum, value) => sum + value, 0) / data.length;
          if (volume < 8) {
            if (!silenceStartedAt) silenceStartedAt = Date.now();
            if (Date.now() - silenceStartedAt > silenceMs) stopRecording();
          } else {
            silenceStartedAt = null;
          }
        }, 120);

        const maxTimer = window.setTimeout(stopRecording, maxMs);

        const blob = await new Promise<Blob | null>((resolve) => {
          recorder.onstop = async () => {
            window.clearInterval(monitor);
            window.clearTimeout(maxTimer);
            await audioContext.close().catch(() => undefined);
            stopMediaStream();
            setIsListening(false);
            const recorded = new Blob(chunksRef.current, { type: mimeType });
            resolve(recorded.size > 800 ? recorded : null);
          };

          recorder.start(250);
          setIsListening(true);
          onStart?.();
        });

        return blob;
      } catch {
        stopMediaStream();
        setIsListening(false);
        return null;
      }
    },
    [stopMediaStream]
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
    stopMediaStream();
    setIsListening(false);
  }, [stopMediaStream]);

  const listenOnceAsync = useCallback(
    (onError?: (message: string) => void) =>
      new Promise<string | null>((resolve) => {
        let settled = false;
        const finish = (value: string | null) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeoutId);
          resolve(value);
        };

        listenOnce((transcript) => finish(transcript), (message) => {
          onError?.(message);
          finish(null);
        });

        const timeoutId = window.setTimeout(() => finish(null), 15000);
      }),
    [listenOnce]
  );

  return {
    isListening,
    isSupported,
    listenOnce,
    listenOnceAsync,
    recordAudio,
    stopListening,
  };
}
