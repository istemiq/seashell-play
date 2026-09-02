import { useCallback, useEffect, useRef, useState } from 'react';
import { postSttTranscribe } from '../api/sttApi.js';
import { APP_RESUME_EVENT, APP_SUSPEND_EVENT } from '../utils/appResume.js';
import { normalizeSttLanguage } from '../utils/studySpeech.js';
import { hasTelegramWebApp } from '../platform/telegramApp.js';
import { isCapacitorNative } from '../platform/runtime.js';
import { acquireSharedMicStream } from '../utils/sharedMicStream.js';
import { startRecordingSilenceWatch } from '../utils/recordingSilenceWatch.js';

export function getSpeechRecognition() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isTelegramMiniApp() {
  return hasTelegramWebApp();
}

/** Telegram Mini App — MediaRecorder + server STT (Whisper). Capacitor prefers on-device Web Speech when available. */
export function usesServerSttVoice() {
  return isTelegramMiniApp() || (isCapacitorNative() && !getSpeechRecognition());
}

export function voiceInputMode() {
  if (isTelegramMiniApp()) return 'hold';
  if (getSpeechRecognition()) return 'tap';
  if (isCapacitorNative()) return 'hold';
  return null;
}

function canUseHoldVoice() {
  return typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
}

function pickRecorderMime() {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = isCapacitorNative()
    ? ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
    : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return '';
}

/**
 * Telegram: hold button → MediaRecorder → server STT (no Web Speech API).
 * With tapToToggle: tap to start, tap again to stop (MediaRecorder).
 * Other browsers: tap → Web Speech API.
 */
