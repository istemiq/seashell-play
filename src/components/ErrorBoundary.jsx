import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[Seashell] render error', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="boot-loader seashell-crt"
          style={{
            padding: 24,
            boxSizing: 'border-box',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
            lineHeight: 1.5,
            color: 'var(--crt-fg, #e8edf4)',
            background: 'var(--ss-page-bg, #0a0e14)',
            minHeight: '100dvh',
          }}
        >
          <p style={{ margin: '0 0 12px', opacity: 0.9 }}>Не удалось загрузить приложение.</p>
          <p className="ss-footnote" style={{ margin: '0 0 16px', opacity: 0.7 }}>
            Could not load the app. Check your connection and try again.
          </p>
          <button
            type="button"
            style={{
              padding: '10px 18px',
              border: '1px solid rgba(127,127,127,.4)',
              borderRadius: 8,
              background: 'transparent',
              color: 'inherit',
              font: 'inherit',
            }}
            onClick={() => window.location.reload()}
          >
            Reload / Перезагрузить
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
