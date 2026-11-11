import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Footnote, Text } from './Ui.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { usePracticeVoiceInput } from '../hooks/usePracticeVoiceInput.js';
import { speakAloudMatchesExpected } from '../utils/speakAloudMatch.js';

const SPEAK_MATCH_FLASH_MS = 2600;

/**
 * Tap mic on a dictionary example — learner reads the line aloud for STT self-check.
 * Mobile / Telegram: tap to start, tap again to stop.
 * Heard text slides down below the button like a small platform.
 */
export function SpeakAloudButton({
  disabled = false,
  resetKey,
  expectedText,
  speechLang = 'en-US',
  onVoiceError,
  style,
  className = '',
}) {
  const { t, tb } = useI18n();
  const [heardText, setHeardText] = useState('');
  const [matchFlash, setMatchFlash] = useState(false);
  const matchFlashTimerRef = useRef(null);

  useEffect(() => {
    setHeardText('');
    setMatchFlash(false);
    if (matchFlashTimerRef.current) {
      clearTimeout(matchFlashTimerRef.current);
      matchFlashTimerRef.current = null;
    }
  }, [resetKey, disabled]);

  useEffect(
    () => () => {
      if (matchFlashTimerRef.current) clearTimeout(matchFlashTimerRef.current);
    },
    [],
  );

  const triggerMatchFlash = useCallback(() => {
    setMatchFlash(false);
    window.requestAnimationFrame(() => {
      setMatchFlash(true);
      if (matchFlashTimerRef.current) clearTimeout(matchFlashTimerRef.current);
      matchFlashTimerRef.current = window.setTimeout(() => {
        setMatchFlash(false);
        matchFlashTimerRef.current = null;
      }, SPEAK_MATCH_FLASH_MS);
    });
  }, []);

  const onTranscript = useCallback(
    (text) => {
      const line = String(text ?? '').trim();
      if (!line) return;
      setHeardText(line);
      if (expectedText && speakAloudMatchesExpected(line, expectedText)) {
        triggerMatchFlash();
      }
    },
    [expectedText, triggerMatchFlash],
  );

  const {
    voiceMode,
    voiceAvailable,
    listening,
    transcribing,
    voiceError,
    toggleVoice,
    onVoicePointerDown,
    onVoicePointerUp,
    onVoicePointerCancel,
    onVoiceTouchStart,
    onVoiceTouchEnd,
  } = usePracticeVoiceInput({
    onTranscript,
    blockStart: disabled,
    t,
    tapToToggle: true,
    speechLang,
  });

  useEffect(() => {
    if (voiceError) onVoiceError?.(voiceError);
  }, [voiceError, onVoiceError]);

  useEffect(() => {
    if (listening) {
      setHeardText('');
      setMatchFlash(false);
    }
  }, [listening]);

  const usesTap = voiceMode === 'tap' || voiceMode === 'toggle-record';
  const usesHold = voiceMode === 'hold';
  const heardOpen = Boolean(heardText);

  const label = transcribing
    ? tb('practice.transcribing')
    : listening
      ? tb('dict.speakAloudTapStop')
      : tb('dict.speakAloud');

  const inactive = disabled || transcribing;
  const blocked = inactive || !voiceAvailable;

  return (
    <div className="seashell-speak-aloud">
      {matchFlash ? <div className="ss-speak-match-flash" aria-hidden="true" /> : null}
      <Button
        size="l"
        flat
        stretched
        mode="secondary"
        disabled={inactive}
        loading={transcribing}
        className={`seashell-speak-aloud__btn${heardOpen ? ' is-heard-open' : ''} ${className}`.trim()}
        style={{
          ...(usesHold ? { touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' } : null),
          ...style,
        }}
        onClick={
          usesTap
            ? () => {
                if (blocked) return;
                toggleVoice();
              }
            : undefined
        }
        onPointerDown={usesHold && !blocked ? onVoicePointerDown : undefined}
        onPointerUp={usesHold && !blocked ? onVoicePointerUp : undefined}
        onPointerLeave={usesHold && !blocked ? onVoicePointerUp : undefined}
        onPointerCancel={usesHold && !blocked ? onVoicePointerCancel : undefined}
        onTouchStart={usesHold && !blocked ? onVoiceTouchStart : undefined}
        onTouchEnd={usesHold && !blocked ? onVoiceTouchEnd : undefined}
      >
        {label}
      </Button>
      <div
        className={`seashell-speak-aloud__heard${heardOpen ? ' is-open' : ''}`}
        aria-hidden={!heardOpen}
      >
        <div
          className={`seashell-speak-aloud__heard-in${matchFlash ? ' is-speak-match' : ''}`}
        >
          <Footnote className="seashell-speak-aloud__heard-label" dir="auto">
            {t('dict.speakAloudHeardLabel')}
          </Footnote>
          <Text className="seashell-speak-aloud__heard-text" dir="auto">
            {heardText}
          </Text>
        </div>
      </div>
      {voiceError ? (
        <Footnote className="ss-mt-6" style={{ color: 'var(--ss-color-text-negative, #e64646)' }} dir="auto">
          {voiceError}
        </Footnote>
      ) : null}
      {!voiceAvailable && !disabled ? (
        <Footnote className="ss-mt-6 ss-opacity-soft" dir="auto">
          {t('errors.voiceBrowserUnavailable')}
        </Footnote>
      ) : null}
    </div>
  );
}