export function usePracticeVoiceInput({
  onTranscript,
  blockStart,
  t,
  tapToToggle = isTelegramMiniApp(),
  silenceStopMs = isTelegramMiniApp() ? 4000 : 2500,
  speechLang = 'en-US',
}) {
  const baseMode = voiceInputMode();
  const mode = tapToToggle && baseMode === 'hold' ? 'toggle-record' : baseMode;
  const recRef = useRef(null);
  const mediaRecRef = useRef(null);
  const chunksRef = useRef([]);
  const holdStartedAtRef = useRef(0);
  const pointerActiveRef = useRef(false);
  const recordingRef = useRef(false);
  const silenceWatchStopRef = useRef(null);
  const stopMediaRecordingRef = useRef(() => {});

  const stopSilenceWatch = useCallback(() => {
    silenceWatchStopRef.current?.();
    silenceWatchStopRef.current = null;
  }, []);

  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState(null);

  const voiceBusy = listening || transcribing;

  const ensureMicStream = useCallback(async () => {
    try {
      return await acquireSharedMicStream();
    } catch {
      setVoiceError(t('errors.voiceUnavailable'));
      return null;
    }
  }, [t]);

  const disposeRecognizer = useCallback(() => {
    const rec = recRef.current;
    recRef.current = null;
    if (!rec) return;
    try {
      rec.abort();
    } catch {
      try {
        rec.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  const stopMediaRecorder = useCallback(() => {
    const mr = mediaRecRef.current;
    mediaRecRef.current = null;
    if (!mr || mr.state === 'inactive') return;
    try {
      mr.stop();
    } catch {
      // ignore
    }
  }, []);

  const stopVoice = useCallback(() => {
    pointerActiveRef.current = false;
    recordingRef.current = false;
    stopSilenceWatch();
    setListening(false);
    setTranscribing(false);
    stopMediaRecorder();
    disposeRecognizer();
  }, [disposeRecognizer, stopMediaRecorder, stopSilenceWatch]);

  const abortActiveCapture = useCallback(() => {
    stopVoice();
  }, [stopVoice]);

  const uploadRecording = useCallback(
    async (blob) => {
      if (!blob?.size) return;
      setTranscribing(true);
      setVoiceError(null);
      try {
        const sttLang = normalizeSttLanguage(speechLang);
        const text = await postSttTranscribe(blob, { lang: sttLang });
        if (text) onTranscript(text);
        else setVoiceError(t('errors.speechFailed'));
      } catch (e) {
        setVoiceError(e?.message || t('errors.speechFailed'));
      } finally {
        setTranscribing(false);
      }
    },
    [onTranscript, speechLang, t],
  );

  const startMediaRecording = useCallback(async () => {
    if (blockStart || transcribing || recordingRef.current) return false;
    recordingRef.current = true;
    setVoiceError(null);
    holdStartedAtRef.current = Date.now();

    const mime = pickRecorderMime();
    if (typeof MediaRecorder === 'undefined') {
      recordingRef.current = false;
      setVoiceError(t('errors.voiceBrowserUnavailable'));
      return false;
    }

    const stream = await ensureMicStream();
    if (!stream) {
      recordingRef.current = false;
      return false;
    }

    chunksRef.current = [];
    const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    mediaRecRef.current = mr;
    mr.ondataavailable = (ev) => {
      if (ev.data?.size) chunksRef.current.push(ev.data);
    };
    mr.onerror = () => {
      recordingRef.current = false;
      pointerActiveRef.current = false;
      stopSilenceWatch();
      setListening(false);
      mediaRecRef.current = null;
      setVoiceError(t('errors.speechFailed'));
    };
    mr.onstop = () => {
      const heldMs = Date.now() - holdStartedAtRef.current;
      recordingRef.current = false;
      pointerActiveRef.current = false;
      stopSilenceWatch();
      setListening(false);
      mediaRecRef.current = null;
      const minMs = mode === 'toggle-record' ? 120 : 300;
      if (heldMs < minMs) return;
      const blob = new Blob(chunksRef.current, { type: mime });
      chunksRef.current = [];
      void uploadRecording(blob);
    };

    try {
      mr.start();
      setListening(true);
      if (mode === 'toggle-record' && silenceStopMs > 0) {
        stopSilenceWatch();
        silenceWatchStopRef.current = startRecordingSilenceWatch(stream, silenceStopMs, () => {
          stopMediaRecordingRef.current();
        });
      }
      return true;
    } catch {
      recordingRef.current = false;
      pointerActiveRef.current = false;
      setListening(false);
      mediaRecRef.current = null;
      setVoiceError(t('errors.voiceUnavailable'));
      return false;
    }
  }, [blockStart, ensureMicStream, mode, silenceStopMs, stopSilenceWatch, t, uploadRecording, transcribing]);

  const stopMediaRecording = useCallback(() => {
    if (!recordingRef.current) return;
    stopMediaRecorder();
  }, [stopMediaRecorder]);

  stopMediaRecordingRef.current = stopMediaRecording;

  const startHoldRecording = useCallback(async () => {
    if (mode !== 'hold' || blockStart || transcribing || pointerActiveRef.current) return;
    pointerActiveRef.current = true;
    await startMediaRecording();
  }, [blockStart, mode, startMediaRecording, transcribing]);

  const endHoldRecording = useCallback(() => {
    if (mode !== 'hold' || !pointerActiveRef.current) return;
    stopMediaRecording();
  }, [mode, stopMediaRecording]);

  const toggleRecordVoice = useCallback(async () => {
    if (mode !== 'toggle-record') return;
    if (listening || recordingRef.current) {
      stopMediaRecording();
      return;
    }
    if (blockStart || transcribing) return;
    await startMediaRecording();
  }, [blockStart, listening, mode, startMediaRecording, stopMediaRecording, transcribing]);

  const safeStartRecognizer = useCallback(
    (rec) => {
      try {
        rec.start();
        return true;
      } catch {
        try {
          rec.abort();
        } catch {
          // ignore
        }
        try {
          rec.start();
          return true;
        } catch {
          disposeRecognizer();
          setListening(false);
          setVoiceError(t('errors.voiceUnavailable'));
          return false;
        }
      }
    },
    [disposeRecognizer, t],
  );

  const ensureRecognizer = useCallback(() => {
    if (recRef.current) {
      recRef.current.lang = String(speechLang || 'en-US');
      return recRef.current;
    }
    const Ctor = getSpeechRecognition();
    if (!Ctor) return null;

    const rec = new Ctor();
    rec.lang = String(speechLang || 'en-US');
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onresult = (ev) => {
      const text = ev.results?.[0]?.[0]?.transcript?.trim();
      if (text) onTranscript(text);
    };

    rec.onerror = (ev) => {
      const code = String(ev?.error ?? '');
      if (code === 'no-speech' || code === 'aborted') return;
      setListening(false);
      disposeRecognizer();
      setVoiceError(t('errors.speechFailed'));
    };

    rec.onend = () => {
      setListening(false);
    };

    recRef.current = rec;
    return rec;
  }, [disposeRecognizer, onTranscript, speechLang, t]);

  useEffect(() => {
    disposeRecognizer();
  }, [speechLang, disposeRecognizer]);

  const toggleVoice = useCallback(() => {
    if (mode === 'toggle-record') {
      void toggleRecordVoice();
      return;
    }
    if (mode !== 'tap') return;
    if (listening) {
      stopVoice();
      return;
    }
    if (blockStart || transcribing) return;
    setVoiceError(null);
    const rec = ensureRecognizer();
    if (!rec) return;
    setListening(true);
    safeStartRecognizer(rec);
  }, [blockStart, ensureRecognizer, listening, mode, safeStartRecognizer, stopVoice, toggleRecordVoice, transcribing]);

  const onVoicePointerDown = useCallback(
    (ev) => {
      if (mode !== 'hold') return;
      ev.preventDefault();
      void startHoldRecording();
    },
    [mode, startHoldRecording],
  );

  const onVoicePointerUp = useCallback(() => {
    if (mode !== 'hold') return;
    endHoldRecording();
  }, [endHoldRecording, mode]);

  const onVoicePointerCancel = useCallback(() => {
    if (mode !== 'hold') return;
    endHoldRecording();
  }, [endHoldRecording, mode]);

  const onVoiceTouchStart = useCallback(
    (ev) => {
      if (mode !== 'hold') return;
      ev.preventDefault();
      void startHoldRecording();
    },
    [mode, startHoldRecording],
  );

  const onVoiceTouchEnd = useCallback(
    (ev) => {
      if (mode !== 'hold') return;
      ev.preventDefault();
      endHoldRecording();
    },
    [endHoldRecording, mode],
  );

  useEffect(() => {
    if (!usesServerSttVoice() || blockStart) return;
    void acquireSharedMicStream().catch(() => {});
  }, [blockStart]);

  useEffect(
    () => () => {
      abortActiveCapture();
    },
    [abortActiveCapture],
  );

  useEffect(() => {
    const onLifecycle = () => abortActiveCapture();
    window.addEventListener(APP_RESUME_EVENT, onLifecycle);
    window.addEventListener(APP_SUSPEND_EVENT, onLifecycle);
    return () => {
      window.removeEventListener(APP_RESUME_EVENT, onLifecycle);
      window.removeEventListener(APP_SUSPEND_EVENT, onLifecycle);
    };
  }, [abortActiveCapture]);

  return {
    voiceMode: mode,
    voiceAvailable:
      mode === 'hold' || mode === 'toggle-record' ? canUseHoldVoice() : Boolean(getSpeechRecognition()),
    listening,
    transcribing,
    voiceBusy,
    voiceError,
    clearVoiceError: () => setVoiceError(null),
    toggleVoice,
    onVoicePointerDown,
    onVoicePointerUp,
    onVoicePointerCancel,
    onVoiceTouchStart,
    onVoiceTouchEnd,
    stopVoice,
  };
};
