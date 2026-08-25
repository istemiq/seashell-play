import { loadSettings, getSavedTtsLocaleForLearn } from './settings.js';
import { postTtsSpeak, resolveTtsPlayUrl } from '../api/ttsApi.js';
import { tStatic } from '../i18n/I18nContext.jsx';
import { normalizeLearnLocale, LEARN_LOCALE_CODES } from '../i18n/learnLocales.js';
import { STUDY_PIPER_UNSUPPORTED_CODES } from '../hooks/useLearnLocale.js';
import { speechLocaleForLearn } from './studySpeech.js';

/** One shared element — mobile WebViews allow play after async only on the element unlocked by the tap. */
let sharedAudio = null;
let activeAudio = null;
let blobUrlToRevoke = null;

const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

function getSharedAudio() {
  if (typeof Audio === 'undefined') return null;
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = 'auto';
    sharedAudio.playsInline = true;
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
export async function unlockAudioPlayback() {
  const a = getSharedAudio();
  if (!a) return false;
  try {
    a.pause();
    revokeBlobUrl();
    a.src = SILENT_WAV;
    await Promise.race([
      a.play(),
      new Promise((resolve) => window.setTimeout(resolve, 400)),
    ]);
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

async function tryWebSpeech(text, locale) {
  const s = loadSettings();
  if (!s.ttsEnabled) return false;
  if (!canUseWebSpeech()) return false;
  const speechLocale = effectiveTtsLocale(locale || s.ttsLocale || loadSettings().learnLocale);
  try {
    await ensureVoicesLoaded();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechLocale;
    u.rate = Number(s.ttsRate) || 0.95;
    const voice = pickVoiceForLocale(speechLocale);
    if (voice) u.voice = voice;

    const spoke = await new Promise((resolve) => {
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

async function playUrl(url) {
  const remote = resolveTtsPlayUrl(url);
  if (!remote) return false;

  const a = getSharedAudio();
  if (!a) return false;

  activeAudio = a;
  revokeBlobUrl();

  try {
    return await new Promise((resolve) => {
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        a.removeEventListener('ended', onEnd);
        a.removeEventListener('error', onErr);
        a.removeEventListener('canplaythrough', onReady);
        a.removeEventListener('loadeddata', onReady);
        resolve(ok);
      };
      let started = false;
      const onEnd = () => finish(true);
      const onErr = () => finish(false);
      const onReady = () => {
        if (started) return;
        started = true;
        a.play().catch(() => finish(false));
      };
      const timer = window.setTimeout(() => finish(false), 45000);
      a.addEventListener('ended', onEnd, { once: true });
      a.addEventListener('error', onErr, { once: true });
      a.addEventListener('canplaythrough', onReady, { once: true });
      a.addEventListener('loadeddata', onReady, { once: true });
      a.src = remote;
      a.load();
      if (a.readyState >= 2) onReady();
    });
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
 * Speak study-language text via Piper backend (mp3), Web Speech as fallback.
 */
export async function speakStudyText(text, learnOrTtsLocale, { ttsText } = {}) {
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

  if (piperOk) {
    try {
      const r = await postTtsSpeak({
        text: speakLine,
        ttsText: marked && marked !== speakLine ? marked : undefined,
        locale,
        rate: Number(s.ttsRate) || 0.95,
      });
      if (await playUrl(r.url)) return;
      piperError = new Error(tStatic('errors.ttsUnavailable'));
    } catch (e) {
      piperError = e instanceof Error ? e : new Error(tStatic('errors.ttsUnavailable'));
    }
  }

  if (await tryWebSpeech(line, locale)) return;

  throw piperError || new Error(tStatic('errors.ttsUnavailable'));
}

/** Speak English via Piper / Web Speech. */
export async function speakEnglish(text) {
  return speakStudyText(text, 'en-US');
}
