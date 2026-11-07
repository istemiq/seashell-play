/** Semantic blocks for practice turns — styled per UI theme in ui-style-layouts.css */
export function PracticeBubble({ variant = 'user', className = '', children }) {
  return (
    <div className={`ss-practice-bubble ss-practice-bubble--${variant} ${className}`.trim()}>
      {children}
    </div>
  );
}
