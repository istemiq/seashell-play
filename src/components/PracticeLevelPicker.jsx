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
          <div className="ss-modal-host" role="presentation" onClick={() => setOpen(false)}>
            <div
              className="ss-modal ss-modal--sheet"
              role="dialog"
              aria-modal="true"
              aria-label={t('practice.level.title')}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ss-modal__head">
                <Text weight="2">{t('practice.level.title')}</Text>
                <ModalDismissButton onClick={() => setOpen(false)} />
              </div>
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
