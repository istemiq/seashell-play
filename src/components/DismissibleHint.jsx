import { useEffect, useState } from 'react';

import { Footnote } from './Ui.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { dismissUiHint, isUiHintDismissed } from '../utils/uiHints.js';

/**
 * Подсказка с кнопкой «Понятно». После нажатия сворачивается в «?»;
 * при развороте снова показывает текст и кнопку «Понятно».
 */
export function DismissibleHint({ hintId, children, style, className = '' }) {
  const { t, tb } = useI18n();
  const inline = className.includes('ss-hint--inline');
  const [dismissed, setDismissed] = useState(() => isUiHintDismissed(hintId));
  const [expanded, setExpanded] = useState(() => {
    if (inline) return false;
    return !isUiHintDismissed(hintId);
  });

  useEffect(() => {
    const wasDismissed = isUiHintDismissed(hintId);
    setDismissed(wasDismissed);
    setExpanded(inline ? false : !wasDismissed);
  }, [hintId, inline]);

  const onGotIt = () => {
    if (!dismissed) {
      dismissUiHint(hintId);
      setDismissed(true);
    }
    setExpanded(false);
  };

  const gotItBtn = (
    <button type="button" className="ss-flat-link" onClick={onGotIt}>
      {tb('common.gotIt')}
    </button>
  );

  if (inline) {
    return (
      <div className={`ss-hint-collapsed ${className}`.trim()} style={style}>
        {expanded ? (
          <div className={`ss-hint ${className}`.trim()} role="tooltip">
            <Footnote className="ss-hint__text">{children}</Footnote>
            {gotItBtn}
          </div>
        ) : null}
        <button
          type="button"
          className="ss-hint-collapsed__toggle"
          onClick={() => setExpanded((open) => !open)}
          aria-label={t('common.showHint')}
          aria-expanded={expanded}
        >
          ?
        </button>
      </div>
    );
  }

  if (dismissed && !expanded) {
    return (
      <div className={`ss-hint-collapsed ${className}`.trim()} style={style}>
        <button
          type="button"
          className="ss-hint-collapsed__toggle"
          onClick={() => setExpanded(true)}
          aria-label={t('common.showHint')}
          aria-expanded="false"
        >
          ?
        </button>
      </div>
    );
  }

  return (
    <div className={`ss-hint ${className}`.trim()} style={style}>
      <Footnote className="ss-hint__text">{children}</Footnote>
      {gotItBtn}
    </div>
  );
}
