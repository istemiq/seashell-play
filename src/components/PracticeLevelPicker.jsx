import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { CheckIcon } from './CheckIcon.jsx';
import { Cell, Group, GroupHeader, ModalDismissButton, Text } from './Ui.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import {
  getPracticeLevel,
  practiceLevelMeta,
  PRACTICE_LEVELS,
  setPracticeLevel,
} from '../utils/practiceLevel.js';

/** Compact level chip — lives in practice panel headers. */
export function PracticeLevelPicker({ modalMount, className = '' }) {
  const { t } = useI18n();
  const [level, setLevel] = useState(getPracticeLevel);
  const [open, setOpen] = useState(false);

  const meta = useMemo(() => practiceLevelMeta(level), [level]);

  useEffect(() => {
    const sync = () => setLevel(getPracticeLevel());
    window.addEventListener('seashell-settings-changed', sync);
    return () => window.removeEventListener('seashell-settings-changed', sync);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open]);

  const pick = useCallback((code) => {
    setPracticeLevel(code);
    setOpen(false);
  }, []);

  const chip = (
    <button
      type="button"
      className={`ss-practice-level-chip ${className}`.trim()}
      onClick={() => setOpen(true)}
      aria-haspopup="dialog"
      aria-expanded={open}
      title={t('practice.level.title')}
    >
      <span className="ss-practice-level-chip__cefr">{meta.cefr}</span>
    </button>
  );

  const modal =
    open && modalMount
      ? createPortal(
          <div className="seashell-card-lang-shell seashell-crt">
            <button
              type="button"
              className="seashell-card-lang-shell__backdrop"
              aria-label={t('common.close')}
              onClick={() => setOpen(false)}
            />
            <div
              className="seashell-card-lang-shell__dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="seashell-practice-level-title"
            >
              <div className="seashell-card-lang-shell__head">
                <ModalDismissButton onClick={() => setOpen(false)} />
                <Text weight="2" id="seashell-practice-level-title" className="seashell-card-lang-shell__title">
                  {t('practice.level.title')}
                </Text>
              </div>
              <div className="seashell-card-lang-shell__list">
                <Group header={<GroupHeader mode="secondary">{t('practice.level.subtitle')}</GroupHeader>}>
                  {PRACTICE_LEVELS.map((item) => {
                    const selected = item.code === level;
                    return (
                      <Cell
                        key={item.code}
                        selected={selected}
                        after={selected ? <CheckIcon /> : null}
                        onClick={() => pick(item.code)}
                        subtitle={t(item.hintKey)}
                      >
                        <span className="ss-practice-level-row">
                          <span className="ss-practice-level-row__cefr">{item.cefr}</span>
                          <span>{t(item.labelKey)}</span>
                        </span>
                      </Cell>
                    );
                  })}
                </Group>
              </div>
            </div>
          </div>,
          modalMount,
        )
      : null;

  return (
    <>
      {chip}
      {modal}
    </>
  );
}
