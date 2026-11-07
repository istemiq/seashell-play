import { GlobeIcon } from './GlobeIcon.jsx';

const ICONS = {
  dictionary: (
    <>
      <path d="M5.5 4.75h5.25a2.25 2.25 0 0 1 2.25 2.25V19.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M5.5 4.75h8.75a2.25 2.25 0 0 1 2.25 2.25V19.5a2.25 2.25 0 0 0-2.25-2.25H5.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M9.25 8.5h4.5M9.25 12h4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </>
  ),
  irregularVerbs: (
    <>
      <path d="M7.5 5.5h9M7.5 9.5h9M7.5 13.5h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M16.75 13.25 19 15.5l-2.25 2.25" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  practice: (
    <>
      <path
        d="M7.25 8.75a2.25 2.25 0 0 1 2.25-2.25h4.75a2.25 2.25 0 0 1 2.25 2.25v3.75a2.25 2.25 0 0 1-2.25 2.25H11l-2 1.75v-1.75H9.5a2.25 2.25 0 0 1-2.25-2.25V8.75Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M9.75 10.25h3.75M9.75 12.25h2.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </>
  ),
  premium: (
    <path
      d="M12 4.25 13.55 8.45l4.35.35-3.3 2.85 1 4.25L12 13.85 8.4 16.9l1-4.25-3.3-2.85 4.35-.35L12 4.25Z"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 3.5v1.65M12 18.85v1.65M4.15 12H2.5M21.5 12h-1.65M5.8 5.8l-1.17-1.17M19.37 19.37l-1.17-1.17M5.8 18.2l-1.17 1.17M19.37 4.63l-1.17 1.17"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </>
  ),
  learnLanguage: (
    <>
      <circle cx="12" cy="12" r="7.25" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="3.25" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 4.75v14.5M4.75 12h14.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </>
  ),
  reader: (
    <>
      <path
        d="M12 6.5C10.5 5 8.5 4.5 5.5 4.5v14c3 0 5 .5 6.5 2 1.5-1.5 3.5-2 6.5-2v-14c-3 0-5 .5-6.5 2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M12 6.5v14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </>
  ),
  readme: (
    <>
      <path d="M6.5 5.5h8.75a2 2 0 0 1 2 2v11H8.25A1.75 1.75 0 0 0 6.5 20.25V5.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M6.5 18.5h11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M10 9h5M10 12.25h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </>
  ),
  hubFree: (
    <>
      <path
        d="M6.5 8.25a2.75 2.75 0 0 1 2.75-2.75h5.5a2.75 2.75 0 0 1 2.75 2.75v4a2.75 2.75 0 0 1-2.75 2.75H12l-2.25 2v-2H9.25A2.75 2.75 0 0 1 6.5 12.25v-4Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M9.75 10.5h4.5M9.75 12.5h3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </>
  ),
  hubExpert: (
    <>
      <path d="M5.5 9.25 12 5.5l6.5 3.75v6.5L12 19.5l-6.5-3.75v-6.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M12 11.25v8.25M5.5 9.25 12 13l6.5-3.75" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </>
  ),
  hubPattern: (
    <>
      <path d="M8.25 8.25h3.5v3.5h-3.5v-3.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M12.25 12.25h3.5v3.5h-3.5v-3.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M8.25 12.25h3.5v3.5h-3.5v-3.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M12.25 8.25h3.5v3.5h-3.5v-3.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </>
  ),
};

/** Optical scale so glyphs look the same size inside 24×24 viewBox. */
const ICON_OPTICAL_SCALE = {
  hubPattern: 1.4,
  readme: 1.14,
  irregularVerbs: 1.08,
  hubExpert: 1.06,
  dictionary: 1.02,
  practice: 1.1,
  hubFree: 1.06,
  premium: 0.88,
  settings: 0.86,
  learnLanguage: 0.76,
  language: 0.76,
};

/** Линейные иконки навигации (wireframe), в стиле GlobeIcon. */
export function NavIcon({ name, className = '', size = 26 }) {
  if (name === 'language') {
    return (
      <GlobeIcon
        className={`ss-nav-icon ${className}`.trim()}
        size={size}
        scale={ICON_OPTICAL_SCALE.language}
      />
    );
  }

  const paths = ICONS[name];
  if (!paths) return null;

  const scale = ICON_OPTICAL_SCALE[name] ?? 1;
  const transform =
    scale === 1 ? undefined : `translate(12 12) scale(${scale}) translate(-12 -12)`;

  return (
    <svg
      className={`ss-nav-icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {transform ? <g transform={transform}>{paths}</g> : paths}
    </svg>
  );
}
