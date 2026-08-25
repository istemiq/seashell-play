import { getWebApp } from '../platform/telegramApp.js';

/** True when Telegram native BackButton is shown (hide in-app duplicate). */
export function isTelegramBackButtonAvailable() {
  return Boolean(getWebApp()?.BackButton);
}
