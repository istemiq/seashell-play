/**
 * HTTP API для мини-приложения: словарь (PostgreSQL), разговорная практика (LLM).
 * Публично: GET /api/health. Остальное — Telegram initData или X-Platform-User-Id (dev).
 * Запуск: из каталога seashell — npm run api или npm run dev.
 * Роуты: server/routes/*.js, auth-цепочка: server/authMiddleware.js.
 */
import './load-env.js';
import express from 'express';
import cors from 'cors';
import { WORD_EXAMPLE_COUNT } from './dictionaryConstants.js';
import { initDb, getDbPool } from './db.js';
import { initCustomExamplesDb } from './customExamplesDb.js';
import { logDictionaryPromptStartupInfo } from './llmClient.js';
import { purgeAllPracticeSessions } from './practiceDb.js';
import { llmProviderLabel, resolveLlmModel, resolveLlmProvider } from './llmProvider.js';
import { llmQueueStats } from './llmQueue.js';
import { registerTtsStatic, registerTtsSpeak } from './tts.js';
import { prewarmRuaccentWorker } from './ruTtsStressRuaccent.js';
import { registerSttTranscribe } from './stt.js';
import { handleGoogleSession } from './playAuth.js';
import { handleTelegramBillingUpdate, verifyWebhookSecret } from './telegramBilling.js';
import { isProd, isVkAppsHostingOrigin, makeRateLimiter } from './routeHelpers.js';
import { appAuthMiddleware, vkReviewerProbeMiddleware } from './authMiddleware.js';
import { registerAdminStatsRoute, registerAdminRoutes } from './routes/admin.js';
import { registerUserRoutes } from './routes/user.js';
import { registerPracticeRoutes } from './routes/practice.js';
import { registerDictionaryRoutes } from './routes/dictionary.js';
import { registerReaderRoutes } from './routes/reader.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('X-Frame-Options', 'DENY');
  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// --- Общие middleware: CORS (фронт на другом порту), JSON-тело запросов ---
function allowedOrigins() {
  const raw = String(process.env.CORS_ORIGINS ?? '').trim();
  if (!raw) return null;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const ORIGINS = allowedOrigins();

/** Capacitor Android/iOS WebView (Seashell Play). */
function isCapacitorAppOrigin(origin) {
  try {
    const u = new URL(origin);
    const host = u.hostname.toLowerCase();
    if (host !== 'localhost' && host !== '127.0.0.1') return false;
    const proto = u.protocol.toLowerCase();
    return proto === 'https:' || proto === 'http:' || proto === 'capacitor:';
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, cb) {
      // non-browser requests (curl, server-to-server)
      if (!origin) return cb(null, true);
      // dev default: allow all
      if (!isProd && !ORIGINS) return cb(null, true);
      // prod default: allow none unless configured
      if (isProd && !ORIGINS) return cb(new Error('CORS blocked'), false);
      if (ORIGINS.includes(origin)) return cb(null, true);
      if (isVkAppsHostingOrigin(origin)) return cb(null, true);
      if (isCapacitorAppOrigin(origin)) return cb(null, true);
      return cb(new Error('CORS blocked'), false);
    },
    credentials: false,
    allowedHeaders: [
      'Content-Type',
      'X-Telegram-Init-Data',
      'X-Platform-User-Id',
      'X-UI-Locale',
      'X-Content-Locale',
      'X-Target-Lang',
      'X-Practice-Level',
      'X-Learn-Locale',
      'X-Google-Id-Token',
      'X-Play-App-Secret',
    ],
  }),
);
app.use(express.json({ limit: '256kb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, wordExampleLimit: WORD_EXAMPLE_COUNT, llmQueue: llmQueueStats() });
});

// Admin stats (Bearer token) — до auth-middleware.
registerAdminStatsRoute(app);

// --- Public static: TTS mp3 cache (/tts/v1/...) ---
// Must be registered before auth middleware: mp3 files are fetched by native player without headers.
registerTtsStatic(app);

// Telegram Bot webhook (Stars payments) — no user auth, secret token only.
app.post('/api/telegram/webhook', async (req, res) => {
  if (!verifyWebhookSecret(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const result = await handleTelegramBillingUpdate(req.body ?? {});
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error('[billing] webhook error', e);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Play + Google + Telegram initData + VK launch params (shared VPS API).
app.post('/api/auth/google/session', (req, res) => {
  void handleGoogleSession(req, res);
});

app.use(appAuthMiddleware);
app.use(vkReviewerProbeMiddleware);

registerUserRoutes(app);
registerAdminRoutes(app);

registerTtsSpeak(app, { makeRateLimiter });
registerSttTranscribe(app, { makeRateLimiter });

registerPracticeRoutes(app);
registerDictionaryRoutes(app);
registerReaderRoutes(app);

function assertProductionSecurityConfig() {
  if (!isProd) return;

  const googleConfigured = [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
    process.env.GOOGLE_WEB_CLIENT_ID,
  ].some((v) => String(v ?? '').trim());

  const telegramConfigured = String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
  const playConfigured = String(process.env.PLAY_APP_SECRET ?? '').trim();

  if (googleConfigured || telegramConfigured || playConfigured) return;

  console.error(
    '[seashell-play] FATAL: NODE_ENV=production requires GOOGLE_CLIENT_ID, TELEGRAM_BOT_TOKEN, or PLAY_APP_SECRET',
  );
  process.exit(1);
}

async function start() {
  assertProductionSecurityConfig();
  await initDb();
  await initCustomExamplesDb(getDbPool());
  logDictionaryPromptStartupInfo();
  if (String(process.env.PURGE_PRACTICE_HISTORY_ONCE ?? '').trim() === '1') {
    const n = await purgeAllPracticeSessions();
    console.log(`[practice] Purged ${n} stored sessions (PURGE_PRACTICE_HISTORY_ONCE=1)`);
  }
  const googleConfigured = [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
    process.env.GOOGLE_WEB_CLIENT_ID,
  ].some((v) => String(v ?? '').trim());
  if (googleConfigured) {
    console.log('[seashell-play] Google Sign-In auth: enabled');
  } else if (String(process.env.PLAY_DEV_AUTH ?? '').trim() === '1') {
    console.log('[seashell-play] PLAY_DEV_AUTH=1 (emulator dev auth)');
  }

  app.listen(PORT, '0.0.0.0', () => {
    const provider = resolveLlmProvider();
    const model = resolveLlmModel();
    console.log(`API: http://0.0.0.0:${PORT} (PORT=${process.env.PORT ?? 'default 3001'})`);
    console.log(`LLM: provider=${provider} (${llmProviderLabel()}) model=${model}`);
    prewarmRuaccentWorker().catch(() => {});
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
