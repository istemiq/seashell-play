import { useEffect } from 'react';

function isEditableTarget(target) {
  if (!(target instanceof Element)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
}

/** Escape → то же действие, что и кнопка «Назад» в шапке. */
export function useEscapeBack(onBack, { enabled = true, resolveBeforeBack } = {}) {
  useEffect(() => {
    if (!enabled || typeof onBack !== 'function') return undefined;

    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (isEditableTarget(e.target)) return;
      if (resolveBeforeBack?.(e)) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      onBack();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onBack, enabled, resolveBeforeBack]);
}
