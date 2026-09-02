import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

import { getWebApp } from '../platform/telegramApp.js';
import { runCustomBackHandler } from '../utils/backNavigation.js';
import { registerRootBackPress, resetRootBackPress } from '../utils/appExitBack.js';

function isHomePath(pathname, homePath) {
  const p = String(pathname ?? '');
  return p === homePath || p === '' || p === '/';
}

function exitApp() {
  if (Capacitor.isNativePlatform()) {
    void App.exitApp();
    return;
  }
  getWebApp()?.close?.();
}

/**
 * Android system back + Telegram BackButton: in-app navigation; double-tap on home to exit.
 */
export function useAppBackNavigation({ homePath = '/', onExitHint } = {}) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleBackPress = useCallback(() => {
    if (runCustomBackHandler()) return;

    if (!isHomePath(location.pathname, homePath)) {
      resetRootBackPress();
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(homePath);
      }
      return;
    }

    if (registerRootBackPress()) {
      exitApp();
      return;
    }
    onExitHint?.();
  }, [homePath, location.pathname, navigate, onExitHint]);

  useEffect(() => {
    resetRootBackPress();
  }, [location.pathname]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    let removed = false;
    let handle = null;
    void App.addListener('backButton', () => {
      handleBackPress();
    }).then((h) => {
      if (removed) {
        void h.remove();
        return;
      }
      handle = h;
    });
    return () => {
      removed = true;
      void handle?.remove();
    };
  }, [handleBackPress]);

  useEffect(() => {
    const back = getWebApp()?.BackButton;
    if (!back) return undefined;

    back.show();
    back.onClick(handleBackPress);
    return () => {
      back.offClick(handleBackPress);
      back.hide();
    };
  }, [handleBackPress]);
}
