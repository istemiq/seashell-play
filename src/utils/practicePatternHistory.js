import { normalizeLearnLocale } from '../i18n/learnLocales.js';
import { getStudyModuleCode } from '../modules/learnModuleSwitch.js';

const LEGACY_SESSION_KEY = 'seashell_practice_session_pattern';
const HISTORY_KEY_PREFIX = 'seashell_pattern_history_v1_';

function patternSessionKey(learnLocale) {
  return `${LEGACY_SESSION_KEY}_${normalizeLearnLocale(learnLocale)}`;
}

function patternHistoryKey(learnLocale) {
  return `${HISTORY_KEY_PREFIX}${normalizeLearnLocale(learnLocale)}`;
}

function parseSessionId(raw) {
  const id = parseInt(String(raw ?? ''), 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/** Active pattern session id — localStorage (survives Mini App restart). */
export function loadPatternPracticeSessionId(learnLocale = 'en') {
  if (typeof localStorage !== 'undefined') {
    const id = parseSessionId(localStorage.getItem(patternSessionKey(learnLocale)));
    if (id) return id;
  }
  return null;
}

export function savePatternPracticeSessionId(learnLocale, sessionId) {
  const code = normalizeLearnLocale(learnLocale);
  if (typeof localStorage !== 'undefined') {
    const key = patternSessionKey(code);
    if (sessionId) localStorage.setItem(key, String(sessionId));
    else localStorage.removeItem(key);
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
  }
}

/** @typedef {{ id: number, mode?: string, patternSeed?: string | null, targetLang?: string, updatedAt?: number, createdAt?: number, userTurnCount?: number, lastPreview?: string | null }} PatternHistoryEntry */

/** @returns {PatternHistoryEntry[]} */
export function loadPatternHistoryCache(learnLocale) {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(patternHistoryKey(learnLocale));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const study = getStudyModuleCode(learnLocale);
    return parsed
      .filter((s) => s && Number.isFinite(Number(s.id)) && getStudyModuleCode(s.targetLang) === study)
      .slice(0, 10);
  } catch {
    return [];
  }
}

/** @param {PatternHistoryEntry[]} sessions */
export function savePatternHistoryCache(learnLocale, sessions) {
  if (typeof localStorage === 'undefined') return;
  const study = getStudyModuleCode(learnLocale);
  const trimmed = (Array.isArray(sessions) ? sessions : [])
    .filter((s) => s && Number.isFinite(Number(s.id)) && getStudyModuleCode(s.targetLang) === study)
    .slice(0, 10);
  localStorage.setItem(patternHistoryKey(learnLocale), JSON.stringify(trimmed));
}

/** @param {PatternHistoryEntry} entry */
export function upsertPatternHistoryCache(learnLocale, entry) {
  if (!entry?.id) return;
  const prev = loadPatternHistoryCache(learnLocale);
  const next = [entry, ...prev.filter((s) => s.id !== entry.id)]
    .sort((a, b) => Number(b.updatedAt ?? 0) - Number(a.updatedAt ?? 0))
    .slice(0, 10);
  savePatternHistoryCache(learnLocale, next);
}

export function removePatternHistoryCache(learnLocale, sessionId) {
  const prev = loadPatternHistoryCache(learnLocale);
  savePatternHistoryCache(
    learnLocale,
    prev.filter((s) => s.id !== sessionId),
  );
}

export function patternHistoryTitle(seed, fallback = '…') {
  const text = String(seed ?? '').trim().replace(/\s+/g, ' ');
  if (!text) return fallback;
  return text.length > 72 ? `${text.slice(0, 69)}…` : text;
}
