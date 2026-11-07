/** Линейный глобус (wireframe), не эмодзи. */
export function GlobeIcon({ className = '', size = 18, scale = 1 }) {
  const glyph = (
    <>
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 2.75v18.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M2.75 12h18.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <ellipse cx="12" cy="12" rx="4.25" ry="9.25" stroke="currentColor" strokeWidth="1.75" />
      <ellipse cx="12" cy="7.25" rx="7.75" ry="2.35" stroke="currentColor" strokeWidth="1.75" />
      <ellipse cx="12" cy="16.75" rx="7.75" ry="2.35" stroke="currentColor" strokeWidth="1.75" />
    </>
  );

  const transform = scale === 1 ? undefined : `translate(12 12) scale(${scale}) translate(-12 -12)`;

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
      {transform ? <g transform={transform}>{glyph}</g> : glyph}
    </svg>
  );
}
