// The chart wheel component (§5.9, §9.3): a real three.js wheel, or the flat wheel when WebGL is unavailable.
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type JSX } from 'react';
import { useSettings } from '../settings';
import type { Chart, ChartElementKey } from '../types';
import { FlatFallback } from './FlatFallback';
import { labelFor, parseKey } from './geometry';
import { WheelEngine } from './engine';
import { strings } from './strings';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(notify: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
}

export function ChartWheel(props: { chart: Chart; highlight: ChartElementKey | null; mode: 'main' | 'inset'; onSelect?: (key: ChartElementKey) => void; id?: string }): JSX.Element {
  const { chart, highlight, mode, onSelect, id } = props;
  const { pauseMotion } = useSettings();
  const reduced = useSyncExternalStore(subscribeReducedMotion, () => window.matchMedia(REDUCED_MOTION).matches);
  const paused = pauseMotion || reduced;

  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<WheelEngine | null>(null);
  const [flat, setFlat] = useState(false);

  const onSelectRef = useRef(onSelect);
  useLayoutEffect(() => { onSelectRef.current = onSelect; });
  const initial = useRef({ chart, highlight, paused });
  initial.current = { chart, highlight, paused };

  useEffect(() => {
    if (flat) return;
    let engine: WheelEngine;
    try {
      engine = new WheelEngine(hostRef.current!, initial.current.chart, mode, initial.current.paused, {
        onSelect: (key) => onSelectRef.current?.(key),
        canSelect: () => !!onSelectRef.current,
        onContextLost: () => setFlat(true),
      });
    } catch {
      setFlat(true);
      return;
    }
    engine.setHighlight(initial.current.highlight, true);
    engineRef.current = engine;
    return () => {
      engineRef.current = null;
      engine.dispose();
    };
  }, [flat, mode]);

  useEffect(() => { engineRef.current?.setChart(chart); }, [chart]);
  useEffect(() => { engineRef.current?.setHighlight(highlight); }, [highlight]);
  useEffect(() => { engineRef.current?.setMotionPaused(paused); }, [paused]);

  const parsed = parseKey(chart, highlight);
  return (
    <div
      id={id}
      ref={hostRef}
      role="img"
      aria-label={parsed ? strings['wheel.labelLit'](labelFor(parsed)) : strings['wheel.label']}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
    >
      {flat && <FlatFallback chart={chart} highlight={highlight} inset={mode === 'inset'} canSelect={mode === 'main' && !!onSelect} onSelect={(key) => onSelectRef.current?.(key)} />}
    </div>
  );
}
