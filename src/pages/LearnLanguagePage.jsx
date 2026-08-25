import { useNavigate } from 'react-router-dom';

import { DismissibleHint } from '../components/DismissibleHint.jsx';
import { CheckIcon } from '../components/CheckIcon.jsx';
import {
  Cell,
  Group,
  GroupHeader,
  Panel,
  PanelHeader,
  PanelHeaderBack,
} from '../components/Ui.jsx';
import { LEARN_LOCALES } from '../i18n/learnLocales.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useEscapeBack } from '../hooks/useEscapeBack.js';
import { useLearnLocale } from '../hooks/useLearnLocale.js';
import { normalizeLearnLocale } from '../i18n/learnLocales.js';
import { settingsPatchOnLearnModuleSwitch } from '../modules/learnModuleSwitch.js';
import { updateSettings } from '../utils/settings.js';
import { useNavigateBackOrHome } from '../utils/useNavigateBackOrHome.js';

export function LearnLanguagePage() {
  const navigate = useNavigate();
  const goBackOrHome = useNavigateBackOrHome();
  const { t } = useI18n();
  useEscapeBack(goBackOrHome);

  const learnLocale = useLearnLocale();

  const pickLearnLocale = (code) => {
    const learn = normalizeLearnLocale(code);
    const cardSync = settingsPatchOnLearnModuleSwitch(learn);
    updateSettings({ learnLocale: learn, ...(cardSync ?? {}) });
    navigate('/', { replace: true });
  };

  return (
    <Panel>
      <PanelHeader
        before={<PanelHeaderBack onClick={() => void goBackOrHome()} />}
        after={
          <DismissibleHint hintId="learnLang.hint" className="ss-hint--inline ss-hint--subtle">
            {t('learnLang.hint')}
          </DismissibleHint>
        }
      >
        {t('learnLang.title')}
      </PanelHeader>

      <Group header={<GroupHeader mode="secondary">{t('learnLang.section')}</GroupHeader>}>
        {LEARN_LOCALES.map((item) => (
          <Cell
            key={item.code}
            onClick={() => pickLearnLocale(item.code)}
            after={
              learnLocale === item.code ? <CheckIcon className="ss-locale-check" size={18} /> : null
            }
          >
            <span className="ss-native-name" lang={item.code}>
              {item.nativeName}
            </span>
          </Cell>
        ))}
      </Group>
    </Panel>
  );
}
