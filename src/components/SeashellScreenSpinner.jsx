import { SeashellShimmerLoader } from './SeashellShimmerLoader.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';

export function SeashellScreenSpinner() {
  const { t } = useI18n();

  return (
    <div className="seashell-screen-spinner" role="status" aria-live="polite" aria-label={t('common.loading')}>
      <SeashellShimmerLoader />
    </div>
  );
}
