/** Optional page-level back handler (editor overlays, history tabs, etc.). */
let customBackHandler = null;

export function setCustomBackHandler(handler) {
  customBackHandler = typeof handler === 'function' ? handler : null;
}

export function runCustomBackHandler() {
  if (!customBackHandler) return false;
  customBackHandler();
  return true;
}
