/**
 * Минимальные компоненты Panel / Group / Cell — стили в seashell-ui.css + crt-theme.css.
 */
import { useEffect, useState, forwardRef } from 'react';

import { useI18n } from '../i18n/I18nContext.jsx';
import { isRtlLocale } from '../i18n/config.js';
import { SeashellShimmerLoader } from './SeashellShimmerLoader.jsx';
import { useReliableTap } from '../utils/reliableTap.js';
import { handleMobileInputFocus } from '../utils/mobileKeyboard.js';

export function Panel({ children, className = '' }) {
  return (
    <section className={`ss-panel ${className}`.trim()}>
      <div className="ss-panel__in">{children}</div>
    </section>
  );
}

export function PanelHeader({ children, before, after }) {
  const withAfter = Boolean(after);
  return (
    <header className={`ss-panel-header${withAfter ? ' ss-panel-header--with-after' : ''}`}>
      <div className="ss-panel-header__side">{before}</div>
      <div className="ss-panel-header__content">{children}</div>
      <div className={`ss-panel-header__side ss-panel-header__side--after${withAfter ? '' : ' ss-panel-header__side--empty'}`}>
        {after ?? null}
      </div>
    </header>
  );
}

export function PanelHeaderBack({ onClick, label }) {
  const { t, locale } = useI18n();
  const ariaLabel = label ?? t('nav.back');
  const rtl = isRtlLocale(locale);
  return (
    <button type="button" className="ss-panel-header-back" onClick={onClick} aria-label={ariaLabel}>
      {rtl ? '›' : '‹'}
    </button>
  );
}

export function Group({ children, header, className = '', style }) {
  return (
    <div className={`ss-group ${className}`.trim()} style={style}>
      {header ? <div className="ss-group__header">{header}</div> : null}
      <div className="ss-group__content">{children}</div>
    </div>
  );
}

