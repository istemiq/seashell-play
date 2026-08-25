import { showRewardedAd } from '../ads/index.js';
import { fetchUserLimits, rewardAdView } from '../api/userApi.js';

export function isQuotaLimitError(message) {
  const m = String(message ?? '').toLowerCase();
  return (
    m.includes('free limit') ||
    m.includes('daily limit') ||
    m.includes('лимит исчерпан') ||
    m.includes('лимит')
  );
}

/** @deprecated */
export const isDailyLimitError = isQuotaLimitError;

export class AdUnavailableError extends Error {
  constructor() {
    super('ADS_UNAVAILABLE');
    this.name = 'AdUnavailableError';
    this.code = 'ADS_UNAVAILABLE';
  }
}

export function isAdUnavailableError(err) {
  return err?.code === 'ADS_UNAVAILABLE' || err?.name === 'AdUnavailableError';
}

/** Show rewarded ad, record view on server, return fresh limits. */
export async function watchAdAndRefreshLimits(type) {
  try {
    const viewed = await showRewardedAd();
    if (!viewed) throw new AdUnavailableError();
    await rewardAdView(type);
    return fetchUserLimits();
  } catch (e) {
    if (isAdUnavailableError(e)) throw e;
    console.warn('[ads] rewarded failed', e);
    throw new AdUnavailableError();
  }
}

/**
 * Run action; on quota-limit 403 offer one ad + one retry.
 * Server is the source of truth — no client-side limit pre-checks.
 */
export async function runWithAdRetry({ type, action, confirm, onLimitsUpdate }) {
  try {
    return await action();
  } catch (e) {
    if (!isQuotaLimitError(e?.message)) throw e;
  }

  const ok = await confirm();
  if (!ok) return null;

  const limits = await watchAdAndRefreshLimits(type);
  onLimitsUpdate?.(limits);

  return action();
}
