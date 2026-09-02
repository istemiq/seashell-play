import { loadSettings, getSavedTtsLocaleForLearn } from './settings.js';
import { postTtsSpeak, resolveTtsPlayUrl } from '../api/ttsApi.js';
import { tStatic } from '../i18n/I18nContext.jsx';
import { normalizeLearnLocale, LEARN_LOCALE_CODES } from '../i18n/learnLocales.js';
import { STUDY_PIPER_UNSUPPORTED_CODES } from '../hooks/useLearnLocale.js';
import { speechLocaleForLearn } from './studySpeech.js';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { isCapacitorNative } from '../platform/runtime.js';

/** One shared element — mobile WebViews allow play after async only on the element unlocked by the tap. */
let sharedAudio = null;
let activeAudio = null;
let blobUrlToRevoke = null;

/** mp3 blob URLs keyed by remote URL — avoids re-download on repeat Listen taps. */
const mp3BlobCache = new Map();
const MP3_CACHE_MAX = 48;

const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

function getSharedAudio() {
  if (typeof Audio === 'undefined') return null;
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = 'auto';
    sharedAudio.playsInline = true;
    sharedAudio.crossOrigin = 'anonymous';
    sharedAudio.setAttribute('playsinline', '');
    sharedAudio.setAttribute('webkit-playsinline', '');
  }
  return sharedAudio;
}

function revokeBlobUrl() {
  if (!blobUrlToRevoke) return;
  try {
    URL.revokeObjectURL(blobUrlToRevoke);
  } catch {
    /* ignore */
  }
  blobUrlToRevoke = null;
}

/** Call synchronously from a user tap, before any await — unlocks Piper mp3 on iOS/Android WebView. */
export function unlockAudioPlayback() {
  const a = getSharedAudio();
  if (!a) return false;
  try {
    a.pause();
    revokeBlobUrl();
    a.src = SILENT_WAV;
    void a.play().catch(() => {});
    return true;
  } catch {
    return false;
  }
}

function canUseWebSpeech() {
  return (
    typeof window !== 'undefined' &&
    !!window.speechSynthesis &&
    typeof window.SpeechSynthesisUtterance === 'function'
  );
}

function stopAllPlayback() {
  revokeBlobUrl();
  const a = getSharedAudio();
  if (a) {
    try {
      a.pause();
      a.removeAttribute('src');
      a.load();
    } catch {
      /* ignore */
    }
  }
  activeAudio = null;
  if (canUseWebSpeech()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
  if (isCapacitorNative()) {
    void TextToSpeech.stop().catch(() => {});
  }
}

function pickVoiceForLocale(locale) {
  const voices = window.speechSynthesis.getVoices?.() || [];
  const lc = String(locale ?? '').trim().toLowerCase();
  if (!lc) return null;
  const prefix = lc.split('-')[0];
  const region = lc.includes('-') ? lc.split('-')[1] : '';
  const matching = voices.filter((v) => {
    const lang = String(v?.lang || '').toLowerCase();
    if (lang === lc) return true;
    if (region && lang === `${prefix}-${region}`) return true;
    if (!region && (lang.startsWith(`${prefix}-`) || lang === prefix)) return true;
    return false;
  });
  if (!matching.length) return null;
  if (lc === 'en-gb') {
    const gb = matching.find((v) =>
      /en-gb|british|uk|gb/i.test(`${v.lang} ${v.name}`),
    );
    if (gb) return gb;
  }
  if (lc === 'en-us') {
    const us = matching.find((v) =>
      /en-us|american|us/i.test(`${v.lang} ${v.name}`),
    );
    if (us) return us;
  }
  const preferred = matching.find((v) =>
    /google|microsoft|samsung|apple|siri|alex|zira|mark|yuna|heera|daniel/i.test(String(v.name || '')),
  );
  return preferred || matching[0];
}

async function ensureVoicesLoaded(timeoutMs = 1200) {
  if (!canUseWebSpeech()) return;
  const initial = window.speechSynthesis.getVoices?.() || [];
  if (initial.length) return;
  await new Promise((resolve) => {
    let done = false;
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      resolve();
    }, timeoutMs);
    window.speechSynthesis.onvoiceschanged = () => {
      if (done) return;
      done = true;
      clearTimeout(t);
      resolve();
    };
  });
}

