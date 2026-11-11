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
  const name = trimmed || String(fallbackName ?? '').trim();

  return (
    <div className={`ss-home-hero ss-home-hero--${uiStyle}`}>
      <div className="ss-home-hero__card">
        {(avatarUrl || name) && (
          <div className="ss-home-hero__avatar-wrap">
            <Avatar src={avatarUrl} fallbackLabel={name || '?'} alt={name} size={56} />
          </div>
        )}
        <div className="ss-home-hero__text">
          {name ? <h2 className="ss-home-hero__title">{name}</h2> : null}
          <div className="ss-home-hero__sub">{t('home.tagline1')}</div>
        </div>
      </div>
    </div>
  );
}
