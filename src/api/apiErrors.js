import { tStatic } from '../i18n/I18nContext.jsx';
import { contentLocaleNativeName } from '../utils/contentLocale.js';

const IS_DEV = import.meta.env.DEV;

function withDevDetail(userMsg, detail) {
  if (!IS_DEV || !detail) return userMsg;
  return `${userMsg} (${detail})`;
}

/** Fetch failed before HTTP response (offline, DNS, CORS, …). */
export function networkFetchError(cause) {
  return withDevDetail(tStatic('errors.networkUnavailable'), cause?.message);
}

/** Turn HTTP status + body into a user-facing message. */
export function messageFromStatusAndBody(status, text) {
  const raw = String(text ?? '');
  const trimmed = raw.trim();

  // 401 — всегда проблема авторизации: не показываем пользователю внутренние тексты API
  // (в т.ч. VK-ветку общего сервера) — только понятное сообщение.
  if (status === 401) {
    if (trimmed) console.error('[auth] request rejected:', trimmed);
    return tStatic('errors.authRequired');
  }

  if (/^<\?xml/i.test(trimmed) && /<Code>\s*AccessDenied\s*<\/Code>/i.test(trimmed)) {
    return tStatic('errors.networkUnavailable');
  }

  if (status === 502 || status === 503 || status === 504) {
    return tStatic('errors.serverUnavailable');
  }

  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    return tStatic('errors.serverBadResponse');
  }

  if (status === 409) {
    try {
      const j = JSON.parse(trimmed);
      if (j?.existingWord && typeof j.existingWord === 'string') {
        const lang =
          j.contentLocale && typeof j.contentLocale === 'string'
            ? contentLocaleNativeName(j.contentLocale)
            : '';
        const w = j.existingWord.trim();
        return lang
          ? tStatic('errors.wordAlreadyExistsLang', { word: w, language: lang })
          : tStatic('errors.wordAlreadyExists', { word: w });
      }
      if (j?.error && typeof j.error === 'string') return j.error;
    } catch {
      // fallthrough
    }
    return tStatic('errors.wordAlreadyExistsShort');
  }

  try {
    const j = JSON.parse(raw);
    if (j?.error && typeof j.error === 'string') {
      if (j.code === 'llm_unavailable' || j.code === 'llm_payment') {
        return tStatic(`errors.${j.code}`);
      }
      if (j.error === 'Generation failed') {
        return tStatic('errors.llm_unavailable');
      }
      let msg = j.error;
      if (/wrong language for locale (ja|ko)/i.test(msg)) {
        msg = tStatic('errors.wrongLocaleJaKo');
      } else if (/wrong language for locale/i.test(msg)) {
        msg = tStatic('errors.wrongLocaleGeneric');
      } else if (/Headword missing in custom example/i.test(msg)) {
        msg = tStatic('errors.customExampleHeadword');
      }
      if (typeof j.hint === 'string' && j.hint.trim()) {
        msg = `${msg} ${j.hint.trim()}`;
      }
      return msg;
    }
  } catch {
    // not JSON
  }

  if ((status === 502 || status === 503) && !trimmed) {
    return tStatic('errors.serverUnavailable');
  }
  if ((status === 502 || status === 503) && trimmed) {
    return trimmed.length < 800 ? trimmed : tStatic('errors.serverUnavailable');
  }

  if (status >= 500) {
    return tStatic('errors.serverUnavailable');
  }

  if (trimmed && trimmed.length < 400 && !trimmed.startsWith('{')) {
    return trimmed;
  }

  return withDevDetail(tStatic('errors.httpGeneric'), IS_DEV ? `HTTP ${status}` : '');
}
