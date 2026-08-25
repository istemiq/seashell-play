import {
  Group,
  GroupHeader,
  Panel,
  PanelHeader,
  PanelHeaderBack,
  Text,
} from '../components/Ui.jsx';
import {
  PRIVACY_POLICY_INTRO as PRIVACY_POLICY_INTRO_EN,
  PRIVACY_POLICY_SECTIONS as PRIVACY_POLICY_SECTIONS_EN,
  PRIVACY_POLICY_TITLE as PRIVACY_POLICY_TITLE_EN,
} from '../content/privacyPolicyEn.js';
import {
  PRIVACY_POLICY_INTRO as PRIVACY_POLICY_INTRO_RU,
  PRIVACY_POLICY_SECTIONS as PRIVACY_POLICY_SECTIONS_RU,
  PRIVACY_POLICY_TITLE as PRIVACY_POLICY_TITLE_RU,
} from '../content/privacyPolicyRu.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useEscapeBack } from '../hooks/useEscapeBack.js';
import { useNavigateBackOrHome } from '../utils/useNavigateBackOrHome.js';

function PolicySections({ title, intro, sections }) {
  return (
    <>
      <Group>
        <Text weight="2">{title}</Text>
        <Text className="ss-mt-sm ss-text-dim">{intro}</Text>
      </Group>

      {sections.map((section) => (
        <Group key={section.title} header={<GroupHeader mode="secondary">{section.title}</GroupHeader>}>
          {section.body?.map((paragraph) => (
            <Text key={paragraph.slice(0, 40)} className="ss-mb-sm">
              {paragraph}
            </Text>
          ))}
          {section.list ? (
            <ul className="ss-privacy-list">
              {section.list.map((item) => (
                <li key={item.slice(0, 40)}>
                  <Text>{item}</Text>
                </li>
              ))}
            </ul>
          ) : null}
        </Group>
      ))}
    </>
  );
}

export function PrivacyPage() {
  const goBackOrHome = useNavigateBackOrHome();
  const { t, locale } = useI18n();
  useEscapeBack(goBackOrHome);
  const useRussianLegal = locale === 'ru' || locale === 'uk';

  return (
    <Panel>
      <PanelHeader before={<PanelHeaderBack onClick={goBackOrHome} />}>
        {t('privacy.title')}
      </PanelHeader>

      {useRussianLegal ? (
        <PolicySections
          title={PRIVACY_POLICY_TITLE_RU}
          intro={PRIVACY_POLICY_INTRO_RU}
          sections={PRIVACY_POLICY_SECTIONS_RU}
        />
      ) : (
        <PolicySections
          title={PRIVACY_POLICY_TITLE_EN}
          intro={PRIVACY_POLICY_INTRO_EN}
          sections={PRIVACY_POLICY_SECTIONS_EN}
        />
      )}
    </Panel>
  );
}
