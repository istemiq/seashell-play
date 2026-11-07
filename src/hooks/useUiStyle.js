import { useEffect, useState } from 'react';

import { loadSettings } from '../utils/settings.js';
import { applyUiStyle, normalizeUiStyle } from '../utils/uiStyle.js';

export function readUiStyle() {
  return normalizeUiStyle(loadSettings().uiStyle);
}

export function useUiStyle() {
  const [uiStyle, setUiStyle] = useState(readUiStyle);

  useEffect(() => {
    const sync = () => {
      const style = readUiStyle();
      applyUiStyle(style);
      setUiStyle(style);
    };
    window.addEventListener('seashell-settings-changed', sync);
    return () => window.removeEventListener('seashell-settings-changed', sync);
  }, []);

  return uiStyle;
}
