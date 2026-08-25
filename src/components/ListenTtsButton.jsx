import { useCallback, useRef, useState } from 'react';
import { Button } from './Ui.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { speakEnglish, speakStudyText, unlockAudioPlayback } from '../utils/tts.js';

/**
 * TTS play control: flat link inline, or flat list row when stretched.
 */
export function ListenTtsButton({
  text,
  ttsText,
  ttsLocale,
  labelKey = 'dict.listen',
  size = 'm',
  mode = 'secondary',
  style,
  className = '',
  disabled = false,
  stretched = false,
  onError,
}) {
  const { t, tb } = useI18n();
  const [loading, setLoading] = useState(false);
  const busyRef = useRef(false);

  const play = useCallback(async () => {
    if (busyRef.current || disabled) return;
    const line = String(text ?? '').trim();
    if (!line) return;

    busyRef.current = true;
    try {
      await unlockAudioPlayback();
      setLoading(true);
      if (ttsLocale) {
        await speakStudyText(line, ttsLocale, { ttsText });
      } else {
        await speakEnglish(line);
      }
    } catch (e) {
      onError?.(e?.message || t('errors.ttsUnavailable'));
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }, [disabled, text, ttsText, ttsLocale, onError, t]);

  const label = loading ? t('common.loading') : tb(labelKey);

  if (stretched) {
    return (
      <Button
        size={size}
        mode={mode}
        loading={loading}
        disabled={disabled}
        stretched
        style={style}
        className={className}
        onClick={() => void play()}
      >
        {label}
      </Button>
    );
  }

  return (
    <button
      type="button"
      className={`ss-flat-link ${className}`.trim()}
      style={{ display: 'block', touchAction: 'manipulation', ...style }}
      disabled={disabled}
      onClick={() => void play()}
    >
      {label}
    </button>
  );
}
