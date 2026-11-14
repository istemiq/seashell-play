import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { clearAdsonarSticky } from '../ads/index.js';
import { fetchUserAvatarBlobUrl } from '../api/userApi.js';
import { HomeStyleHero } from '../components/HomeStyleHero.jsx';
import { HomeQuoteScreen } from '../components/HomeQuoteScreen.jsx';
import { SeashellBootlog } from '../components/SeashellBootlog.jsx';
import { StyleNavTiles } from '../components/StyleNavTiles.jsx';
import { GlobeIcon } from '../components/GlobeIcon.jsx';
import { Avatar, Cell, Group, GroupHeader, Panel, PanelHeader } from '../components/Ui.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { isEnglishLearnModule, useLearnLocale } from '../hooks/useLearnLocale.js';
import { useUiStyle } from '../hooks/useUiStyle.js';
import { UI_STYLE_ACADEMIC } from '../utils/uiStyle.js';

export function HomePage({ fetchedUser }) {
  const navigate = useNavigate();
  const { t, tb, locale } = useI18n();
  const uiStyle = useUiStyle();
  const isAcademic = uiStyle === UI_STYLE_ACADEMIC;
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

  const tileItems = useMemo(() => {
    const items = [
      {
        key: 'dictionary',
        iconName: 'dictionary',
        label: t('nav.dictionary'),
        onClick: () => navigate('/dictionary'),
      },
    ];
    if (englishModule) {
      items.push({
        key: 'irregularVerbs',
        iconName: 'irregularVerbs',
        label: t('nav.irregularVerbs'),
        onClick: () => navigate('/irregular-verbs'),
      });
    }
    items.push(
      {
        key: 'practice',
        iconName: 'practice',
        label: t('nav.practice'),
        featured: true,
        onClick: () => navigate('/practice'),
      },
      {
        key: 'reader',
        iconName: 'reader',
        label: t('nav.reader'),
        onClick: () => navigate('/reader'),
      },
      {
        key: 'premium',
        iconName: 'premium',
        label: t('nav.premium'),
        onClick: () => navigate('/premium'),
      },
      {
        key: 'settings',
        iconName: 'settings',
        label: t('nav.settings'),
        onClick: () => navigate('/settings'),
      },
      {
        key: 'language',
        iconName: 'language',
        label: tb('nav.language'),
        onClick: () => navigate('/language'),
      },
      {
        key: 'learnLanguage',
        iconName: 'learnLanguage',
        label: tb('nav.learnLanguage'),
        onClick: () => navigate('/learn-language'),
      },
      {
        key: 'readme',
        iconName: 'readme',
        label: t('nav.readme'),
        onClick: () => navigate('/readme'),
      },
    );
    return items;
  }, [englishModule, navigate, t, tb]);

  return (
    <Panel className={isAcademic ? '' : 'ss-styled-home'}>
      {isAcademic ? <PanelHeader>{t('nav.home')}</PanelHeader> : null}

      {isAcademic ? (
        <>
          {fetchedUser ? (
            <Group header={<GroupHeader size="s">{t('home.profile')}</GroupHeader>} className="ss-home-profile">
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

          <Group className="ss-home-menu ss-nav-menu">
            <SeashellBootlog userDisplayName={userDisplayName} lang={locale} className="ss-home-bootlog" />
            <Cell chevron i18nKey="nav.dictionary" onClick={() => navigate('/dictionary')} />
            {englishModule ? (
              <Cell chevron i18nKey="nav.irregularVerbs" onClick={() => navigate('/irregular-verbs')} />
            ) : null}
            <Cell chevron i18nKey="nav.practice" onClick={() => navigate('/practice')} />
            <Cell chevron i18nKey="nav.reader" onClick={() => navigate('/reader')} />
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
        </>
      ) : (
        <>
          <HomeStyleHero
            userDisplayName={userDisplayName}
            avatarUrl={avatarUrl}
            fallbackName={fetchedUser?.first_name}
          />
          <HomeQuoteScreen userName={fetchedUser?.username || userDisplayName} />
          <StyleNavTiles items={tileItems} className="ss-home-tiles" columns={2} />
        </>
      )}
    </Panel>
  );
}
