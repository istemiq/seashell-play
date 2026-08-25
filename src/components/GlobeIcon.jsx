/** Линейный глобус (wireframe), не эмодзи. */
export function GlobeIcon({ className = '', size = 18 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 2.75v18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2.75 12h18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="12" cy="12" rx="4.25" ry="9.25" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="12" cy="7.25" rx="7.75" ry="2.35" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="12" cy="16.75" rx="7.75" ry="2.35" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
