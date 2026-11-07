import { useNavigate } from 'react-router-dom';

import { CheckIcon } from '../components/CheckIcon.jsx';
import {
  Cell,
  Group,
  GroupHeader,
  Panel,
  PanelHeader,
  PanelHeaderBack,
} from '../components/Ui.jsx';
import { UI_LOCALES } from '../i18n/config.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useEscapeBack } from '../hooks/useEscapeBack.js';
import { useLearnLocale } from '../hooks/useLearnLocale.js';
import { dictMessageForLearn } from '../utils/contentLocale.js';
import { useNavigateBackOrHome } from '../utils/useNavigateBackOrHome.js';

export function LanguagePage() {
  const navigate = useNavigate();
  const goBackOrHome = useNavigateBackOrHome();
  const { locale, setLocale, t } = useI18n();
  const learnLocale = useLearnLocale();
  useEscapeBack(goBackOrHome);

  const pickLocale = (code) => {
    setLocale(code);
    navigate('/', { replace: true });
  };

  return (
    <Panel>
      <PanelHeader
        before={<PanelHeaderBack onClick={() => void goBackOrHome()} />}
      >
        {t('lang.title')}
      </PanelHeader>

      <Group header={<GroupHeader mode="secondary">{t('lang.section')}</GroupHeader>}>
        {UI_LOCALES.map((item) => (
          <Cell
            key={item.code}
            onClick={() => pickLocale(item.code)}
            after={locale === item.code ? <CheckIcon className="ss-locale-check" size={18} /> : null}
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