/** Android/iOS system TTS — fallback when Piper unavailable. Returns once playback starts. */
function tryNativeTts(text, locale, { onStart } = {}) {
  const s = loadSettings();
  if (!s.ttsEnabled || !isCapacitorNative()) return false;
  const lang = resolveSpeakLocale(locale);
  try {
    void TextToSpeech.stop().catch(() => {});
    onStart?.();
    void TextToSpeech.speak({
      text,
      lang,
      rate: Math.min(2, Math.max(0.5, Number(s.ttsRate) || 0.95)),
      pitch: 1.0,
      volume: 1.0,
    }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

async function tryWebSpeech(text, locale, { onStart } = {}) {
  const s = loadSettings();
  if (!s.ttsEnabled) return false;
  if (!canUseWebSpeech()) return false;
  const speechLocale = effectiveTtsLocale(locale || s.ttsLocale || loadSettings().learnLocale);
  try {
    await ensureVoicesLoaded(400);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechLocale;
    u.rate = Number(s.ttsRate) || 0.95;
    const voice = pickVoiceForLocale(speechLocale);
    if (voice) u.voice = voice;

    const spoke = await new Promise((resolve) => {
      u.onstart = () => onStart?.();
      u.onend = () => resolve(true);
      u.onerror = () => resolve(false);
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
        if (window.speechSynthesis.paused) {
          try {
            window.speechSynthesis.resume();
          } catch {
            /* ignore */
          }
        }
      } catch {
        resolve(false);
      }
    });
    return spoke;
  } catch {
    return false;
  }
}

function rememberMp3Blob(remote, blobUrl) {
  if (mp3BlobCache.size >= MP3_CACHE_MAX) {
    const oldest = mp3BlobCache.keys().next().value;
    if (oldest) {
      try {
        URL.revokeObjectURL(mp3BlobCache.get(oldest));
      } catch {
        /* ignore */
      }
      mp3BlobCache.delete(oldest);
    }
  }
  mp3BlobCache.set(remote, blobUrl);
}

async function audioSrcForUrl(url) {
  const remote = resolveTtsPlayUrl(url);
  if (!remote) return null;

  const cached = mp3BlobCache.get(remote);
  if (cached) return cached;

  if (!isCapacitorNative()) return remote;

  try {
    const res = await fetch(remote);
    if (!res.ok) return remote;
    const blob = await res.blob();
    if (!blob.size) return remote;
    const blobUrl = URL.createObjectURL(blob);
    rememberMp3Blob(remote, blobUrl);
    return blobUrl;
  } catch {
    return remote;
  }
}

async function playUrl(url, { onStart } = {}) {
  const remote = resolveTtsPlayUrl(url);
  if (!remote) return false;

  const a = getSharedAudio();
  if (!a) return false;

  activeAudio = a;

  const tryPlaySrc = (src) =>
    new Promise((resolve) => {
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        a.removeEventListener('error', onErr);
        a.removeEventListener('playing', onPlaying);
        a.removeEventListener('canplaythrough', onReady);
        a.removeEventListener('loadeddata', onReady);
        resolve(ok);
      };
      let started = false;
      const onErr = () => finish(false);
      const onPlaying = () => {
        onStart?.();
        finish(true);
      };
      const onReady = () => {
        if (started) return;
        started = true;
        a.play().catch(() => finish(false));
      };
      const timer = window.setTimeout(() => finish(false), 12000);
      a.addEventListener('error', onErr, { once: true });
      a.addEventListener('playing', onPlaying, { once: true });
      a.addEventListener('canplaythrough', onReady, { once: true });
      a.addEventListener('loadeddata', onReady, { once: true });
      try {
        a.pause();
        a.currentTime = 0;
      } catch {
        /* ignore */
      }
      if (!src.startsWith('blob:')) revokeBlobUrl();
      else blobUrlToRevoke = src;
      a.src = src;
      a.load();
      if (a.readyState >= 2) onReady();
    });

  try {
    const cached = mp3BlobCache.get(remote);
    if (cached && (await tryPlaySrc(cached))) return true;

    if (isCapacitorNative()) {
      if (await tryPlaySrc(remote)) {
        void fetch(remote)
          .then((r) => (r.ok ? r.blob() : null))
          .then((blob) => {
            if (!blob?.size || mp3BlobCache.has(remote)) return;
            rememberMp3Blob(remote, URL.createObjectURL(blob));
          })
          .catch(() => {});
        return true;
      }
    }

    const src = await audioSrcForUrl(url);
    if (!src) return false;
    return tryPlaySrc(src);
  } finally {
    if (activeAudio === a) activeAudio = null;
  }
}

function learnCodeForSpeak(learnOrTtsLocale) {
  const raw = String(learnOrTtsLocale ?? '').trim().toLowerCase();
  if (LEARN_LOCALE_CODES.has(raw)) return normalizeLearnLocale(raw);
  const prefix = raw.split('-')[0];
  if (LEARN_LOCALE_CODES.has(prefix)) return normalizeLearnLocale(prefix);
  return normalizeLearnLocale(raw);
}

function effectiveTtsLocale(learnOrTtsLocale) {
  const s = loadSettings();
  const learnCode = learnCodeForSpeak(learnOrTtsLocale);
  const saved = getSavedTtsLocaleForLearn(s, learnCode);
  if (saved) return saved;

  const pref = String(s.ttsLocale || '').trim();
  const fallback = resolveSpeakLocale(learnOrTtsLocale);

  if (learnCode === 'en' && (pref === 'en-US' || pref === 'en-GB')) return pref;
  if (learnCode === 'zh' && (pref === 'zh-CN' || pref === 'zh-TW')) return pref;
  if (pref && pref.split('-')[0].toLowerCase() === learnCode) return pref;

  return fallback;
}

function resolveSpeakLocale(learnOrTtsLocale) {
  const raw = String(learnOrTtsLocale ?? '').trim().toLowerCase();
  if (raw === 'en-gb') return 'en-GB';
  if (raw === 'en-us' || raw === 'en') return 'en-US';
  if (raw === 'ru-ru' || raw === 'ru') return 'ru-RU';
  if (raw === 'ar-jo' || raw === 'ar' || raw.startsWith('ar-')) return 'ar-JO';
  if (raw === 'ug-cn' || raw === 'ug') return 'ug-CN';
  if (raw === 'ba-ru' || raw === 'ba') return 'ba';
  if (raw === 'nb-no' || raw === 'nb') return 'no-NO';
  if (/^[a-z]{2}-[a-z]{2}$/i.test(raw)) {
    const normalized = `${raw.slice(0, 2).toLowerCase()}-${raw.slice(-2).toUpperCase()}`;
    if (normalized === 'nb-NO') return 'no-NO';
    return normalized;
  }
  return speechLocaleForLearn(raw || loadSettings().learnLocale);
}

/** Match server TTS_TEXT_MAX_LEN default — clip long practice replies instead of failing. */
const TTS_SPEAK_MAX_LEN = 400;

function clipTextForTts(text, maxLen = TTS_SPEAK_MAX_LEN) {
  const t = String(text ?? '').trim();
  if (!t || t.length <= maxLen) return t;
  const slice = t.slice(0, maxLen);
  const lastBreak = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? '),
    slice.lastIndexOf('…'),
    slice.lastIndexOf('\n'),
  );
  if (lastBreak > maxLen * 0.35) {
    return slice.slice(0, lastBreak + 1).trim();
  }
  return slice.trim();
}

