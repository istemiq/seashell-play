import { useNavigate } from 'react-router-dom';

import {
  Cell,
  Group,
  GroupHeader,
  Panel,
  PanelHeader,
  PanelHeaderBack,
  Text,
} from '../components/Ui.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useEscapeBack } from '../hooks/useEscapeBack.js';
import { useNavigateBackOrHome } from '../utils/useNavigateBackOrHome.js';

export function ReadmePage() {
  const goBackOrHome = useNavigateBackOrHome();
  const navigate = useNavigate();
  const { t } = useI18n();
  useEscapeBack(goBackOrHome);

  return (
    <Panel>
      <PanelHeader before={<PanelHeaderBack onClick={() => void goBackOrHome()} />}>
        {t('readme.title')}
      </PanelHeader>

      <Group header={<GroupHeader mode="secondary">{t('readme.what')}</GroupHeader>}>
        <Text>{t('readme.whatBody')}</Text>
      </Group>

      <Group header={<GroupHeader mode="secondary">{t('readme.general')}</GroupHeader>}>
        <Text>{t('readme.generalBody')}</Text>
      </Group>

      <Group header={<GroupHeader mode="secondary">{t('readme.dict')}</GroupHeader>}>
        <Text>{t('readme.dictBody')}</Text>
      </Group>

      <Group header={<GroupHeader mode="secondary">{t('readme.practice')}</GroupHeader>}>
        <Text>{t('readme.practiceBody')}</Text>
      </Group>

      <Group header={<GroupHeader mode="secondary">{t('readme.settings')}</GroupHeader>}>
        <Text>{t('readme.settingsBody')}</Text>
      </Group>

      <Group
        header={<GroupHeader mode="secondary">{t('readme.legal')}</GroupHeader>}
        className="ss-readme-legal-group"
      >
        <Text className="ss-mb-md">{t('readme.legalBody')}</Text>
        <Cell chevron i18nKey="readme.privacyBtn" onClick={() => navigate('/privacy')} />
      </Group>
    </Panel>
  );
}
