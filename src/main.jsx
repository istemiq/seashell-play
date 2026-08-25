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
}

void startApp();
