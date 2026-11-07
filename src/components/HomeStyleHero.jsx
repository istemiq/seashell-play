import { Avatar } from './Ui.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useUiStyle } from '../hooks/useUiStyle.js';
import { UI_STYLE_ACADEMIC } from '../utils/uiStyle.js';

export function HomeStyleHero({ userDisplayName, avatarUrl, fallbackName }) {
  const { t } = useI18n();
  const uiStyle = useUiStyle();

  if (uiStyle === UI_STYLE_ACADEMIC) {
    return null;
  }

  const trimmed = typeof userDisplayName === 'string' ? userDisplayName.trim() : '';
  const title = trimmed ? t('boot.userInit', { name: trimmed }) : t('boot.userWait');

  return (
    <div className={`ss-home-hero ss-home-hero--${uiStyle}`}>
      <div className="ss-home-hero__card">
        {(avatarUrl || fallbackName) && (
          <div className="ss-home-hero__avatar-wrap">
            <Avatar
              src={avatarUrl}
              fallbackLabel={fallbackName || trimmed || '?'}
              alt={trimmed}
            />
          </div>
        )}
        <div className="ss-home-hero__text">
          <h2 className="ss-home-hero__title">{title}</h2>
        </div>
      </div>
    </div>
  );
}
