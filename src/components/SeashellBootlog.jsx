import { useEffect, useMemo, useState } from 'react';

import { useI18n } from '../i18n/I18nContext.jsx';
import { useUiStyle } from '../hooks/useUiStyle.js';

const CHAR_MS = 16;
const LINE_PAUSE_MS = 280;
const CYCLE_PAUSE_MS = 4200;

const LINE_COUNT = 8;
const ROW_LINE_HEIGHT = 1.55;

const TAGLINE_KEYS = ['home.tagline1', 'home.tagline2', 'home.tagline3', 'home.tagline4', 'home.tagline5'];

function prefersReducedMotion() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

function FriendlyBootlog({ userDisplayName, lang, className = '' }) {
  const { t } = useI18n();
  const trimmed = typeof userDisplayName === 'string' ? userDisplayName.trim() : '';
  const welcome = trimmed ? t('boot.userInit', { name: trimmed }) : t('boot.userWait');
  const taglines = useMemo(() => TAGLINE_KEYS.map((key) => t(key)), [t]);
  const [tagIdx, setTagIdx] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion() || taglines.length < 2) return undefined;
    const timer = setInterval(() => {
      setTagIdx((i) => (i + 1) % taglines.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [taglines.length]);

  return (
    <div
      className={`seashell-bootlog seashell-bootlog--friendly ${className}`.trim()}
      lang={lang}
      aria-hidden="true"
    >
      <div className="seashell-bootlog__welcome">{welcome}</div>
      <div className="seashell-bootlog__tagline">{taglines[tagIdx] ?? ''}</div>
    </div>
  );
}

function AcademicBootlog({ userDisplayName, lang, className = '' }) {
  const { t } = useI18n();
  const trimmed = typeof userDisplayName === 'string' ? userDisplayName.trim() : '';
  const allLines = useMemo(() => {
    const line1 = trimmed
      ? { t: t('boot.userInit', { name: trimmed }), ok: true }
      : { t: t('boot.userWait'), ok: false };
    return [
      line1,
      { t: t('boot.uiReady'), ok: true },
      { t: t('boot.stateReady'), ok: true },
      { t: t('home.tagline1'), ok: false, tagline: true },
      { t: t('home.tagline2'), ok: false, tagline: true },
      { t: t('home.tagline3'), ok: false, tagline: true },
      { t: t('home.tagline4'), ok: false, tagline: true },
      { t: t('home.tagline5'), ok: false, tagline: true },
    ];
  }, [trimmed, t]);

  const [step, setStep] = useState({ line: 0, ch: 0, cycle: 0 });

  useEffect(() => {
    if (prefersReducedMotion()) return;

    let timer = null;
    const current = allLines[step.line];
    const base = current?.t ?? '';
    const suffix = current?.ok ? ' … OK' : '';
    const full = `${base}${suffix}`;

    const atEndOfLine = step.ch >= full.length;
    const atLastLine = step.line >= allLines.length - 1;

    const schedule = () => {
      if (!atEndOfLine) {
        timer = setTimeout(
          () => setStep((s) => ({ ...s, ch: Math.min(s.ch + 1, full.length) })),
          CHAR_MS,
        );
        return;
      }
      if (!atLastLine) {
        timer = setTimeout(() => setStep((s) => ({ ...s, line: s.line + 1, ch: 0 })), LINE_PAUSE_MS);
        return;
      }
      timer = setTimeout(() => setStep((s) => ({ line: 0, ch: 0, cycle: s.cycle + 1 })), CYCLE_PAUSE_MS);
    };

    schedule();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [allLines, step]);

  const reduced = prefersReducedMotion();

  return (
    <div
      className={`seashell-bootlog ${className}`.trim()}
      lang={lang}
      aria-hidden="true"
      style={{ '--bootlog-lines': LINE_COUNT, '--bootlog-row-height': ROW_LINE_HEIGHT }}
    >
      {allLines.map((line, i) => {
        const prefix = `[${String(i + 1).padStart(2, '0')}]`;
        const suffix = line.ok ? ' … OK' : '';
        const full = `${line.t}${suffix}`;

        const visible =
          reduced
            ? full
            : i < step.line
              ? full
              : i > step.line
                ? ''
                : full.slice(0, step.ch);

        const showCursor = !reduced && i === step.line && step.ch < full.length;
        const rowClass = [
          'seashell-bootlog__row',
          line.tagline ? 'seashell-bootlog__row--tagline' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <div className={rowClass} key={`${i}-${step.cycle}`}>
            <strong>{prefix}</strong> {visible}
            {showCursor ? '▌' : ''}
          </div>
        );
      })}
    </div>
  );
}

export function SeashellBootlog({ userDisplayName, lang, className = '' }) {
  const uiStyle = useUiStyle();

  if (uiStyle === 'focus') {
    return null;
  }

  if (uiStyle === 'academic') {
    return (
      <AcademicBootlog userDisplayName={userDisplayName} lang={lang} className={className} />
    );
  }

  return (
    <FriendlyBootlog userDisplayName={userDisplayName} lang={lang} className={className} />
  );
}
