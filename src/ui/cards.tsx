import type { ReactNode } from 'react';
import { Button } from './Button';
import { cx } from './cx';
import { IconChevronRight, IconLock } from './icons';

export function Card({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <div id={id} className={cx('rounded-[var(--radius-card)] border border-hairline bg-panel p-5', className)}>
      {children}
    </div>
  );
}

export interface OfferCardProps {
  id: string;
  title: string;
  /** Empty until the catalogue has loaded; never typed into a screen. */
  price: string;
  bullets: string[];
  action: {
    id: string;
    label: string;
    onClick(): void;
    variant?: 'primary' | 'secondary';
    busy?: boolean;
    disabled?: boolean;
  };
  terms?: string;
}

export function OfferCard({ id, title, price, bullets, action, terms }: OfferCardProps) {
  return (
    <Card id={id}>
      <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-hairline pb-4">
        <h3 className="m-0 font-fraunces text-[length:var(--text-headline-sm-size)] leading-[var(--text-headline-sm-line-height)] font-normal text-cream">{title}</h3>
        <span className="shrink-0 font-body text-[18px] leading-6 font-bold text-cream">{price}</span>
      </div>
      <ul className="m-0 mb-5 flex list-none flex-col gap-3 p-0">
        {bullets.map((text) => (
          <li key={text} className="flex items-start gap-3 text-[14px] leading-[20px] text-cream/90">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet" aria-hidden="true" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
      <Button id={action.id} variant={action.variant ?? 'primary'} busy={action.busy} disabled={action.disabled} onClick={action.onClick}>
        {action.label}
      </Button>
      {terms ? <p className="m-0 mt-3 text-[length:var(--text-body-sm-size)] leading-[var(--text-body-sm-line-height)] text-muted">{terms}</p> : null}
    </Card>
  );
}

export function CalloutCard({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <div id={id} className="flex flex-col gap-1 rounded-[var(--radius-control)] border border-hairline bg-elevated p-3">
      <span className="font-cinzel text-[11px] leading-4 font-semibold tracking-wider text-muted uppercase">{title}</span>
      <div className="text-[13px] leading-[18px] text-cream">{children}</div>
    </div>
  );
}

/** Rows in one bordered card, a hairline between each. */
export function ListGroup({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <div id={id} className="divide-y divide-hairline overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-panel">
      {children}
    </div>
  );
}

export interface ListRowProps {
  id?: string;
  label: ReactNode;
  /** Makes the label a `<label>` for a control in `trailing`, such as a Toggle. */
  htmlFor?: string;
  /** A row with a press handler is a button; without one it is a plain row. */
  onClick?: () => void;
  trailing?: ReactNode;
  chevron?: boolean;
  tone?: 'default' | 'danger';
  selected?: boolean;
}

export function ListRow({ id, label, htmlFor, onClick, trailing, chevron = false, tone = 'default', selected = false }: ListRowProps) {
  const text = cx('text-[15px] leading-5', tone === 'danger' ? 'text-error' : 'text-cream');
  const content = (
    <>
      {htmlFor ? <label htmlFor={htmlFor} className={cx(text, 'flex-1 py-3')}>{label}</label> : <span className={cx(text, 'flex-1 text-left')}>{label}</span>}
      {trailing}
      {chevron ? <IconChevronRight size={16} className="shrink-0 text-muted" /> : null}
    </>
  );
  const box = cx('flex min-h-[52px] w-full items-center justify-between gap-3 px-4', selected && 'bg-elevated');
  if (onClick) {
    return (
      <button id={id} type="button" onClick={onClick} className={cx(box, 'border-0 bg-transparent text-left transition-colors duration-[var(--duration-fast)] hover:bg-elevated/50')}>
        {content}
      </button>
    );
  }
  return <div id={id} className={box}>{content}</div>;
}

export interface PackRowProps { id: string; label: string; selected: boolean; onSelect(): void }

export function PackRow({ id, label, selected, onSelect }: PackRowProps) {
  return (
    <div
      id={id}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cx(
        'flex h-16 cursor-pointer items-center rounded-[14px] border px-4 transition-colors duration-[var(--duration-fast)]',
        selected ? 'border-gold bg-elevated' : 'border-hairline bg-transparent hover:border-muted',
      )}
    >
      <span className={cx('mr-4 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border', selected ? 'border-gold' : 'border-hairline')}>
        {selected ? <span className="h-2.5 w-2.5 rounded-full bg-gold" /> : null}
      </span>
      <span className={cx('font-fraunces text-[20px] leading-none text-cream', selected ? 'font-semibold' : 'font-normal')}>{label}</span>
    </div>
  );
}

export interface ModalityCardProps {
  id: string;
  icon: ReactNode;
  title: string;
  /** A locked card shows a lock and `lockedLabel` and has no action. */
  locked?: boolean;
  lockedLabel?: string;
  action?: { id: string; label: string; onClick(): void };
}

export function ModalityCard({ id, icon, title, locked = false, lockedLabel, action }: ModalityCardProps) {
  return (
    <div
      id={id}
      aria-disabled={locked || undefined}
      className={cx(
        'flex min-h-[88px] items-center justify-between rounded-[var(--radius-card)] border bg-panel p-4 transition-colors duration-[var(--duration-fast)]',
        locked ? 'cursor-not-allowed border-hairline opacity-70' : 'border-gold',
      )}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-elevated text-cream">{icon}</span>
      <span className="flex-1 px-4 font-fraunces text-[20px] leading-snug text-cream">{title}</span>
      {locked ? (
        <span className="flex shrink-0 flex-col items-center justify-center gap-1 px-1">
          <IconLock size={16} className="text-muted" />
          {lockedLabel ? <span className="font-mono text-xs leading-none text-muted">{lockedLabel}</span> : null}
        </span>
      ) : action ? (
        <button
          id={action.id}
          type="button"
          onClick={action.onClick}
          className="min-h-[var(--touch-min)] shrink-0 rounded-lg bg-gold px-4 text-sm font-semibold text-on-gold transition-colors duration-[var(--duration-fast)] hover:bg-gold-light active:scale-95"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

export interface ProgressRowProps {
  id: string;
  label: string;
  state: 'waiting' | 'active' | 'done' | 'failed';
  detail: string;
  /** 0 to 1 when the work reports a measure; `null` shows no bar, so nothing is simulated. */
  fraction: number | null;
}

const DOT = { waiting: 'bg-muted', active: 'bg-gold', done: 'bg-mint', failed: 'bg-error' } as const;

export function ProgressRow({ id, label, state, detail, fraction }: ProgressRowProps) {
  const pct = fraction === null ? null : Math.round(Math.min(1, Math.max(0, fraction)) * 100);
  return (
    <div id={id} data-state={state} className="flex flex-col p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={cx('inline-block h-[10px] w-[10px] shrink-0 rounded-full', DOT[state])} aria-hidden="true" />
          <span className={cx('text-[15px] leading-normal font-bold', state === 'failed' ? 'text-error' : 'text-cream')}>{label}</span>
        </div>
        <span className="text-right font-mono text-[12px] leading-4 text-muted">{detail}</span>
      </div>
      {pct === null ? null : (
        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="mt-3 h-1 w-full overflow-hidden rounded-full bg-elevated"
        >
          <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
