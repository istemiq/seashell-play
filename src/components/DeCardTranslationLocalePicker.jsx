import { useCallback, useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { DismissibleHint } from './DismissibleHint.jsx';
import { CheckIcon } from './CheckIcon.jsx';
import {
  Cell,
  Group,
  GroupHeader,
  ModalDismissButton,
  Text,
} from './Ui.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import {
  deCardTranslationLocales,
  deDefaultCardLocale,
  deEnsureCardLocaleCoherent,
  deNormalizeCardLocale,
  deResolveContentLocaleForApi,
} from '../modules/de/deContentLocale.js';
import { updateSettings } from '../utils/settings.js';
import {
  resolveContentLocaleForApi,
  defaultCardLocaleForLearn,
} from '../utils/contentLocale.js';

/** Picker языка переводов — только DE-модуль. */
export function DeCardTranslationLocalePicker({
  modalMount,
  onLocaleChange,
  hideHint = false,
}) {
  const { t } = useI18n();
  const locales = useMemo(() => deCardTranslationLocales(), []);
  const readEffectiveCode = useCallback(() => resolveContentLocaleForApi(), []);
  const [cardLocale, setCardLocale] = useState(readEffectiveCode);
  const [open, setOpen] = useState(false);

  const effectiveCode = cardLocale || defaultCardLocaleForLearn();
  const selectedName = useMemo(
    () => locales.find((l) => l.code === effectiveCode)?.nativeName ?? '',
    [effectiveCode, locales],
  );

  useEffect(() => {
    deEnsureCardLocaleCoherent();
    setCardLocale(readEffectiveCode());
  }, [readEffectiveCode]);

  useEffect(() => {
    const onSettings = () => setCardLocale(readEffectiveCode());
    window.addEventListener('seashell-settings-changed', onSettings);
    return () => window.removeEventListener('seashell-settings-changed', onSettings);
  }, [readEffectiveCode]);

  const setCardTranslationLocale = useCallback(
    (code) => {
      const next = deNormalizeCardLocale(code);
      if (!next) return;
      updateSettings({ cardLocale: next, cardLocalePinned: true });
      setCardLocale(next);
      setOpen(false);
      onLocaleChange?.(next);
    },
    [onLocaleChange],
  );

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open]);

  const sheet =
    modalMount != null && open
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
              aria-labelledby="seashell-card-lang-title"
            >
              <div className="seashell-card-lang-shell__head">
                <ModalDismissButton onClick={() => setOpen(false)} />
                <Text weight="2" id="seashell-card-lang-title" className="seashell-card-lang-shell__title">
                  {t('dict.cardLangQuestion')}
                </Text>
              </div>
              <div className="seashell-card-lang-shell__list" role="listbox" aria-label={t('dict.cardLangQuestion')}>
                {locales.map((item) => {
                  const selected = effectiveCode === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={[
                        'ss-card-lang-option',
                        selected ? 'ss-card-lang-option--selected' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setCardTranslationLocale(item.code)}
                    >
                      <span className="ss-native-name" lang={item.code}>
                        {item.nativeName}
                      </span>
                      {selected ? <CheckIcon className="ss-locale-check" size={18} /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          modalMount,
        )
      : null;

  return (
    <>
      {sheet}
      <Group header={<GroupHeader mode="secondary">{t('dict.cardLangQuestion')}</GroupHeader>}>
        <Cell
          chevron
          onClick={() => setOpen(true)}
          after={
            !hideHint ? (
              <DismissibleHint hintId="dict.cardLang" className="ss-hint--inline ss-hint--subtle">
                {t('dict.cardLangHintDe')}
              </DismissibleHint>
            ) : null
          }
        >
          <span className="ss-native-name" lang={effectiveCode}>
            {selectedName}
          </span>
        </Cell>
      </Group>
    </>
  );
}
