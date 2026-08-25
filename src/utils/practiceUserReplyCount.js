/** User messages only — excludes bot opening turns (`opening: true`). */
export function practiceUserReplyCount(turns) {
  if (!Array.isArray(turns)) return 0;
  return turns.filter((t) => !t.opening).length;
}
