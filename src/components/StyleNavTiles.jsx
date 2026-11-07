import { NavIcon } from './NavIcon.jsx';
import { useUiStyle } from '../hooks/useUiStyle.js';
import { UI_STYLE_ACADEMIC } from '../utils/uiStyle.js';

/**
 * @param {{ items: { key: string, label: string, icon?: import('react').ReactNode, iconName?: string, subtitle?: string, onClick: () => void, featured?: boolean }[], className?: string, columns?: 1|2 }} props
 */
export function StyleNavTiles({ items, className = '', columns = 2 }) {
  const uiStyle = useUiStyle();
  if (uiStyle === UI_STYLE_ACADEMIC) return null;

  return (
    <nav
      className={`ss-style-tiles ss-style-tiles--${uiStyle} ss-style-tiles--cols-${columns} ${className}`.trim()}
      aria-label="Menu"
    >
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={[
            'ss-style-tile',
            item.featured ? 'ss-style-tile--featured' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={item.onClick}
        >
          <span className="ss-style-tile__icon-slot" aria-hidden="true">
            <span className="ss-style-tile__icon">
              {item.icon ?? (item.iconName ? <NavIcon name={item.iconName} size={26} /> : null)}
            </span>
          </span>
          <span className="ss-style-tile__body">
            <span className="ss-style-tile__label">{item.label}</span>
            {item.subtitle ? <span className="ss-style-tile__sub">{item.subtitle}</span> : null}
          </span>
          <span className="ss-style-tile__chev" aria-hidden="true">
            ›
          </span>
        </button>
      ))}
    </nav>
  );
}
