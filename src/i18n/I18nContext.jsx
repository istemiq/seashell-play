import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { isRtlLocale, normalizeUiLocale } from './config.js';
import { translate, translateButton } from './translate.js';
import { loadSettings, updateSettings } from '../utils/settings.js';
import { ensureStudyModuleCardLocaleCoherent } from '../utils/contentLocale.js';
import { settingsPatchOnUiLocaleChange } from '../modules/learnModuleSwitch.js';
import { resolvePlatformUserId } from '../platform/platformUser.js';
import { isSuperAccountUser } from '../platform/superAccount.js';

/** @type {import('react').Context<null | { locale: string, setLocale: (code: string) => void, t: (key: string, params?: Record<string, string | number>) => string }>} */
const I18nContext = createContext(null);

function applyDocumentLocale(locale) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.lang = locale;
  root.dir = isRtlLocale(locale) ? 'rtl' : 'ltr';
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => normalizeUiLocale(loadSettings().uiLocale));

  const setLocale = useCallback((code) => {
    const next = normalizeUiLocale(code);
    const cardSync = settingsPatchOnUiLocaleChange(next);
    updateSettings({ uiLocale: next, ...(cardSync ?? {}) });
    setLocaleState(next);
    applyDocumentLocale(next);
  }, []);

  useEffect(() => {
    applyDocumentLocale(locale);
    ensureStudyModuleCardLocaleCoherent();
  }, [locale]);

  const t = useCallback((key, params) => translate(locale, key, params), [locale]);

  const tb = useCallback(
    (key, params) => {
      const superAccount = isSuperAccountUser(resolvePlatformUserId());
      return translateButton(locale, key, params, { superAccount });
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t, tb }), [locale, setLocale, t, tb]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}

/** Вне React (хуки до провайдера): читает locale из settings. */
export function tStatic(key, params) {
  return translate(normalizeUiLocale(loadSettings().uiLocale), key, params);
}

export function tbStatic(key, params) {
  const locale = normalizeUiLocale(loadSettings().uiLocale);
  const superAccount = isSuperAccountUser(resolvePlatformUserId());
  return translateButton(locale, key, params, { superAccount });
}
