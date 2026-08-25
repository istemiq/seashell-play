const INTERACTIVE_SELECTOR =
  '.ss-practice-word, button, a, [role="button"], input, textarea, select, label, .ss-flat-link, .seashell-dict-more-actions';

/** Skip swipe/pinch handlers when the user taps a word or control inside generated text. */
export function isInteractiveGestureTarget(target) {
  return Boolean(target?.closest?.(INTERACTIVE_SELECTOR));
}
