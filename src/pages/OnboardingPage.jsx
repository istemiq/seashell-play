import { useState } from 'react';
import { Button, FormItem, Group, Input, Text } from '../components/Ui.jsx';
import { updateUserProfile } from '../api/userApi.js';
import { loadGoogleProfile, saveGoogleProfile } from '../platform/googleAuthStore.js';
import { useI18n } from '../i18n/I18nContext.jsx';

export function OnboardingPage({ onComplete }) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('onboarding.nameRequired'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const profile = await updateUserProfile(trimmed);
      const prev = loadGoogleProfile() || {};
      saveGoogleProfile({
        ...prev,
        name: profile.displayName,
        displayName: profile.displayName,
        needsOnboarding: false,
      });
      onComplete?.(profile.displayName);
    } catch (e) {
      setError(e?.message || t('errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ss-sign-in-page">
      <div className="ss-sign-in-page__card">
        <Text weight="2" className="ss-sign-in-page__title">
          {t('onboarding.title')}
        </Text>
        <Text className="ss-sign-in-page__lead">{t('onboarding.prompt')}</Text>
        <Group>
          <FormItem top={t('onboarding.nameLabel')}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('onboarding.namePlaceholder')}
              maxLength={40}
              autoFocus
            />
          </FormItem>
        </Group>
        {error ? <Text className="ss-sign-in-page__error">{error}</Text> : null}
        <Group className="ss-sign-in-page__actions">
          <Button stretched mode="primary" loading={loading} onClick={() => void handleSubmit()}>
            {t('onboarding.continue')}
          </Button>
        </Group>
      </div>
    </div>
  );
}
