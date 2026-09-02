import { useEffect, useState } from 'react';

import { whenGoogleSessionReady } from '../platform/googleSession.js';
import { initAppTheme, refreshAppTheme, resolveEffectiveTheme, subscribeAppTheme } from '../utils/theme.js';
import { loadSettings } from '../utils/settings.js';

export function useAppTheme() {
  const [effectiveTheme, setEffectiveTheme] = useState(() =>
    resolveEffectiveTheme(loadSettings().theme),
  );

  useEffect(() => {
    setEffectiveTheme(initAppTheme());
    const unsub = subscribeAppTheme(setEffectiveTheme);

    void whenGoogleSessionReady().then(() => {
      setEffectiveTheme(refreshAppTheme());
    });

    return unsub;
  }, []);

  return effectiveTheme;
}
