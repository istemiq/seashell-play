import { useState } from 'react';
import { Button, Group, Text } from '../components/Ui.jsx';
import { completeGoogleSignIn } from '../platform/googleSession.js';
import { signInWithTelegramLink } from '../platform/telegramLinkAuth.js';
import { invalidateAuthHeadersCache } from '../api/buildAuthHeaders.js';

export function SignInPage({ onSignedIn }) {
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  async function run(kind, fn) {
    setLoading(kind);
    setError('');
    try {
      await fn();
      invalidateAuthHeadersCache();
      onSignedIn?.();
    } catch (e) {
      setError(e?.message || 'Sign-in failed');
    } finally {
      setLoading('');
    }
  }

  return (
    <div className="ss-sign-in-page">
      <div className="ss-sign-in-page__card">
        <Text weight="2" className="ss-sign-in-page__title">
          Seashell Play
        </Text>
        {error ? <Text className="ss-sign-in-page__error">{error}</Text> : null}
        {loading === 'tg' ? (
          <Text className="ss-sign-in-page__hint">Confirm sign-in in the Telegram bot…</Text>
        ) : null}
        <Group className="ss-sign-in-page__actions">
          <Button
            stretched
            mode="primary"
            loading={loading === 'google'}
            onClick={() => void run('google', completeGoogleSignIn)}
          >
            Continue with Google
          </Button>
          <Button
            stretched
            mode="secondary"
            loading={loading === 'tg'}
            onClick={() => void run('tg', signInWithTelegramLink)}
          >
            Continue with Telegram
          </Button>
        </Group>
      </div>
    </div>
  );
}
