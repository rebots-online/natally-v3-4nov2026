import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { IconGrip } from './icons';
import { strings } from './strings';

export interface SceneCardProps {
  id: string;
  /** The room artwork, drawn to fill the card. Leave out when the children draw the whole scene. */
  image?: { src: string; alt: string };
  /** Overlays: chips, inset, status line, each placed by the caller. */
  children?: ReactNode;
  /** A muted line centred under the card. */
  caption?: string;
}

export function SceneCard({ id, image, children, caption }: SceneCardProps) {
  return (
    <div className="flex w-full flex-col">
      <div
        id={id}
        className="relative aspect-(--scene-aspect) w-full overflow-hidden rounded-[var(--radius-scene)] border border-hairline bg-panel"
      >
        {image ? <img src={image.src} alt={image.alt} draggable={false} className="h-full w-full object-cover select-none" /> : null}
        {children}
      </div>
      {caption ? <p className="m-0 mt-1.5 text-center text-[length:var(--text-body-sm-size)] leading-[var(--text-body-sm-line-height)] text-muted">{caption}</p> : null}
    </div>
  );
}

interface Offset { x: number; y: number }
const TAP_SLOP = 6;
const KEY_STEP = 10;

function readOffset(key: string): Offset {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return { x: 0, y: 0 };
    const parsed = JSON.parse(raw) as Partial<Offset>;
    return { x: Number.isFinite(parsed.x) ? Number(parsed.x) : 0, y: Number.isFinite(parsed.y) ? Number(parsed.y) : 0 };
  } catch {
    return { x: 0, y: 0 };
  }
}

export interface ChartInsetProps {
  id: string;
  handleId: string;
  title: string;
  onTap(): void;
  children: ReactNode;
}

/** The small chart panel that sits on the scene. Drag it by its handle; a release that has not moved more than 6 px is a tap. */
export function ChartInset({ id, handleId, title, onTap, children }: ChartInsetProps) {
  const storeKey = `natally.inset.${id}`;
  const box = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState<Offset>(() => readOffset(storeKey));
  const offsetRef = useRef(offset);
  const drag = useRef<{ pointer: number; startX: number; startY: number; base: Offset; moved: boolean } | null>(null);

  /** Keeps the panel inside the scene it sits on. */
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

  const apply = useCallback((o: Offset) => {
    offsetRef.current = o;
    setOffset(o);
  }, []);

  const persist = useCallback(() => {
    try {
      sessionStorage.setItem(storeKey, JSON.stringify(offsetRef.current));
    } catch {
      // Storage can be unavailable; the panel then simply starts in its first place next time.
    }
  }, [storeKey]);

  // A stored position may no longer fit (smaller window, rotated phone): pull it back in, and again whenever the scene resizes.
  useLayoutEffect(() => {
    const parent = box.current?.offsetParent;
    const refit = () => apply(clamp(offsetRef.current));
    refit();
    if (!(parent instanceof HTMLElement) || typeof ResizeObserver === 'undefined') return;
    const watcher = new ResizeObserver(refit);
    watcher.observe(parent);
    return () => watcher.disconnect();
  }, [apply, clamp]);

  useEffect(() => () => { drag.current = null; }, []);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { pointer: e.pointerId, startX: e.clientX, startY: e.clientY, base: offsetRef.current, moved: false };
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) <= TAP_SLOP) return;
    d.moved = true;
    apply(clamp({ x: d.base.x + dx, y: d.base.y + dy }));
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (d.moved) persist();
    else onTap();
  };
  const onCancel = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    drag.current = null;
    apply(d.base);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step: Record<string, Offset> = {
      ArrowLeft: { x: -KEY_STEP, y: 0 }, ArrowRight: { x: KEY_STEP, y: 0 }, ArrowUp: { x: 0, y: -KEY_STEP }, ArrowDown: { x: 0, y: KEY_STEP },
    };
    const move = step[e.key];
    if (move) {
      e.preventDefault();
      apply(clamp({ x: offsetRef.current.x + move.x, y: offsetRef.current.y + move.y }));
      persist();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTap();
    }
  };

  return (
    <div
      id={id}
      ref={box}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      className="absolute top-2.5 left-2.5 z-(--layer-inset) flex w-[34%] max-w-[200px] flex-col rounded-xl border border-gold bg-canvas-deep/95 p-2"
    >
      <div
        id={handleId}
        role="button"
        tabIndex={0}
        aria-label={title}
        aria-description={strings['ui.insetKeyboardHint']}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
        onKeyDown={onKey}
        className="relative mb-1 flex cursor-move touch-none items-center gap-1 text-[10px] leading-4 font-medium text-cream select-none before:absolute before:-inset-x-2 before:-inset-y-3.5 before:content-[''] font-mono"
      >
        <IconGrip size={12} className="text-gold" />
        <span>{title}</span>
      </div>
      <div className="aspect-square w-full">{children}</div>
    </div>
  );
}
