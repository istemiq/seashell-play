import { Suspense, lazy, useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { SplitModalSlotContext } from './context/SplitModalSlotContext.js';
import { I18nProvider } from './i18n/I18nContext.jsx';
import { useAppTheme } from './hooks/useAppTheme.js';
import { HomePage } from './pages/HomePage.jsx';
import { SignInPage } from './pages/SignInPage.jsx';
import { LearnLocaleTitleSync } from './components/LearnLocaleTitleSync.jsx';
import { loadGoogleProfile } from './platform/googleAuthStore.js';
import { bootstrapGoogleSession, whenGoogleSessionReady } from './platform/googleSession.js';
import { hasGoogleSession } from './platform/googleSignIn.js';

const LanguagePage = lazy(() => import('./pages/LanguagePage.jsx').then((m) => ({ default: m.LanguagePage })));
const LearnLanguagePage = lazy(() =>
  import('./pages/LearnLanguagePage.jsx').then((m) => ({ default: m.LearnLanguagePage })),
);
const DictionaryPage = lazy(() => import('./pages/DictionaryPage.jsx').then((m) => ({ default: m.DictionaryPage })));
const PracticePage = lazy(() => import('./pages/PracticePage.jsx').then((m) => ({ default: m.PracticePage })));
const PracticeHubPage = lazy(() =>
  import('./pages/PracticeHubPage.jsx').then((m) => ({ default: m.PracticeHubPage })),
);
const ExpertPracticePage = lazy(() =>
  import('./pages/ExpertPracticePage.jsx').then((m) => ({ default: m.ExpertPracticePage })),
);
const WordPracticePage = lazy(() =>
  import('./pages/WordPracticePage.jsx').then((m) => ({ default: m.WordPracticePage })),
);
const PatternPracticePage = lazy(() =>
  import('./pages/PatternPracticePage.jsx').then((m) => ({ default: m.PatternPracticePage })),
);
const IrregularVerbsPage = lazy(() =>
  import('./pages/IrregularVerbsPage.jsx').then((m) => ({ default: m.IrregularVerbsPage })),
);
const PrivacyPage = lazy(() => import('./pages/PrivacyPage.jsx').then((m) => ({ default: m.PrivacyPage })));
const ReadmePage = lazy(() => import('./pages/ReadmePage.jsx').then((m) => ({ default: m.ReadmePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx').then((m) => ({ default: m.SettingsPage })));
const PremiumPage = lazy(() => import('./pages/PremiumPage.jsx').then((m) => ({ default: m.PremiumPage })));
const AdminPage = lazy(() => import('./pages/AdminPage.jsx').then((m) => ({ default: m.AdminPage })));

function RouteFallback() {
  return (
    <div className="boot-loader" role="status" aria-label="Loading">
      <span className="boot-shimmer" aria-hidden="true">
        seashell
      </span>
    </div>
  );
}

function profileFromGoogle() {
  const p = loadGoogleProfile();
  if (!p) return null;
  const name = String(p.name || 'User').trim();
  const parts = name.split(/\s+/);
  return {
    first_name: parts[0] || 'User',
    last_name: parts.slice(1).join(' ') || undefined,
    photo_200: p.picture || undefined,
  };
}

function AppRoutes({ fetchedUser }) {
  return (
    <>
      <LearnLocaleTitleSync />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route index element={<HomePage fetchedUser={fetchedUser} />} />
          <Route path="dictionary" element={<DictionaryPage />} />
          <Route path="irregular-verbs" element={<IrregularVerbsPage />} />
          <Route path="practice/word/:wordId" element={<WordPracticePage />} />
          <Route path="practice/pattern" element={<PatternPracticePage />} />
          <Route path="practice" element={<PracticeHubPage />} />
          <Route path="practice/chat" element={<PracticePage />} />
          <Route path="practice/expert" element={<ExpertPracticePage />} />
          <Route path="practice/expert/:expertId" element={<ExpertPracticePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="premium" element={<PremiumPage />} />
          <Route path="language" element={<LanguagePage />} />
          <Route path="learn-language" element={<LearnLanguagePage />} />
          <Route path="readme" element={<ReadmePage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export function App() {
  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [fetchedUser, setUser] = useState(null);
  const [splitModalMountEl, setSplitModalMountEl] = useState(null);
  const effectiveTheme = useAppTheme();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (hasGoogleSession()) {
        try {
          await bootstrapGoogleSession();
        } catch (err) {
          console.warn('[Seashell] session restore failed', err);
        }
      }
      if (cancelled) return;
      const ok = hasGoogleSession();
      setSignedIn(ok);
      if (ok) setUser(profileFromGoogle());
      setAuthReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSignedIn() {
    await whenGoogleSessionReady();
    setSignedIn(true);
    setUser(profileFromGoogle());
  }

  if (!authReady) return <RouteFallback />;

  if (!signedIn) {
    return (
      <ErrorBoundary>
        <I18nProvider>
          <div className={`seashell-crt seashell-theme-${effectiveTheme}`}>
            <SignInPage onSignedIn={() => void onSignedIn()} />
          </div>
        </I18nProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <I18nProvider>
        <SplitModalSlotContext.Provider value={splitModalMountEl}>
          <div className={`seashell-crt seashell-theme-${effectiveTheme}`}>
            <HashRouter>
              <AppRoutes fetchedUser={fetchedUser} />
              <div
                ref={setSplitModalMountEl}
                className="seashell-global-modal-mount"
                aria-hidden="true"
              />
            </HashRouter>
          </div>
        </SplitModalSlotContext.Provider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
