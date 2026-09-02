import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CheckIcon } from '../components/CheckIcon.jsx';
import {
  Button,
  Cell,
  FormItem,
  Group,
  GroupHeader,
  Panel,
  PanelHeader,
  PanelHeaderBack,
  Slider,
  Switch,
  Footnote,
} from '../components/Ui.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { useEscapeBack } from '../hooks/useEscapeBack.js';
import { useLearnLocale } from '../hooks/useLearnLocale.js';
import { getStudyModuleCode } from '../modules/learnModuleSwitch.js';
import { loadSettings, updateSettings, getSavedTtsLocaleForLearn } from '../utils/settings.js';
import { speechLocaleForLearn } from '../utils/studySpeech.js';
import { speakStudyText, unlockAudioPlayback } from '../utils/tts.js';
import { setThemePreference, THEME_DARK, THEME_LIGHT, THEME_SYSTEM } from '../utils/theme.js';
import {
  FONT_LARGE,
  FONT_NORMAL,
  FONT_XLARGE,
  setFontScalePreference,
} from '../utils/fontScale.js';
import { useNavigateBackOrHome } from '../utils/useNavigateBackOrHome.js';
import { usePremium } from '../hooks/usePremium.js';

function SettingOptions({ options, value, onChange, disabled = false }) {
  const { tb } = useI18n();
  return options.map((opt) => (
    <Cell
      key={opt.value}
      disabled={disabled}
      onClick={() => onChange(opt.value)}
      after={String(value) === String(opt.value) ? <CheckIcon className="ss-locale-check" size={18} /> : null}
    >
      {tb(opt.labelKey)}
    </Cell>
  ));
}

