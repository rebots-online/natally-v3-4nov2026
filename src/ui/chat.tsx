import type { ReactNode } from 'react';
import type { MilliCredits, StatusLineState } from '../types';
import { cx } from './cx';
import { strings } from './strings';

export interface ChatBubbleProps {
  id?: string;
  from: 'natally' | 'customer';
  /** While she speaks her border is gold. */
  speaking?: boolean;
  children: ReactNode;
}

export function ChatBubble({ id, from, speaking = false, children }: ChatBubbleProps) {
  if (from === 'customer') {
    return (
      <div
        id={id}
        className="max-w-[85%] self-end rounded-2xl rounded-tr-[2px] border border-hairline border-l-[3px] border-l-coral bg-panel px-3.5 py-2.5 text-[15px] leading-[23px] text-cream"
      >
        {children}
      </div>
    );
  }
  return (
    <div
      id={id}
      className={cx(
        'max-w-[90%] self-start rounded-2xl rounded-tl-[2px] border bg-elevated px-3.5 py-2.5 font-fraunces text-[length:var(--text-oracle-size)] leading-[var(--text-oracle-line-height)] text-cream transition-colors duration-[var(--duration-fast)]',
        speaking ? 'border-gold' : 'border-hairline',
      )}
    >
      {children}
    </div>
  );
}

const DOT: Record<StatusLineState, string> = {
  idle: 'bg-status-idle',
  listening: 'bg-status-listening',
  thinking: 'bg-status-thinking',
  speaking: 'bg-status-speaking',
};

export function StatusLine({ id, state, text }: { id: string; state: StatusLineState; text: string }) {
  return (
    <div
      id={id}
      role="status"
      aria-live="polite"
      data-state={state}
      className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-panel/85 px-2.5 py-1"
    >
      <span className={cx('inline-block h-1.5 w-1.5 shrink-0 rounded-full', DOT[state])} aria-hidden="true" />
      <span className="text-[12px] leading-4 font-medium text-cream">{text}</span>
    </div>
  );
}

export interface CreditPillProps { id: string; balanceMilli: MilliCredits; onClick(): void }

export function CreditPill({ id, balanceMilli, onClick }: CreditPillProps) {
  const whole = Math.max(0, Math.floor(balanceMilli / 1000));
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className="relative inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full border border-hairline bg-elevated px-3 text-[12px] leading-4 font-medium text-cream transition-colors duration-[var(--duration-fast)] before:absolute before:-inset-x-1 before:-inset-y-1.5 before:content-[''] hover:border-gold"
    >
      {whole} {strings['ui.creditPillSuffix']}
    </button>
  );
}

export interface ElementChipProps {
  id?: string;
  /** Glyph from `GLYPHS`, shown before the label. */
  glyph?: string;
  label: string;
  selected?: boolean;
  /** With a handler the chip is a button; without one it is a label. */
  onClick?: () => void;
}

export function ElementChip({ id, glyph, label, selected = false, onClick }: ElementChipProps) {
  const look = cx(
    'relative inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-full border bg-elevated px-3 text-[12px] leading-4',
    selected ? 'border-gold font-bold text-gold' : 'border-hairline font-medium text-cream',
  );
  const inner = (
    <>
      {glyph ? <span aria-hidden="true">{glyph}</span> : null}
      <span>{label}</span>
    </>
  );
  if (!onClick) return <span id={id} className={look}>{inner}</span>;
  return (
    <button
      id={id}
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(look, 'transition-colors duration-[var(--duration-fast)] before:absolute before:-inset-x-0.5 before:-inset-y-1.5 before:content-[""]', !selected && 'hover:border-muted')}
    >
      {inner}
    </button>
  );
}

export interface SegmentedTabsProps {
  id: string;
  value: string;
  options: { value: string; label: string; id?: string }[];
  onChange(v: string): void;
}

export function SegmentedTabs({ id, value, options, onChange }: SegmentedTabsProps) {
  return (
    <div
      id={id}
      role="tablist"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      className="grid gap-1 rounded-[10px] border border-hairline bg-panel p-1"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            id={o.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'min-h-[var(--touch-min)] rounded-[7px] border px-2 text-center font-mono text-[12px] leading-4 transition-colors duration-[var(--duration-fast)]',
              active ? 'border-gold/30 bg-elevated font-bold text-gold' : 'border-transparent text-muted hover:text-cream',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