/**
 * Warm Piper mp3 cache while the user reads the reply — next Listen tap is instant.
 */
export function prefetchStudyTts(text, learnOrTtsLocale, { ttsText } = {}) {
  const line = clipTextForTts(String(text ?? '').trim());
  if (!line) return;
  const s = loadSettings();
  if (!s.ttsEnabled) return;

  const locale = effectiveTtsLocale(learnOrTtsLocale);
  const markedRaw = String(ttsText ?? '').trim();
  const marked = markedRaw ? clipTextForTts(markedRaw) : undefined;
  const speakLine = marked || line;
  const learnCode = learnCodeForSpeak(learnOrTtsLocale);
  if (STUDY_PIPER_UNSUPPORTED_CODES.has(learnCode)) return;

  void postTtsSpeak({
    text: speakLine,
    ttsText: marked && marked !== speakLine ? marked : undefined,
    locale,
    rate: Number(s.ttsRate) || 0.95,
  })
    .then((r) => {
      const remote = resolveTtsPlayUrl(r.url);
      if (!remote || mp3BlobCache.has(remote)) return;
      return fetch(remote)
        .then((res) => (res.ok ? res.blob() : null))
        .then((blob) => {
          if (!blob?.size) return;
          rememberMp3Blob(remote, URL.createObjectURL(blob));
        });
    })
    .catch(() => {});
}

/**
 * Speak study-language text via Piper backend (mp3), native/Web Speech as fallback.
 */
export async function speakStudyText(text, learnOrTtsLocale, { ttsText, onStart } = {}) {
  const line = clipTextForTts(String(text ?? '').trim());
  if (!line) return;
  const locale = effectiveTtsLocale(learnOrTtsLocale);
  const markedRaw = String(ttsText ?? '').trim();
  const marked = markedRaw ? clipTextForTts(markedRaw) : undefined;
  const speakLine = marked || line;

  stopAllPlayback();

  const s = loadSettings();
  if (!s.ttsEnabled) {
    throw new Error(tStatic('errors.ttsUnavailable'));
  }

  const learnCode = learnCodeForSpeak(learnOrTtsLocale);
  const piperOk = !STUDY_PIPER_UNSUPPORTED_CODES.has(learnCode);
  let piperError = null;

  // Cached Piper mp3 first — fast and supports stress marks (ttsText).
  if (piperOk) {
    try {
      const r = await postTtsSpeak({
        text: speakLine,
        ttsText: marked && marked !== speakLine ? marked : undefined,
        locale,
        rate: Number(s.ttsRate) || 0.95,
      });
      if (await playUrl(r.url, { onStart })) return;
      piperError = new Error(tStatic('errors.ttsUnavailable'));
    } catch (e) {
      piperError = e instanceof Error ? e : new Error(tStatic('errors.ttsUnavailable'));
    }
  }

  if (isCapacitorNative() && tryNativeTts(line, locale, { onStart })) return;

  if (await tryWebSpeech(line, locale, { onStart })) return;

  throw piperError || new Error(tStatic('errors.ttsUnavailable'));
}

/** Speak English via Piper / Web Speech. */
export async function speakEnglish(text, opts = {}) {
  return speakStudyText(text, 'en-US', opts);
}
