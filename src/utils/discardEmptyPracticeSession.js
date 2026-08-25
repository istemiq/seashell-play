import * as practiceApi from '../api/practiceApi.js';
import { practiceUserReplyCount } from './practiceUserReplyCount.js';

/** Drop a session that only has the bot opening line (no user messages). */
export async function discardEmptyPracticeSession(sessionId, turns) {
  if (!sessionId) return;
  if (practiceUserReplyCount(turns) > 0) return;
  try {
    await practiceApi.deletePracticeSession(sessionId);
  } catch {
    // ignore — session may already be gone
  }
}
