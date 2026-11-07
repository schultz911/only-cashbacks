import { useEffect, useRef } from 'react';

const focusable = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function useDialogFocus(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    const items = () => Array.from(dialog.querySelectorAll<HTMLElement>(focusable)).filter(item => item.tabIndex >= 0 && !item.hidden && !item.closest('[hidden], [aria-hidden="true"], [inert]'));
    (dialog.querySelector<HTMLElement>('[autofocus]') || items()[0] || dialog).focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close.current();
      } else if (event.key === 'Tab') {
        const elements = items();
        if (!elements.length) { event.preventDefault(); dialog.focus(); return; }
        const index = elements.indexOf(document.activeElement as HTMLElement);
        if ((!dialog.contains(document.activeElement)) || (event.shiftKey && index === 0) || (!event.shiftKey && index === elements.length - 1)) {
          event.preventDefault();
          (event.shiftKey ? elements[elements.length - 1] : elements[0]).focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => { document.removeEventListener('keydown', onKeyDown, true); if (previous?.isConnected) previous.focus(); };
  }, [open]);
  return ref;
}
