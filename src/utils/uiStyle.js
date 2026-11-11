import { loadSettings, updateSettings } from './settings.js';
import { refreshAppTheme } from './theme.js';

export const UI_STYLE_ACADEMIC = 'academic';
export const UI_STYLE_SAKURA = 'sakura';

export const UI_STYLE_CODES = new Set([
  UI_STYLE_ACADEMIC,
  UI_STYLE_SAKURA,
]);

/** @type {{ code: string, labelKey: string, hintKey?: string }[]} */
export const UI_STYLE_OPTIONS = [
  { code: UI_STYLE_ACADEMIC, labelKey: 'settings.uiStyleAcademic', hintKey: 'settings.uiStyleAcademicHint' },
  { code: UI_STYLE_SAKURA, labelKey: 'settings.uiStyleSakura', hintKey: 'settings.uiStyleSakuraHint' },
];

const FONT_SANS =
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', Courier, monospace";

export const UI_STYLE_DEFAULT = UI_STYLE_SAKURA;

export function normalizeUiStyle(code) {
  const c = String(code ?? '').trim();
  return UI_STYLE_CODES.has(c) ? c : UI_STYLE_DEFAULT;
}

export function uiStyleShellClass(code) {
  return `seashell-ui-style-${normalizeUiStyle(code)}`;
}

export function applyUiStyle(styleCode) {
  if (typeof document === 'undefined') return normalizeUiStyle(styleCode);
  const style = normalizeUiStyle(styleCode);
  const root = document.documentElement;
  root.dataset.seashellUiStyle = style;
  for (const code of UI_STYLE_CODES) {
    root.classList.remove(`seashell-ui-style-${code}`);
  }
  root.classList.add(`seashell-ui-style-${style}`);
  root.style.setProperty('--ss-ui-font-family', style === UI_STYLE_ACADEMIC ? FONT_MONO : FONT_SANS);

  document.querySelectorAll('.seashell-crt').forEach((shell) => {
    for (const code of UI_STYLE_CODES) {
      shell.classList.remove(`seashell-ui-style-${code}`);
    }
    shell.classList.add(`seashell-ui-style-${style}`);
    shell.dataset.seashellUiStyle = style;
  });

  return style;
}

let uiStyleSettingsBound = false;

function bindUiStyleSettingsSync() {
  if (typeof window === 'undefined' || uiStyleSettingsBound) return;
  uiStyleSettingsBound = true;
  window.addEventListener('seashell-settings-changed', () => {
    applyUiStyle(loadSettings().uiStyle);
  });
}

export function initUiStyle() {
  bindUiStyleSettingsSync();
  return applyUiStyle(loadSettings().uiStyle);
}

export function setUiStylePreference(styleCode) {
  updateSettings({ uiStyle: normalizeUiStyle(styleCode) });
  applyUiStyle(styleCode);
  refreshAppTheme();
}

export function getUiStyleLabelKey(code) {
  return UI_STYLE_OPTIONS.find((o) => o.code === normalizeUiStyle(code))?.labelKey ?? 'settings.uiStyleSakura';
}
