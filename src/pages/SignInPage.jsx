import { useState } from 'react';
import { Button, Group, Text } from '../components/Ui.jsx';
import { completeGoogleSignIn } from '../platform/googleSession.js';

export function SignInPage({ onSignedIn }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn() {
    setLoading(true);
    setError('');
    try {
      await completeGoogleSignIn();
      onSignedIn?.();
    } catch (e) {
      setError(e?.message || 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ss-sign-in-page">
      <div className="ss-sign-in-page__card">
        <Text weight="2" className="ss-sign-in-page__title">
          Seashell Play
        </Text>
        {error ? <Text className="ss-sign-in-page__error">{error}</Text> : null}
        <Group className="ss-sign-in-page__actions">
          <Button stretched mode="primary" loading={loading} onClick={() => void handleSignIn()}>
            Continue with Google
          </Button>
        </Group>
      </div>
    </div>
  );
}
