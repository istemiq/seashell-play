import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Panel, PanelHeader, PanelHeaderBack } from '../components/Ui.jsx';
import { StyleNavTiles } from '../components/StyleNavTiles.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useEscapeBack } from '../hooks/useEscapeBack.js';
import { useNavigateBackOrHome } from '../utils/useNavigateBackOrHome.js';
import { useUiStyle } from '../hooks/useUiStyle.js';
import { isEnglishLearnModule, useLearnLocale } from '../hooks/useLearnLocale.js';
import { loadSettings } from '../utils/settings.js';
import { savePatternPracticeSessionId } from '../utils/practiceSession.js';
import { UI_STYLE_ACADEMIC } from '../utils/uiStyle.js';
import { Cell, Group, GroupHeader } from '../components/Ui.jsx';

export function TrainersHubPage() {
  const navigate = useNavigate();
  const goBackOrHome = useNavigateBackOrHome();
  const { t: tr } = useI18n();
  const uiStyle = useUiStyle();
  const isAcademic = uiStyle === UI_STYLE_ACADEMIC;
  const learnLocale = useLearnLocale();
  const englishModule = isEnglishLearnModule(learnLocale);
  useEscapeBack(goBackOrHome);

  const openPatterns = () => {
    savePatternPracticeSessionId(loadSettings().learnLocale, null);
    navigate('/practice/pattern');
  };

  const beginnerItems = useMemo(
    () => [
      {
        key: 'pronouns',
        iconName: 'trainers',
        label: tr('trainers.pronouns'),
        featured: true,
        onClick: () => navigate('/trainers/pronouns'),
      },
    ],
    [navigate, tr],
  );

  const patternItems = useMemo(
    () => [
      {
        key: 'patterns',
        iconName: 'hubPattern',
        label: tr('trainers.patterns'),
        onClick: openPatterns,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tr],
  );

  return (
    <Panel className={isAcademic ? '' : 'ss-styled-hub'}>
      <PanelHeader before={<PanelHeaderBack onClick={() => void goBackOrHome()} />}>
        {tr('nav.trainers')}
      </PanelHeader>

      {isAcademic ? (
        <>
          {englishModule ? (
            <Group className="ss-practice-hub ss-nav-menu" header={<GroupHeader mode="secondary">{tr('trainer.levelBeginner')}</GroupHeader>}>
              <Cell chevron i18nKey="trainers.pronouns" onClick={() => navigate('/trainers/pronouns')} />
            </Group>
          ) : null}
          <Group className="ss-practice-hub ss-nav-menu">
            <Cell chevron i18nKey="trainers.patterns" onClick={openPatterns} />
          </Group>
        </>
      ) : (
        <>
          {englishModule ? (
            <>
              <GroupHeader mode="secondary" size="s">{tr('trainer.levelBeginner')}</GroupHeader>
              <StyleNavTiles items={beginnerItems} className="ss-hub-tiles" columns={1} />
            </>
          ) : null}
          <StyleNavTiles items={patternItems} className="ss-hub-tiles" columns={1} />
        </>
      )}
    </Panel>
  );
}
