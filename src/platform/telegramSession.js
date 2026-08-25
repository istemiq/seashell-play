import {
  getTelegramUser,
  hasTelegramWebApp,
  initTelegramApp,
  waitForInitData,
  waitForTelegramSdk,
} from './telegramApp.js';
import { setPlatformUserId } from './platformUser.js';

let sessionReady = false;
/** @type {Promise<void> | null} */
let sessionPromise = null;

export function bootstrapTelegramSession() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      await waitForTelegramSdk();
      if (!hasTelegramWebApp()) return;
      initTelegramApp();
      await waitForInitData({ timeoutMs: 12000 });
      const user = getTelegramUser();
      if (user?.id) setPlatformUserId(user.id);
    })().finally(() => {
      sessionReady = true;
    });
  }
  return sessionPromise;
}

export function whenTelegramSessionReady() {
  if (sessionReady) return Promise.resolve();
  return bootstrapTelegramSession();
}
