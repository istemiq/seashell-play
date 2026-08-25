import { isAdsgramConfigured, showAdsgramRewarded } from './adsgram.js';
import {
  isAdsonarConfigured,
  showRewardedAd as showAdsonarRewarded,
  refreshAdsonarSticky,
  clearAdsonarSticky,
} from './adsonar.js';

export { isAdsonarConfigured, refreshAdsonarSticky, clearAdsonarSticky };

let rewardedInFlight = false;

/**
 * One rewarded video per unlock. Adsgram only (AdSonar fallback if configured and Adsgram no-fill).
 */
export async function showRewardedAd() {
  if (rewardedInFlight) {
    console.warn('[ads] rewarded skipped: already in flight');
    return false;
  }

  rewardedInFlight = true;
  try {
    await clearAdsonarSticky();

    if (isAdsgramConfigured()) {
      const viewed = await showAdsgramRewarded().catch(() => false);
      if (viewed) return true;
      if (isAdsonarConfigured()) {
        return showAdsonarRewarded().catch(() => false);
      }
      return false;
    }
    if (isAdsonarConfigured()) {
      return showAdsonarRewarded().catch(() => false);
    }
    throw new Error('Нет доступных рекламных сетей');
  } finally {
    rewardedInFlight = false;
  }
}
