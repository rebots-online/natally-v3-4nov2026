import type { ReactNode } from 'react';
import { cx } from './cx';
import { IconSpinner } from './icons';

export interface ButtonProps {
  id: string;
  variant: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  /** Work is under way: shows a spinner, keeps the label, and ignores presses. */
  busy?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  children: ReactNode;
}

const BASE =
  'relative inline-flex items-center justify-center gap-2 select-none transition-colors duration-[var(--duration-fast)] ease-out ' +
  'min-h-[var(--touch-min)] font-[family-name:var(--font-body)] disabled:cursor-not-allowed';

const VARIANT = {
  // One solid gold button per app screen: text on gold, 52px, hover to the lighter gold.
  primary:
    'w-full h-[var(--primary-height)] rounded-[var(--radius-control)] bg-gold text-on-gold hover:bg-gold-light ' +
    'text-[length:var(--text-button-size)] leading-5 font-bold disabled:opacity-40',
  // Elevated fill (the frozen screens), hairline border, border turns gold on hover.
  secondary:
    'w-full h-[var(--control-height)] rounded-[var(--radius-control)] bg-elevated text-cream border border-hairline hover:border-gold ' +
    'text-[length:var(--text-button-size)] leading-5 font-bold px-4 disabled:opacity-40',
  // A link-looking button: muted, underlined.
  ghost:
    'px-2 text-[14px] leading-5 font-normal text-muted underline underline-offset-4 decoration-hairline ' +
    'hover:text-cream hover:decoration-muted disabled:opacity-40',
} as const;

export function Button({ id, variant, disabled = false, busy = false, onClick, type = 'button', children }: ButtonProps) {
  return (
    <button
      id={id}
      type={type}
      disabled={disabled}
      aria-busy={busy || undefined}
      aria-disabled={busy || undefined}
      onClick={busy ? undefined : onClick}
      className={cx(BASE, VARIANT[variant], busy && 'cursor-progress')}
    >
      {busy ? <IconSpinner size={18} /> : null}
      {children}
    </button>
  );
}