export function GroupHeader({ children, mode = 'default', size }) {
  const cls = [
    'ss-group-title',
    mode === 'secondary' ? 'ss-group-title--secondary' : '',
    size === 's' ? 'ss-group-title--s' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return <div className={cls}>{children}</div>;
}

export function Box({ children, className = '', style }) {
  return (
    <div className={`ss-box ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export function Cell({
  children,
  i18nKey,
  i18nParams,
  before,
  subtitle,
  after,
  onClick,
  chevron,
  disabled = false,
  selected = false,
  className = '',
  style,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onTouchStart,
  onTouchEnd,
}) {
  const { locale, tb } = useI18n();
  const rtl = isRtlLocale(locale);
  const title = i18nKey != null ? tb(i18nKey, i18nParams) : children;
  const interactive = !disabled && (Boolean(onClick) || Boolean(onPointerDown) || Boolean(onTouchStart));
  const Tag = interactive ? 'button' : 'div';
  const invoke = useReliableTap(onClick, { disabled: !onClick || disabled });
  return (
    <Tag
      type={interactive ? 'button' : undefined}
      className={[
        'ss-cell',
        interactive ? 'ss-cell--action' : '',
        disabled ? 'ss-cell--disabled' : '',
        selected ? 'ss-cell--selected' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      aria-selected={selected || undefined}
      onMouseDown={
        onClick && !disabled
          ? (e) => {
              if (e.button !== 0) return;
              if (e.target.closest('.ss-cell__after')) return;
              e.preventDefault();
              invoke(e);
            }
          : undefined
      }
      onClick={onClick && !disabled ? invoke : undefined}
      onPointerDown={disabled ? undefined : onPointerDown}
      onPointerUp={disabled ? undefined : onPointerUp}
      onPointerLeave={disabled ? undefined : onPointerLeave}
      onPointerCancel={disabled ? undefined : onPointerCancel}
      onTouchStart={disabled ? undefined : onTouchStart}
      onTouchEnd={disabled ? undefined : onTouchEnd}
      aria-disabled={disabled || undefined}
    >
      {before ? <span className="ss-cell__before">{before}</span> : null}
      <span className="ss-cell__main">
        <span className="ss-cell__title">{title}</span>
        {subtitle ? <span className="ss-cell__subtitle">{subtitle}</span> : null}
      </span>
      {after ? <span className="ss-cell__after">{after}</span> : null}
      {chevron ? (
        <span className="ss-cell__chevron" aria-hidden="true">
          {rtl ? '‹' : '›'}
        </span>
      ) : null}
    </Tag>
  );
}

export function Avatar({ src, size = 48, alt = '', fallbackLabel = '' }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const initials = String(fallbackLabel ?? '')
    .trim()
    .slice(0, 1)
    .toUpperCase();

  if (!src || failed) {
    if (!initials) return null;
    return (
      <span
        className="ss-avatar ss-avatar--fallback"
        aria-hidden={alt ? undefined : true}
        aria-label={alt || undefined}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      >
        {initials}
      </span>
    );
  }

  return (
    <img
      className="ss-avatar"
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function Text({ children, style, className = '', weight, id }) {
  const cls = [`ss-text`, weight === '2' || weight === 2 ? 'ss-text--bold' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <p className={cls} style={style} id={id}>
      {children}
    </p>
  );
}

export function Footnote({ children, style, className = '' }) {
  return (
    <p className={`ss-footnote ${className}`.trim()} style={style}>
      {children}
    </p>
  );
}

export function Separator({ style, className = '' }) {
  return <hr className={`ss-separator ${className}`.trim()} style={style} aria-hidden="true" />;
}

export function Spinner({ size = 'm' }) {
  const { t } = useI18n();
  return (
    <div
      className={`seashell-page-loader${size === 'l' ? ' seashell-page-loader--l' : ''}`}
      role="status"
      aria-label={t('common.loading')}
    >
      <SeashellShimmerLoader />
    </div>
  );
}

export function Button({
  children,
  i18nKey,
  i18nParams,
  onClick,
  mode = 'primary',
  size = 'm',
  stretched = false,
  flat = false,
  disabled = false,
  loading = false,
  appearance,
  type = 'button',
  className = '',
  style,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onTouchStart,
  onTouchEnd,
}) {
  const { t, tb } = useI18n();
  const label = i18nKey != null ? tb(i18nKey, i18nParams) : children;
  const isNegative = appearance === 'negative';
  const blocked = disabled || loading;
  const isSubmit = type === 'submit';
  const useFlat = flat || stretched;
  const invoke = useReliableTap(onClick, { disabled: blocked });
  return (
    <button
      type={type}
      className={[
        'ss-btn',
        `ss-btn--${mode}`,
        isNegative ? 'ss-btn--negative' : '',
        size === 'l' ? 'ss-btn--l' : size === 's' ? 'ss-btn--s' : '',
        stretched ? 'ss-btn--stretched' : '',
        useFlat ? 'ss-btn--flat' : '',
        loading ? 'ss-btn--loading' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onMouseDown={
        blocked || isSubmit || !onClick
          ? undefined
          : (e) => {
              if (e.button !== 0) return;
              e.preventDefault();
              invoke(e);
            }
      }
      onClick={blocked || isSubmit || !onClick ? onClick : invoke}
      onPointerDown={blocked ? undefined : onPointerDown}
      onPointerUp={blocked ? undefined : onPointerUp}
      onPointerLeave={blocked ? undefined : onPointerLeave}
      onPointerCancel={blocked ? undefined : onPointerCancel}
      onTouchStart={blocked ? undefined : onTouchStart}
      onTouchEnd={blocked ? undefined : onTouchEnd}
      disabled={blocked}
      style={style}
      aria-busy={loading || undefined}
      aria-label={loading ? t('common.loading') : undefined}
    >
      {loading ? (
        <span className="ss-btn__shimmer" aria-hidden="true">
          <SeashellShimmerLoader />
        </span>
      ) : (
        <span className="ss-btn__label">{label}</span>
      )}
    </button>
  );
}

function isTerminalFieldFilled(value) {
  return String(value ?? '').length > 0;
}

function TerminalField({ className = '', multiline = false, disabled = false, filled = false, children }) {
  return (
    <div
      className={[
        'ss-terminal-input',
        multiline ? 'ss-terminal-input--multiline' : '',
        disabled ? 'ss-terminal-input--disabled' : '',
        filled ? 'ss-terminal-input--filled' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="ss-terminal-input__cursor" aria-hidden="true" />
      {children}
    </div>
  );
}

export function Input({
  id,
  value,
  onChange,
  disabled = false,
  type = 'text',
  enterKeyHint,
  autoComplete,
  placeholder,
  ltr = false,
  className = '',
}) {
  const forceLtr = ltr || type === 'number' || type === 'tel' || type === 'email';
  const filled = isTerminalFieldFilled(value);

  return (
    <TerminalField disabled={disabled} filled={filled} className={className}>
      <input
        id={id}
        type={type}
        className={`ss-input${forceLtr ? ' ss-input--ltr' : ''}`.trim()}
        dir={forceLtr ? 'ltr' : 'auto'}
        value={value}
        onChange={onChange}
        onFocus={handleMobileInputFocus}
        disabled={disabled}
        enterKeyHint={enterKeyHint}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
    </TerminalField>
  );
}

export const Textarea = forwardRef(function Textarea(
  {
    rows = 3,
    value,
    onChange,
    disabled = false,
    className = '',
    autoFocus = false,
    onKeyDown,
    placeholder,
    enterKeyHint,
  },
  ref,
) {
  const isLtr = className.includes('--ltr');
  const filled = isTerminalFieldFilled(value);

  return (
    <TerminalField multiline disabled={disabled} filled={filled}>
      <textarea
        ref={ref}
        className={`ss-textarea ${className}`.trim()}
        dir={isLtr ? 'ltr' : 'auto'}
        rows={rows}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={handleMobileInputFocus}
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder={placeholder}
        enterKeyHint={enterKeyHint}
      />
    </TerminalField>
  );
});

export function FormItem({ top, children, className = '' }) {
  return (
    <div className={`ss-form-item${className ? ` ${className}` : ''}`.trim()}>
      {top ? <span className="ss-form-item__top">{top}</span> : null}
      <div className="ss-form-item__control">{children}</div>
    </div>
  );
}

export function Switch({ checked, onChange, disabled = false }) {
  return (
    <input
      type="checkbox"
      className="ss-switch"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
    />
  );
}

export function Select({ value, options, onChange, disabled = false }) {
  return (
    <select className="ss-select" value={value} disabled={disabled} onChange={onChange}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function Slider({ min, max, step, value, onChange, disabled = false }) {
  return (
    <input
      type="range"
      className="ss-slider"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

export function Checkbox({ checked, onChange, children, disabled = false }) {
  return (
    <label className="ss-checkbox">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span className="ss-checkbox__label">{children}</span>
    </label>
  );
}

export function ModalDismissButton({ onClick, label }) {
  const { t } = useI18n();
  const ariaLabel = label ?? t('common.close');
  return (
    <button type="button" className="ss-modal-dismiss" onClick={onClick} aria-label={ariaLabel}>
      ✕
    </button>
  );
}

export function Snackbar({ children, onClose, duration = 3000 }) {
  const { t } = useI18n();
  useEffect(() => {
    if (!onClose) return undefined;
    const t = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(t);
  }, [onClose, duration]);

  return (
    <div className="ss-snackbar" role="status">
      <span>{children}</span>
      {onClose ? (
        <button type="button" className="ss-snackbar__close" onClick={onClose} aria-label={t('common.close')}>
          ✕
        </button>
      ) : null}
    </div>
  );
}

export function Placeholder({ children }) {
  return <div className="ss-placeholder">{children}</div>;
}
