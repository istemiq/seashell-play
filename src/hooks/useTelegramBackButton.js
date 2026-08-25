import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { getWebApp } from '../platform/telegramApp.js';
import { runCustomBackHandler } from '../utils/backNavigation.js';

/** Кнопка «Назад» Telegram WebApp на внутренних экранах. */
export function useTelegramBackButton({ homePath = '/' } = {}) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const wa = getWebApp();
    const back = wa?.BackButton;
    if (!back) return undefined;

    const isHome = location.pathname === homePath || location.pathname === '';
    if (isHome) {
      back.hide();
      return undefined;
    }

    const onClick = () => {
      if (runCustomBackHandler()) return;
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(homePath);
      }
    };

    back.show();
    back.onClick(onClick);
    return () => {
      back.offClick(onClick);
      back.hide();
    };
  }, [location.pathname, homePath, navigate]);
}
