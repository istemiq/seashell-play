import { useNavigate } from 'react-router-dom';

import {
  Cell,
  Group,
  GroupHeader,
  Panel,
  PanelHeader,
  PanelHeaderBack,
} from '../components/Ui.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useEscapeBack } from '../hooks/useEscapeBack.js';
import { useNavigateBackOrHome } from '../utils/useNavigateBackOrHome.js';
import { loadSettings } from '../utils/settings.js';
import { savePatternPracticeSessionId } from '../utils/practiceSession.js';

export function PracticeHubPage() {
  const navigate = useNavigate();
  const goBackOrHome = useNavigateBackOrHome();
  const { t: tr } = useI18n();
  useEscapeBack(goBackOrHome);

  return (
    <Panel>
      <PanelHeader before={<PanelHeaderBack onClick={() => void goBackOrHome()} />}>
        {tr('practice.hubTitle')}
      </PanelHeader>

      <Group header={<GroupHeader mode="secondary">{tr('practice.hubChoose')}</GroupHeader>}>
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
    </Panel>
  );
}
