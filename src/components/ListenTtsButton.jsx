import { useCallback, useMemo, useRef, useState } from 'react';
import { SeashellShimmerLoader } from './SeashellShimmerLoader.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { speakEnglish, speakStudyText, unlockAudioPlayback } from '../utils/tts.js';
import { isCapacitorNative } from '../platform/runtime.js';

const CAP_TAP_MS = 120;

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
  const [errorMsg, setErrorMsg] = useState('');
  const busyRef = useRef(false);

  const play = useCallback(() => {
    if (busyRef.current || disabled) return;
    const line = String(text ?? '').trim();
    if (!line) return;

    unlockAudioPlayback();
    setErrorMsg('');
    busyRef.current = true;
    setLoading(true);
    void (async () => {
      try {
        const onStart = () => {
          busyRef.current = false;
          setLoading(false);
        };
        if (ttsLocale) {
          await speakStudyText(line, ttsLocale, { ttsText, onStart });
        } else {
          await speakEnglish(line, { onStart });
        }
      } catch (e) {
        const msg = e?.message || t('errors.ttsUnavailable');
        setErrorMsg(msg);
        onError?.(msg);
      } finally {
        busyRef.current = false;
        setLoading(false);
      }
    })();
  }, [disabled, text, ttsText, ttsLocale, onError, t]);

  const label = loading ? t('common.loading') : tb(labelKey);
  const tapDisabled = disabled || loading || !String(text ?? '').trim();
  const tap = useMemo(() => {
    let lastAt = 0;
    const debounceMs = isCapacitorNative() ? CAP_TAP_MS : 400;
    const invoke = (e) => {
      if (tapDisabled) return;
      const now = Date.now();
      if (now - lastAt < debounceMs) return;
      lastAt = now;
      play(e);
    };
    return {
      onMouseDown: (e) => {
        if (tapDisabled) return;
        if (e.button !== 0) return;
        e.preventDefault();
        invoke(e);
      },
    };
  }, [play, tapDisabled]);

  const errorNote =
    errorMsg && !loading ? (
      <span className="ss-hint ss-hint--subtle" role="alert" style={{ display: 'block', marginTop: 4 }}>
        {errorMsg}
      </span>
    ) : null;

  if (stretched) {
    return (
      <>
      <button
        type="button"
        className={[
          'ss-btn',
          `ss-btn--${mode}`,
          size === 'l' ? 'ss-btn--l' : size === 's' ? 'ss-btn--s' : '',
          'ss-btn--stretched',
          'ss-btn--flat',
          loading ? 'ss-btn--loading' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={style}
        disabled={disabled}
        aria-busy={loading || undefined}
        {...tap}
      >
        {loading ? (
          <span className="ss-btn__shimmer" aria-hidden="true">
            <SeashellShimmerLoader />
          </span>
        ) : (
          <span className="ss-btn__label">{label}</span>
        )}
      </button>
      {errorNote}
      </>
    );
  }

  return (
    <>
    <button
      type="button"
      className={`ss-flat-link ${className}`.trim()}
      style={{ display: 'block', touchAction: 'manipulation', ...style }}
      disabled={disabled}
      aria-busy={loading || undefined}
      {...tap}
    >
      {label}
    </button>
    {errorNote}
    </>
  );
}