export function SettingsPage() {
  const navigate = useNavigate();
  const goBackOrHome = useNavigateBackOrHome();
  const { t } = useI18n();
  useEscapeBack(goBackOrHome);
  const initial = useMemo(() => loadSettings(), []);
  const [s, setS] = useState(initial);
  const { plan } = usePremium();
  const learnLocale = useLearnLocale();
  const studyModule = getStudyModuleCode(learnLocale);

  const setAndPersist = (patch) => {
    const next = updateSettings(patch);
    setS(next);
  };

  const themeOptions = [
    { labelKey: 'settings.themeTelegram', value: THEME_SYSTEM },
    { labelKey: 'settings.themeLight', value: THEME_LIGHT },
    { labelKey: 'settings.themeDark', value: THEME_DARK },
  ];

  const fontScaleOptions = [
    { labelKey: 'settings.fontSizeNormal', value: FONT_NORMAL },
    { labelKey: 'settings.fontSizeLarge', value: FONT_LARGE },
    { labelKey: 'settings.fontSizeXLarge', value: FONT_XLARGE },
  ];

  const accentOptions = useMemo(() => {
    if (studyModule === 'ru') {
      return [{ labelKey: 'settings.accentRu', value: 'ru-RU' }];
    }
    if (studyModule === 'ar') {
      return [{ labelKey: 'settings.accentAr', value: 'ar-JO' }];
    }
    if (studyModule === 'es') {
      return [{ labelKey: 'settings.accentEs', value: 'es-ES' }];
    }
    if (studyModule === 'pt') {
      return [{ labelKey: 'settings.accentPt', value: 'pt-BR' }];
    }
    if (studyModule === 'it') {
      return [{ labelKey: 'settings.accentIt', value: 'it-IT' }];
    }
    if (studyModule === 'el') {
      return [{ labelKey: 'settings.accentEl', value: 'el-GR' }];
    }
    if (studyModule === 'fa') {
      return [{ labelKey: 'settings.accentFa', value: 'fa-IR' }];
    }
    if (studyModule === 'da') {
      return [{ labelKey: 'settings.accentDa', value: 'da-DK' }];
    }
    if (studyModule === 'nl') {
      return [{ labelKey: 'settings.accentNl', value: 'nl-NL' }];
    }
    if (studyModule === 'fr') {
      return [{ labelKey: 'settings.accentFr', value: 'fr-FR' }];
    }
    if (studyModule === 'de') {
      return [{ labelKey: 'settings.accentDe', value: 'de-DE' }];
    }
    if (studyModule === 'tr') {
      return [{ labelKey: 'settings.accentTr', value: 'tr-TR' }];
    }
    if (studyModule === 'sv') {
      return [{ labelKey: 'settings.accentSv', value: 'sv-SE' }];
    }
    if (studyModule === 'no') {
      return [{ labelKey: 'settings.accentNo', value: 'no-NO' }];
    }
    if (studyModule === 'fi') {
      return [{ labelKey: 'settings.accentFi', value: 'fi-FI' }];
    }
    if (studyModule === 'zh') {
      return [
        { labelKey: 'settings.accentZhCn', value: 'zh-CN' },
        { labelKey: 'settings.accentZhTw', value: 'zh-TW' },
      ];
    }
    if (studyModule === 'uk') {
      return [{ labelKey: 'settings.accentUk', value: 'uk-UA' }];
    }
    if (studyModule === 'ba') {
      return [{ labelKey: 'settings.accentBa', value: 'ba' }];
    }
    if (studyModule === 'pl') {
      return [{ labelKey: 'settings.accentPl', value: 'pl-PL' }];
    }
    if (studyModule === 'hi') {
      return [{ labelKey: 'settings.accentHi', value: 'hi-IN' }];
    }
    if (studyModule === 'ur') {
      return [{ labelKey: 'settings.accentUr', value: 'ur-PK' }];
    }
    if (studyModule === 'vi') {
      return [{ labelKey: 'settings.accentVi', value: 'vi-VN' }];
    }
    if (studyModule === 'cs') {
      return [{ labelKey: 'settings.accentCs', value: 'cs-CZ' }];
    }
    if (studyModule === 'hu') {
      return [{ labelKey: 'settings.accentHu', value: 'hu-HU' }];
    }
    if (studyModule === 'ro') {
      return [{ labelKey: 'settings.accentRo', value: 'ro-RO' }];
    }
    if (studyModule === 'id') {
      return [{ labelKey: 'settings.accentId', value: 'id-ID' }];
    }
    if (studyModule === 'he') {
      return [{ labelKey: 'settings.accentHe', value: 'he-IL' }];
    }
    if (studyModule === 'ca') {
      return [{ labelKey: 'settings.accentCa', value: 'ca-ES' }];
    }
    if (studyModule === 'sr') {
      return [{ labelKey: 'settings.accentSr', value: 'sr-RS' }];
    }
    return [
      { labelKey: 'settings.accentUs', value: 'en-US' },
      { labelKey: 'settings.accentGb', value: 'en-GB' },
    ];
  }, [studyModule]);

  const accentValue = useMemo(() => {
    const saved = getSavedTtsLocaleForLearn(s, studyModule);
    if (saved) return saved;
    const stored = String(s.ttsLocale || '').trim();
    if (accentOptions.some((o) => o.value === stored)) return stored;
    return speechLocaleForLearn(learnLocale);
  }, [s, accentOptions, learnLocale, studyModule]);

  const previewAccent = (ttsLocale) => {
    if (!s.ttsEnabled) return;
    const samples = {
      en: 'Hello, how are you?',
      zh: '你好，很高兴认识你。',
      ba: 'Сәләм! Нихәл?',
    };
    const sample = samples[studyModule];
    if (!sample) return;
    void unlockAudioPlayback();
    void speakStudyText(sample, ttsLocale).catch(() => {});
  };

  return (
    <Panel>
      <PanelHeader before={<PanelHeaderBack onClick={() => void goBackOrHome()} />}>
        {t('settings.title')}
      </PanelHeader>

      {plan.admin ? (
        <Group>
          <FormItem>
            <Button
              size="l"
              stretched
              mode="primary"
              i18nKey="admin.open"
              onClick={() => navigate('/admin')}
            />
          </FormItem>
        </Group>
      ) : null}

      <Group header={<GroupHeader mode="secondary">{t('settings.interface')}</GroupHeader>}>
        <FormItem top={t('settings.theme')}>
          <SettingOptions
            options={themeOptions}
            value={String(s.theme || THEME_SYSTEM)}
            onChange={(theme) => {
              setAndPersist({ theme });
              setThemePreference(theme);
            }}
          />
        </FormItem>
        <FormItem top={t('settings.fontSize')}>
          <SettingOptions
            options={fontScaleOptions}
            value={String(s.fontScale || FONT_NORMAL)}
            onChange={(fontScale) => {
              setAndPersist({ fontScale });
              setFontScalePreference(fontScale);
            }}
          />
        </FormItem>
      </Group>

      <Group header={<GroupHeader mode="secondary">{t('billing.title')}</GroupHeader>}>
        <FormItem>
          <Cell chevron i18nKey={plan.premium ? 'billing.premiumActive' : 'nav.premium'} onClick={() => navigate('/premium')} />
        </FormItem>
      </Group>

      <Group header={<GroupHeader mode="secondary">{t('settings.tts')}</GroupHeader>}>
        <FormItem>
          <label className="ss-switch-row">
            <Switch
              checked={!!s.ttsEnabled}
              onChange={(e) => setAndPersist({ ttsEnabled: e.target.checked })}
            />
            <span className="ss-switch-row__label">{t('settings.ttsEnable')}</span>
          </label>
        </FormItem>
        <FormItem top={t('settings.accent')}>
          <SettingOptions
            options={accentOptions}
            value={accentValue}
            disabled={!s.ttsEnabled}
            onChange={(ttsLocale) => {
              setAndPersist({ ttsLocale });
              previewAccent(ttsLocale);
            }}
          />
        </FormItem>
        <FormItem top={t('settings.ttsRate', { rate: Number(s.ttsRate).toFixed(2) })}>
          <Slider
            min={0.7}
            max={1.2}
            step={0.05}
            value={Number(s.ttsRate) || 0.95}
            onChange={(v) => setAndPersist({ ttsRate: v })}
            disabled={!s.ttsEnabled}
          />
        </FormItem>
      </Group>
    </Panel>
  );
}
