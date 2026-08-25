import { useEffect, useState } from 'react';

import { Button } from './Ui.jsx';

/** Secondary dictionary card actions behind an explicit toggle (Telegram WebView-safe). */
export function DictCardMoreActions({ resetKey, children }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [resetKey]);

  return (
    <div className="seashell-dict-more-actions">
      <Button
        type="button"
        size="l"
        flat
        stretched
        mode="secondary"
        className={`seashell-dict-more-actions__toggle${open ? ' is-open' : ''}`}
        onClick={() => setOpen((value) => !value)}
        i18nKey="dict.moreActions"
      />
      {open ? <div className="seashell-dict-more-actions__panel">{children}</div> : null}
    </div>
  );
}
