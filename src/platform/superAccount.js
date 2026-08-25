/** Telegram user id with super-account UI (owner): admin + English button hints. */
export const SUPER_ACCOUNT_USER_ID = 497039245;

export function isSuperAccountUser(userId) {
  const id = parseInt(String(userId ?? ''), 10);
  return Number.isFinite(id) && id > 0 && id === SUPER_ACCOUNT_USER_ID;
}
