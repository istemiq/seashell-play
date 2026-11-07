import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';

import { App } from './App.jsx';
import { initGoogleAuthPlugin } from './platform/googleSignIn.js';
import { initAppTheme } from './utils/theme.js';
import { initUiStyle } from './utils/uiStyle.js';
import { initAppFontScale } from './utils/fontScale.js';
import { installMobileKeyboardViewport } from './utils/mobileKeyboard.js';

import './styles/theme-vars.css';
import './styles/ui-style-vars.css';
import './styles/crt-theme.css';
import './styles/seashell-ui.css';
import './styles/module-layout.css';
import './styles/ui-style-shell.css';
import './styles/ui-style-layouts.css';
import './styles/ui-style-backgrounds.css';
import './styles/ui-style-backdrop-scenes.css';
import './styles/ui-style-tiles.css';
import './styles/ui-style-global.css';
import './styles/ui-style-polish.css';
import './styles/ui-style-screens.css';
import './styles/ui-style-fixes.css';

// Общая с index.html диагностика загрузки: index.html показывает её, если приложение так и не смонтировалось.
const boot = (window.__seashellBoot = window.__seashellBoot || { stage: 'boot', errors: [] });

function recordBootError(detail) {
  try {
    const message = detail && detail.message ? detail.message : detail;
    boot.errors.push(String(message == null ? '' : message).slice(0, 200));
    if (boot.errors.length > 5) boot.errors.shift();
  } catch {
    /* ignore */
  }
}

function showFatalBootError(message) {
  const root = document.getElementById('root');
  if (!root || window.__seashellAppMounted) return;
  boot.stage = 'fatal';
  recordBootError(message);
  root.innerHTML =
    '<div class="boot-loader" style="padding:24px;box-sizing:border-box;font-family:system-ui,sans-serif;text-align:center;line-height:1.5">' +
    '<p style="margin:0 0 12px;opacity:.9">Не удалось запустить приложение.</p>' +
    '<p style="margin:0 0 16px;font-size:14px;opacity:.7">Could not start the app.</p>' +
    `<p style="margin:0 0 16px;font-size:12px;opacity:.55">${String(message || 'unknown error').slice(0, 220)}</p>` +
    '<button type="button" onclick="location.reload()" style="padding:10px 18px;border:1px solid rgba(127,127,127,.4);border-radius:8px;background:transparent;font:inherit">Перезагрузить</button>' +
    '</div>';
}

/**
 * Инициализация приложения. Любой сбой в init не должен мешать рендеру:
 * иначе пользователь остаётся на экране загрузки без объяснения (см. инцидент «Медленное соединение»).
 */
function runInit(label, fn) {
  try {
    fn();
  } catch (err) {
    console.error(`[Seashell] init failed: ${label}`, err);
    recordBootError(`${label}: ${err?.message || err}`);
  }
}

async function startApp() {
  boot.stage = 'inits';
  runInit('ui-style', initUiStyle);
  runInit('theme', initAppTheme);
  runInit('font-scale', initAppFontScale);
  runInit('google-auth', initGoogleAuthPlugin);
  if (Capacitor.isNativePlatform()) {
    runInit('keyboard-viewport', installMobileKeyboardViewport);
  }

  const rootEl = document.getElementById('root');
  if (!rootEl) {
    boot.stage = 'no-root';
    console.error('[Seashell] #root not found');
    return;
  }

  // boot.mounted поднимаем до render: с этого момента HTML-сторож не должен показывать «долго загружается»,
  // а window.__seashellAppMounted — уже после, чтобы showFatalBootError() работал при сбое рендера.
  boot.stage = 'rendering';
  boot.mounted = true;
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  window.__seashellAppMounted = true;
  boot.stage = 'mounted';
}

startApp().catch((err) => {
  console.error('[Seashell] fatal boot', err);
  showFatalBootError(err?.message || String(err));
});

window.addEventListener('error', (event) => {
  // Ошибки ресурсов (img/script src) обрабатывает сторож в index.html — здесь только сбои скриптов.
  if (event.target && event.target !== window) return;
  if (window.__seashellAppMounted) return;
  showFatalBootError(event.message || 'Script error');
});

window.addEventListener('unhandledrejection', (event) => {
  if (window.__seashellAppMounted) return;
  const reason = event.reason;
  showFatalBootError(reason?.message || String(reason));
});
