import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { clearAdsonarSticky } from '../ads/index.js';
import { fetchUserAvatarBlobUrl } from '../api/userApi.js';
import { SeashellBootlog } from '../components/SeashellBootlog.jsx';
import { GlobeIcon } from '../components/GlobeIcon.jsx';
import { Avatar, Cell, Group, GroupHeader, Panel, PanelHeader } from '../components/Ui.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { isEnglishLearnModule, useLearnLocale } from '../hooks/useLearnLocale.js';

export function HomePage({ fetchedUser }) {
  const navigate = useNavigate();
  const { t, tb, locale } = useI18n();
  const learnLocale = useLearnLocale();
  const englishModule = isEnglishLearnModule(learnLocale);
  const userDisplayName = fetchedUser
    ? [fetchedUser.first_name, fetchedUser.last_name].filter(Boolean).join(' ').trim()
    : '';
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    document.documentElement.classList.remove('seashell-ad-active');
    void clearAdsonarSticky();
  }, []);

  useEffect(() => {
    if (!fetchedUser?.id) {
      setAvatarUrl(null);
      return undefined;
    }
    let cancelled = false;
    let objectUrl = null;
    void (async () => {
      const url = await fetchUserAvatarBlobUrl();
      if (cancelled) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      objectUrl = url;
      setAvatarUrl(url);
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fetchedUser?.id]);

  return (
    <Panel>
      <PanelHeader>{t('nav.home')}</PanelHeader>

      {fetchedUser ? (
        <Group header={<GroupHeader size="s">{t('home.profile')}</GroupHeader>}>
          <Cell
            before={
              <Avatar
                src={avatarUrl}
                fallbackLabel={userDisplayName || fetchedUser.first_name}
                alt={userDisplayName}
              />
            }
          >
            {userDisplayName}
          </Cell>
        </Group>
      ) : null}

      <Group>
        <SeashellBootlog userDisplayName={userDisplayName} lang={locale} />
        <Cell chevron i18nKey="nav.dictionary" onClick={() => navigate('/dictionary')} />
        {englishModule ? (
          <Cell chevron i18nKey="nav.irregularVerbs" onClick={() => navigate('/irregular-verbs')} />
        ) : null}
        <Cell chevron i18nKey="nav.practice" onClick={() => navigate('/practice')} />
        <Cell chevron i18nKey="nav.premium" onClick={() => navigate('/premium')} />
        <Cell chevron i18nKey="nav.settings" onClick={() => navigate('/settings')} />
        <Cell chevron onClick={() => navigate('/language')}>
          <span className="ss-cell__title-with-icon">
            {tb('nav.language')}
            <GlobeIcon className="ss-menu-globe" size={17} />
          </span>
        </Cell>
        <Cell chevron onClick={() => navigate('/learn-language')}>
          <span className="ss-cell__title-with-icon">
            {tb('nav.learnLanguage')}
            <GlobeIcon className="ss-menu-globe" size={17} />
          </span>
        </Cell>
        <Cell chevron i18nKey="nav.readme" onClick={() => navigate('/readme')} />
      </Group>
    </Panel>
  );
}
