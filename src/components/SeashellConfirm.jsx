import { createPortal } from 'react-dom';

import { useI18n } from '../i18n/I18nContext.jsx';
import { Box, Button, Text } from './Ui.jsx';

export function SeashellConfirm({
  mountEl,
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}) {
  const { t, tb } = useI18n();
  const resolvedConfirm = confirmLabel ?? tb('common.yes');
  const resolvedCancel = cancelLabel ?? tb('common.cancel');

  if (!open) return null;

  const portalTarget = mountEl ?? (typeof document !== 'undefined' ? document.body : null);
  if (!portalTarget) return null;

  return createPortal(
    <div className="seashell-confirm-shell seashell-crt" role="presentation">
      <button
        type="button"
        className="seashell-confirm-shell__backdrop"
        aria-label={t('common.close')}
        onClick={onCancel}
      />
      <div
        className="seashell-confirm-shell__dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="seashell-confirm-title"
      >
        <Box className="seashell-confirm-shell__body">
          <Text weight="2" id="seashell-confirm-title" className="ss-confirm-title">
            {title}
          </Text>
          {message ? (
            <Text className="ss-confirm-message">{message}</Text>
          ) : null}
          <Box className="ss-mt-actions">
            <Button
              type="button"
              size="l"
              flat
              stretched
              mode={destructive ? 'primary' : 'secondary'}
              appearance={destructive ? 'negative' : undefined}
              onClick={onConfirm}
            >
              {resolvedConfirm}
            </Button>
            <Button type="button" size="l" flat stretched mode="tertiary" onClick={onCancel}>
              {resolvedCancel}
            </Button>
          </Box>
        </Box>
      </div>
    </div>,
    portalTarget,
  );
}
