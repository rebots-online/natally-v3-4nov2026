// The example chart panel can be dragged by its handle, like the atelier's (§5.2 `ChartInset`), but keeps the landing's own frozen look.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';

interface Offset { x: number; y: number }
const STEP = 10;

function read(key: string): Offset {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(key) ?? 'null') as Partial<Offset> | null;
    return { x: Number.isFinite(parsed?.x) ? Number(parsed?.x) : 0, y: Number.isFinite(parsed?.y) ? Number(parsed?.y) : 0 };
  } catch {
    return { x: 0, y: 0 };
  }
}

export function useInsetDrag(id: string, label: string, hint: string) {
  const key = `natally.inset.${id}`;
  const box = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState<Offset>(() => read(key));
  const now = useRef(offset);
  const drag = useRef<{ pointer: number; x: number; y: number; base: Offset } | null>(null);

  const clamp = useCallback((o: Offset): Offset => {
    const el = box.current;
    const parent = el?.offsetParent;
    if (!el || !(parent instanceof HTMLElement)) return o;
    const minX = -el.offsetLeft;
    const minY = -el.offsetTop;
    const maxX = Math.max(minX, parent.clientWidth - el.offsetWidth - el.offsetLeft);
    const maxY = Math.max(minY, parent.clientHeight - el.offsetHeight - el.offsetTop);
    return { x: Math.min(maxX, Math.max(minX, o.x)), y: Math.min(maxY, Math.max(minY, o.y)) };
  }, []);
  const apply = useCallback((o: Offset) => { now.current = o; setOffset(o); }, []);
  const persist = useCallback(() => {
    try { sessionStorage.setItem(key, JSON.stringify(now.current)); } catch { /* the panel starts in its first place next time */ }
  }, [key]);

  useLayoutEffect(() => {
    const parent = box.current?.offsetParent;
    const refit = () => apply(clamp(now.current));
    refit();
    if (!(parent instanceof HTMLElement) || typeof ResizeObserver === 'undefined') return;
    const watcher = new ResizeObserver(refit);
    watcher.observe(parent);
    return () => watcher.disconnect();
  }, [apply, clamp]);
  useEffect(() => () => { drag.current = null; }, []);

  const handle = {
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': label,
    'aria-description': hint,
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { pointer: e.pointerId, x: e.clientX, y: e.clientY, base: now.current };
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const d = drag.current;
      if (d && d.pointer === e.pointerId) apply(clamp({ x: d.base.x + e.clientX - d.x, y: d.base.y + e.clientY - d.y }));
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      if (drag.current?.pointer !== e.pointerId) return;
      drag.current = null;
      persist();
    },
    onPointerCancel: (e: PointerEvent<HTMLElement>) => {
      const d = drag.current;
      if (!d || d.pointer !== e.pointerId) return;
      drag.current = null;
      apply(d.base);
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      const move: Record<string, Offset> = { ArrowLeft: { x: -STEP, y: 0 }, ArrowRight: { x: STEP, y: 0 }, ArrowUp: { x: 0, y: -STEP }, ArrowDown: { x: 0, y: STEP } };
      const m = move[e.key];
      if (!m) return;
      e.preventDefault();
      apply(clamp({ x: now.current.x + m.x, y: now.current.y + m.y }));
      persist();
    },
  };
  const style: CSSProperties = { transform: `translate(${offset.x}px, ${offset.y}px)` };
  return { box, style, handle };
}
