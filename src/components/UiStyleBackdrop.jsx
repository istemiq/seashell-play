import { useUiStyle } from '../hooks/useUiStyle.js';
import { UI_STYLE_ACADEMIC } from '../utils/uiStyle.js';

/** Decorative full-screen background per UI style (non-academic only). */
export function UiStyleBackdrop() {
  const uiStyle = useUiStyle();
  if (uiStyle === UI_STYLE_ACADEMIC) return null;

  return (
    <div className={`ss-ui-backdrop ss-ui-backdrop--${uiStyle}`} aria-hidden="true">
      <div className="ss-ui-backdrop__layer ss-ui-backdrop__layer--base" />
      <div className="ss-ui-backdrop__layer ss-ui-backdrop__layer--glow" />
      <div className="ss-ui-backdrop__layer ss-ui-backdrop__layer--scene" />
      <div className="ss-ui-backdrop__layer ss-ui-backdrop__layer--pattern" />
      <div className="ss-ui-backdrop__layer ss-ui-backdrop__layer--vignette" />
    </div>
  );
}
