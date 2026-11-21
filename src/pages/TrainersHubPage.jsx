import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Panel, PanelHeader, PanelHeaderBack } from '../components/Ui.jsx';
import { StyleNavTiles } from '../components/StyleNavTiles.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useEscapeBack } from '../hooks/useEscapeBack.js';
import { useNavigateBackOrHome } from '../utils/useNavigateBackOrHome.js';
import { useUiStyle } from '../hooks/useUiStyle.js';
import { loadSettings } from '../utils/settings.js';
import { savePatternPracticeSessionId } from '../utils/practiceSession.js';
import { UI_STYLE_ACADEMIC } from '../utils/uiStyle.js';
import { Cell, Group } from '../components/Ui.jsx';
import { NavIcon } from '../components/NavIcon.jsx';

export function TrainersHubPage() {
  const navigate = useNavigate();
  const goBackOrHome = useNavigateBackOrHome();
  const { t: tr } = useI18n();
  const uiStyle = useUiStyle();
  const isAcademic = uiStyle === UI_STYLE_ACADEMIC;
  const [beginnerOpen, setBeginnerOpen] = useState(true);
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
      {
        key: 'smalltalk',
        iconName: 'trainers',
        label: tr('trainers.smalltalk'),
        onClick: () => navigate('/trainers/smalltalk'),
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

      <button
        type="button"
        className={`ss-trainer-folder ${beginnerOpen ? 'ss-trainer-folder--open' : ''}`}
        onClick={() => setBeginnerOpen((v) => !v)}
        aria-expanded={beginnerOpen}
      >
        <span className="ss-trainer-folder-icon" aria-hidden="true">
          <NavIcon name="trainers" size={24} />
        </span>
        <span className="ss-trainer-folder-title">{tr('trainers.beginner')}</span>
        <span className="ss-trainer-folder-count">{beginnerItems.length}</span>
        <span className="ss-trainer-folder-chevron" aria-hidden="true">›</span>
      </button>

      {beginnerOpen ? (
        <div className="ss-trainer-folder-body">
          {isAcademic ? (
            <Group className="ss-practice-hub ss-nav-menu">
              <Cell chevron i18nKey="trainers.pronouns" onClick={() => navigate('/trainers/pronouns')} />
              <Cell chevron i18nKey="trainers.smalltalk" onClick={() => navigate('/trainers/smalltalk')} />
            </Group>
          ) : (
            <StyleNavTiles items={beginnerItems} className="ss-hub-tiles" columns={1} />
          )}
        </div>
      ) : null}

      {isAcademic ? (
        <Group className="ss-practice-hub ss-nav-menu">
          <Cell chevron i18nKey="trainers.patterns" onClick={openPatterns} />
        </Group>
      ) : (
        <StyleNavTiles items={patternItems} className="ss-hub-tiles" columns={1} />
      )}
    </Panel>
  );
}
