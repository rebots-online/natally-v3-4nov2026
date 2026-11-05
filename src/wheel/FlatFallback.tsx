// The wheel when WebGL is unavailable: the flat shapes on a 2D canvas, the same highlight and taps, no rotation (§9.3).
import { useEffect, useRef } from 'react';
import type { Chart, ChartElementKey } from '../types';
import { drawFlatWheel, flatPick } from './flat';
import { ensureWheelFonts } from './tokens';

const TAP_SLOP_PX = 6;

export function FlatFallback(props: { chart: Chart; highlight: ChartElementKey | null; inset: boolean; canSelect: boolean; onSelect(key: ChartElementKey): void }) {
  const { chart, highlight, inset, canSelect, onSelect } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const side = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const host = canvas.parentElement!;
    let alive = true;
    const draw = () => {
      if (!alive) return;
      const css = Math.min(host.clientWidth, host.clientHeight);
      if (!css) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      side.current = css;
      canvas.width = Math.round(css * ratio);
      canvas.height = Math.round(css * ratio);
      canvas.style.width = `${css}px`;
      canvas.style.height = `${css}px`;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawFlatWheel(ctx, chart, css, highlight, !inset);
    };
    const observer = new ResizeObserver(draw);
    observer.observe(host);
    draw();
    void ensureWheelFonts().then(draw);
    return () => { alive = false; observer.disconnect(); };
  }, [chart, highlight, inset]);

  const press = useRef<{ x: number; y: number } | null>(null);
  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', display: 'block', cursor: canSelect ? 'pointer' : undefined }}
      onPointerDown={(e) => { press.current = { x: e.clientX, y: e.clientY }; }}
      onPointerUp={(e) => {
        const start = press.current;
        press.current = null;
        if (!start || !canSelect || Math.hypot(e.clientX - start.x, e.clientY - start.y) > TAP_SLOP_PX) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const key = flatPick(chart, side.current, e.clientX - rect.left, e.clientY - rect.top);
        if (key) onSelect(key);
      }}
    />
  );
}
