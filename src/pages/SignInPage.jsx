import { useState } from 'react';
import { Button, Group, Text } from '../components/Ui.jsx';
import { completeGoogleSignIn } from '../platform/googleSession.js';
import { isPlayDevAuth } from '../platform/runtime.js';

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
    <div className="boot-loader" style={{ padding: 24, textAlign: 'center' }}>
      <Text weight="2" style={{ fontSize: 22, marginBottom: 8 }}>
        Seashell
      </Text>
      <Text style={{ opacity: 0.75, marginBottom: 24 }}>
        Sign in with Google to sync your dictionary and practice progress.
      </Text>
      {isPlayDevAuth() ? (
        <Text style={{ opacity: 0.6, marginBottom: 16, fontSize: 13 }}>
          Dev mode: emulator auth without Google Cloud credentials.
        </Text>
      ) : null}
      {error ? (
        <Text style={{ color: 'var(--seashell-danger, #f66)', marginBottom: 12 }}>{error}</Text>
      ) : null}
      <Group>
        <Button stretched mode="primary" loading={loading} onClick={() => void handleSignIn()}>
          Continue with Google
        </Button>
      </Group>
    </div>
  );
}
