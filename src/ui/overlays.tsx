import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from './cx';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Modal behaviour shared by sheet and dialog: Escape closes, Tab stays inside, focus returns to what opened it, the page behind does not scroll. */
function useModal(open: boolean, onClose: () => void) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const node = panel.current;
    const firstField = node?.querySelector<HTMLElement>(FOCUSABLE);
    (firstField ?? node)?.focus();
    const scroll = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !node) return;
      const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = scroll;
      opener?.focus();
    };
  }, [open]);

  return panel;
}

export interface BottomSheetProps {
  id: string;
  open: boolean;
  onClose(): void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function BottomSheet({ id, open, onClose, title, subtitle, children }: BottomSheetProps) {
  const panel = useModal(open, onClose);
  const titleId = useId();
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[var(--layer-sheet)] flex items-end justify-center">
      <div className="nat-fade-in absolute inset-0 bg-scrim" onClick={onClose} aria-hidden="true" />
      <section
        id={id}
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="nat-sheet-in relative flex max-h-[92dvh] w-full max-w-[460px] flex-col overflow-y-auto rounded-t-[var(--radius-scene)] border border-b-0 border-hairline bg-panel [--nat-field:var(--color-canvas)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] outline-none"
      >
        <div className="mx-auto mb-5 h-1 w-9 shrink-0 rounded-full bg-hairline" aria-hidden="true" />
        <h1 id={titleId} className="m-0 mb-1 font-fraunces text-2xl leading-[1.25] font-normal text-cream">{title}</h1>
        {subtitle ? <p className="m-0 mb-5 text-[14px] leading-5 text-muted">{subtitle}</p> : <div className="mb-4" />}
        {children}
      </section>
    </div>,
    document.body,
  );
}

export interface DialogProps {
  id: string;
  open: boolean;
  onClose(): void;
  title: string;
  children?: ReactNode;
  /** Buttons for the foot of the dialog; the screen decides which one is the gold one. */
  actions?: ReactNode;
}

export function Dialog({ id, open, onClose, title, children, actions }: DialogProps) {
  const panel = useModal(open, onClose);
  const titleId = useId();
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[var(--layer-dialog)] flex items-center justify-center p-4">
      <div className="nat-fade-in absolute inset-0 bg-scrim" onClick={onClose} aria-hidden="true" />
      <section
        id={id}
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="nat-sheet-in relative flex max-h-[90dvh] w-full max-w-[380px] flex-col overflow-y-auto rounded-[var(--radius-card)] border border-hairline bg-panel [--nat-field:var(--color-canvas)] p-5 outline-none"
      >
        <h2 id={titleId} className="m-0 font-fraunces text-[length:var(--text-headline-sm-size)] leading-[var(--text-headline-sm-line-height)] font-normal text-cream">{title}</h2>
        {children ? <div className={cx('mt-3 text-[15px] leading-[23px] text-cream/90')}>{children}</div> : null}
        {actions ? <div className="mt-5 flex flex-col gap-3">{actions}</div> : null}
      </section>
    </div>,
    document.body,
  );
}
