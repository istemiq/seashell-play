import { normalizeLearnLocale } from '../i18n/learnLocales.js';

/** BCP-47 for Piper / server TTS and Web Speech API. */
export function speechLocaleForLearn(learnLocale) {
  const code = normalizeLearnLocale(learnLocale);
  if (code === 'ru') return 'ru-RU';
  if (code === 'ar') return 'ar-JO';
  if (code === 'es') return 'es-ES';
  if (code === 'pt') return 'pt-BR';
  if (code === 'it') return 'it-IT';
  if (code === 'el') return 'el-GR';
  if (code === 'fa') return 'fa-IR';
  if (code === 'da') return 'da-DK';
  if (code === 'nl') return 'nl-NL';
  if (code === 'fr') return 'fr-FR';
  if (code === 'de') return 'de-DE';
  if (code === 'tr') return 'tr-TR';
  if (code === 'sv') return 'sv-SE';
  if (code === 'no') return 'no-NO';
  if (code === 'fi') return 'fi-FI';
  if (code === 'ko') return 'ko-KR';
  if (code === 'ja') return 'ja-JP';
  if (code === 'zh') return 'zh-CN';
  if (code === 'uk') return 'uk-UA';
  if (code === 'pl') return 'pl-PL';
  if (code === 'hi') return 'hi-IN';
  if (code === 'ur') return 'ur-PK';
  if (code === 'az') return 'az-AZ';
  if (code === 'ba') return 'ba';
  if (code === 'ug') return 'ug-CN';
  if (code === 'vi') return 'vi-VN';
  if (code === 'cs') return 'cs-CZ';
  if (code === 'hu') return 'hu-HU';
  if (code === 'ro') return 'ro-RO';
  if (code === 'id') return 'id-ID';
  if (code === 'he') return 'he-IL';
  if (code === 'ca') return 'ca-ES';
  if (code === 'sr') return 'sr-RS';
  const raw = String(learnLocale ?? '').trim();
  if (raw.toLowerCase().startsWith('en-gb')) return 'en-GB';
  return 'en-US';
}

/** @deprecated alias */
export const ttsLocaleForLearn = speechLocaleForLearn;

/** Whisper language code. */
export function sttLanguageForLearn(learnLocale) {
  return normalizeSttLanguage(learnLocale);
}

/** Map learn locale or BCP-47 to Whisper lang code. */
export function normalizeSttLanguage(code) {
  const lc = String(code ?? 'en').trim().toLowerCase();
  if (lc === 'ru' || lc.startsWith('ru-')) return 'ru';
  if (lc === 'ar' || lc.startsWith('ar-')) return 'ar';
  if (lc === 'es' || lc.startsWith('es-')) return 'es';
  if (lc === 'pt' || lc.startsWith('pt-')) return 'pt';
  if (lc === 'it' || lc.startsWith('it-')) return 'it';
  if (lc === 'el' || lc.startsWith('el-')) return 'el';
  if (lc === 'fa' || lc.startsWith('fa-')) return 'fa';
  if (lc === 'da' || lc.startsWith('da-')) return 'da';
  if (lc === 'nl' || lc.startsWith('nl-')) return 'nl';
  if (lc === 'fr' || lc.startsWith('fr-')) return 'fr';
  if (lc === 'de' || lc.startsWith('de-')) return 'de';
  if (lc === 'tr' || lc.startsWith('tr-')) return 'tr';
  if (lc === 'sv' || lc.startsWith('sv-')) return 'sv';
  if (lc === 'no' || lc.startsWith('no-')) return 'no';
  if (lc === 'fi' || lc.startsWith('fi-')) return 'fi';
  if (lc === 'ko' || lc.startsWith('ko-')) return 'ko';
  if (lc === 'ja' || lc.startsWith('ja-')) return 'ja';
  if (lc === 'zh' || lc.startsWith('zh-')) return 'zh';
  if (lc === 'uk' || lc.startsWith('uk-')) return 'uk';
  if (lc === 'pl' || lc.startsWith('pl-')) return 'pl';
  if (lc === 'hi' || lc.startsWith('hi-')) return 'hi';
  if (lc === 'ur' || lc.startsWith('ur-')) return 'ur';
  if (lc === 'az' || lc.startsWith('az-')) return 'az';
  if (lc === 'ba' || lc.startsWith('ba-')) return 'ba';
  if (lc === 'ug' || lc.startsWith('ug-')) return 'ug';
  if (lc === 'vi' || lc.startsWith('vi-')) return 'vi';
  if (lc === 'cs' || lc.startsWith('cs-')) return 'cs';
  if (lc === 'hu' || lc.startsWith('hu-')) return 'hu';
  if (lc === 'ro' || lc.startsWith('ro-')) return 'ro';
  if (lc === 'id' || lc.startsWith('id-')) return 'id';
  if (lc === 'he' || lc.startsWith('he-')) return 'he';
  if (lc === 'ca' || lc.startsWith('ca-')) return 'ca';
  if (lc === 'sr' || lc.startsWith('sr-')) return 'sr';
  return 'en';
}
