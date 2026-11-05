import { IconCheck, IconChevronDown } from './icons';
import { cx } from './cx';

const LABEL = 'font-mono text-[length:var(--text-label-mono-size)] leading-[var(--text-label-mono-line-height)] text-muted';
const BOX =
  'w-full h-[var(--control-height)] rounded-[var(--radius-control)] bg-[var(--nat-field,var(--color-panel))] border border-hairline text-cream ' +
  'text-[15px] outline-none transition-colors duration-[var(--duration-fast)] focus:border-gold disabled:opacity-40';

export interface InputProps {
  id: string;
  label?: string;
  type?: string;
  value: string;
  onChange(v: string): void;
  placeholder?: string;
  error?: string | null;
  autoComplete?: string;
}

export function Input({ id, label, type = 'text', value, onChange, placeholder, error, autoComplete }: InputProps) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-2">
      {label ? <label htmlFor={id} className={LABEL}>{label}</label> : null}
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={cx(BOX, 'px-4 placeholder:text-muted/60', error && 'border-error focus:border-error')}
      />
      {error ? <p id={errorId} role="alert" className="m-0 text-[13px] leading-[18px] text-error">{error}</p> : null}
    </div>
  );
}

export interface SelectProps {
  id: string;
  value: string;
  options: { value: string; label: string }[];
  onChange(v: string): void;
  disabled?: boolean;
  /** Optional visible label above the field. A select without one needs a `<label htmlFor>` from the screen. */
  label?: string;
}

export function Select({ id, value, options, onChange, disabled = false, label }: SelectProps) {
  return (
    <div className="flex flex-col gap-2">
      {label ? <label htmlFor={id} className={LABEL}>{label}</label> : null}
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={cx(BOX, 'appearance-none pl-3 pr-9 cursor-pointer truncate')}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-panel text-cream">{o.label}</option>
          ))}
        </select>
        <IconChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );
}

export interface CheckboxProps { id: string; checked: boolean; onChange(v: boolean): void; label: string }

export function Checkbox({ id, checked, onChange, label }: CheckboxProps) {
  return (
    <label htmlFor={id} className="inline-flex min-h-[var(--touch-min)] cursor-pointer items-center gap-[10px] select-none">
      <span className="relative inline-flex h-[22px] w-[22px] shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer m-0 h-[22px] w-[22px] cursor-pointer appearance-none rounded-[6px] border border-hairline bg-canvas outline-none transition-colors duration-[var(--duration-fast)] checked:border-gold checked:bg-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        />
        <IconCheck size={14} className="pointer-events-none absolute inset-0 m-auto text-on-gold opacity-0 peer-checked:opacity-100" />
      </span>
      <span className="text-[14px] leading-5 text-muted">{label}</span>
    </label>
  );
}

export interface ToggleProps {
  id: string;
  checked: boolean;
  onChange(v: boolean): void;
  /** Accessible name when no `<label htmlFor>` points at the toggle. */
  label?: string;
}

export function Toggle({ id, checked, onChange, label }: ToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-[var(--touch-min)] w-[var(--touch-min)] shrink-0 items-center"
    >
      <span
        className={cx(
          'flex h-6 w-11 items-center rounded-full p-[2px] transition-colors duration-[var(--duration-fast)]',
          checked ? 'bg-gold justify-end' : 'bg-elevated justify-start',
        )}
      >
        <span className={cx('block h-5 w-5 rounded-full', checked ? 'bg-canvas' : 'bg-muted')} />
      </span>
    </button>
  );
}

export interface SliderProps { id: string; value: number; min: number; max: number; onChange(v: number): void; label: string }

export function Slider({ id, value, min, max, onChange, label }: SliderProps) {
  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      value={value}
      aria-label={label}
      onChange={(e) => onChange(Number(e.target.value))}
      className="nat-range h-[var(--touch-min)] w-full"
    />
  );
}
