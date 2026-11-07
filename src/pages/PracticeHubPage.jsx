import { useMemo } from 'react';
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
import { Cell, Group, GroupHeader } from '../components/Ui.jsx';

export function PracticeHubPage() {
  const navigate = useNavigate();
  const goBackOrHome = useNavigateBackOrHome();
  const { t: tr } = useI18n();
  const uiStyle = useUiStyle();
  const isAcademic = uiStyle === UI_STYLE_ACADEMIC;
  useEscapeBack(goBackOrHome);

  const tileItems = useMemo(
    () => [
      {
        key: 'hubFree',
        iconName: 'hubFree',
        label: tr('practice.hubFree'),
        featured: true,
        onClick: () => navigate('/practice/chat'),
      },
      {
        key: 'hubExpert',
        iconName: 'hubExpert',
        label: tr('practice.hubExpert'),
        onClick: () => navigate('/practice/expert'),
      },
      {
        key: 'hubPattern',
        iconName: 'hubPattern',
        label: tr('practice.hubPattern'),
        onClick: () => {
          savePatternPracticeSessionId(loadSettings().learnLocale, null);
          navigate('/practice/pattern');
        },
      },
    ],
    [navigate, tr],
  );

  return (
    <Panel className={isAcademic ? '' : 'ss-styled-hub'}>
      <PanelHeader before={<PanelHeaderBack onClick={() => void goBackOrHome()} />}>
        {tr('practice.hubTitle')}
      </PanelHeader>

      {isAcademic ? (
        <Group className="ss-practice-hub ss-nav-menu" header={<GroupHeader mode="secondary">{tr('practice.hubChoose')}</GroupHeader>}>
          <Cell chevron i18nKey="practice.hubFree" onClick={() => navigate('/practice/chat')} />
          <Cell chevron i18nKey="practice.hubExpert" onClick={() => navigate('/practice/expert')} />
          <Cell
            chevron
            i18nKey="practice.hubPattern"
            onClick={() => {
              savePatternPracticeSessionId(loadSettings().learnLocale, null);
              navigate('/practice/pattern');
            }}
          />
        </Group>
      ) : (
        <StyleNavTiles items={tileItems} className="ss-hub-tiles" columns={1} />
      )}
    </Panel>
  );
}
