import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';

import { App } from './App.jsx';
import { initGoogleAuthPlugin } from './platform/googleSignIn.js';
import { initAppTheme } from './utils/theme.js';
import { initAppFontScale } from './utils/fontScale.js';
import { installMobileKeyboardViewport } from './utils/mobileKeyboard.js';

import './styles/theme-vars.css';
import './styles/crt-theme.css';
import './styles/seashell-ui.css';
import './styles/module-layout.css';

function showFatalBootError(message) {
  const root = document.getElementById('root');
  if (!root || window.__seashellAppMounted) return;
  root.innerHTML =
    '<div class="boot-loader" style="padding:24px;box-sizing:border-box;font-family:system-ui,sans-serif;text-align:center;line-height:1.5">' +
    '<p style="margin:0 0 12px;opacity:.9">Не удалось запустить приложение.</p>' +
    '<p style="margin:0 0 16px;font-size:14px;opacity:.7">Could not start the app.</p>' +
    `<p style="margin:0 0 16px;font-size:12px;opacity:.55">${String(message || 'unknown error').slice(0, 220)}</p>` +
    '<button type="button" onclick="location.reload()" style="padding:10px 18px;border:1px solid rgba(127,127,127,.4);border-radius:8px;background:transparent;font:inherit">Перезагрузить</button>' +
    '</div>';
}

async function startApp() {
  initAppTheme();
  initAppFontScale();
  initGoogleAuthPlugin();
  if (Capacitor.isNativePlatform()) {
    installMobileKeyboardViewport();
  }

  const rootEl = document.getElementById('root');
  if (!rootEl) {
    console.error('[Seashell] #root not found');
    return;
  }

  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  window.__seashellAppMounted = true;
}

try {
  void startApp();
} catch (err) {
  console.error('[Seashell] fatal boot', err);
  showFatalBootError(err?.message || String(err));
}

window.addEventListener('error', (event) => {
  if (window.__seashellAppMounted) return;
  showFatalBootError(event.message || 'Script error');
});

window.addEventListener('unhandledrejection', (event) => {
  if (window.__seashellAppMounted) return;
  const reason = event.reason;
  showFatalBootError(reason?.message || String(reason));
});
