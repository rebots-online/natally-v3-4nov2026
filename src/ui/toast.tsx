import { useSyncExternalStore } from 'react';
import { cx } from './cx';
import { IconClose } from './icons';
import { strings } from './strings';

type Tone = 'neutral' | 'success' | 'error';
interface ToastItem { key: number; text: string; tone: Tone }

const MAX_VISIBLE = 3;
const LIFETIME_MS: Record<Tone, number> = { neutral: 4000, success: 4000, error: 7000 };

let items: ToastItem[] = [];
let nextKey = 1;
const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function publish(next: ToastItem[]) {
  items = next;
  listeners.forEach((l) => l());
}

function dismiss(key: number) {
  const timer = timers.get(key);
  if (timer !== undefined) clearTimeout(timer);
  timers.delete(key);
  publish(items.filter((t) => t.key !== key));
}

/** Shows a short message at the foot of the screen. Needs one `ToastHost` mounted. */
export function showToast(text: string, tone: Tone = 'neutral'): void {
  const key = nextKey++;
  const kept = items.slice(-(MAX_VISIBLE - 1));
  items.filter((t) => !kept.includes(t)).forEach((t) => dismiss(t.key));
  publish([...kept, { key, text, tone }]);
  timers.set(key, setTimeout(() => dismiss(key), LIFETIME_MS[tone]));
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};
const snapshot = () => items;

const EDGE: Record<Tone, string> = { neutral: 'border-l-hairline', success: 'border-l-mint', error: 'border-l-error' };

export function ToastHost() {
  const list = useSyncExternalStore(subscribe, snapshot, snapshot);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-(--layer-toast) flex flex-col items-center gap-2 px-4 pb-[max(3.5rem,env(safe-area-inset-bottom))]"
    >
      {list.map((t) => (
        <div
          key={t.key}
          role={t.tone === 'error' ? 'alert' : 'status'}
          className={cx(
            'nat-toast-in pointer-events-auto flex w-full max-w-[420px] items-start gap-3 rounded-[var(--radius-control)] border border-l-[3px] border-hairline bg-elevated py-2.5 pr-1 pl-4',
            EDGE[t.tone],
          )}
        >
          <p className={cx('m-0 flex-1 py-1.5 text-[14px] leading-5', t.tone === 'error' ? 'text-error' : 'text-cream')}>{t.text}</p>
          <button
            type="button"
            aria-label={strings['ui.dismiss']}
            onClick={() => dismiss(t.key)}
            className="flex h-[var(--touch-min)] w-[var(--touch-min)] shrink-0 items-center justify-center rounded-[var(--radius-control)] text-muted hover:text-cream"
          >
            <IconClose size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
