import { resolvePlatformUserId, setPlatformUserId } from './platformUser.js';

export {
  getWebApp,
  hasTelegramWebApp,
  waitForTelegramSdk,
  isTelegramWebApp,
  isBrowserDevMode,
  initTelegramApp,
  getInitData,
  waitForInitData,
  getTelegramUser,
  telegramUserToHomeProfile,
  getTelegramSafeAreaInsets,
  applyTelegramTheme,
} from './telegramApp.js';

export { bootstrapTelegramSession, whenTelegramSessionReady } from './telegramSession.js';

export { resolvePlatformUserId, setPlatformUserId };
