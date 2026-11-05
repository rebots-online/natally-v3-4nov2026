// Page-speed metrics through PerformanceObserver (§15.2 `page_speed`). FCP and TTFB are final when seen; LCP, CLS and INP
// keep changing, so they are reported once, when the page is first hidden.
interface Reporter { (metric: 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB', value: number): void }
interface LayoutShiftEntry extends PerformanceEntry { value: number; hadRecentInput: boolean }
interface EventTimingEntry extends PerformanceEntry { interactionId?: number }

const INP_DURATION_THRESHOLD_MS = 40;

export function installVitals(report: Reporter): { flush(): void } {
  const supported = new Set<string>(PerformanceObserver.supportedEntryTypes ?? []);
  const watch = (type: string, onEntry: (entry: PerformanceEntry) => void, extra: object = {}): boolean => {
    if (!supported.has(type)) return false;
    try {
      new PerformanceObserver((list) => list.getEntries().forEach(onEntry)).observe({ type, buffered: true, ...extra });
      return true;
    } catch {
      return false;
    }
  };

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (navigation && navigation.responseStart > 0) report('TTFB', Math.round(navigation.responseStart));

  let fcpSeen = false;
  watch('paint', (entry) => {
    if (entry.name !== 'first-contentful-paint' || fcpSeen) return;
    fcpSeen = true;
    report('FCP', Math.round(entry.startTime));
  });

  let lcp: number | null = null;
  watch('largest-contentful-paint', (entry) => {
    lcp = entry.startTime;
  });

  // Layout-shift session windows: a gap over 1 s or a window over 5 s starts a new one; CLS is the worst window.
  let cls: number | null = supported.has('layout-shift') ? 0 : null;
  let windowValue = 0;
  let windowStart = 0;
  let lastShift = 0;
  watch('layout-shift', (raw) => {
    const entry = raw as LayoutShiftEntry;
    if (entry.hadRecentInput) return;
    if (windowValue > 0 && entry.startTime - lastShift < 1000 && entry.startTime - windowStart < 5000) {
      windowValue += entry.value;
    } else {
      windowValue = entry.value;
      windowStart = entry.startTime;
    }
    lastShift = entry.startTime;
    cls = Math.max(cls ?? 0, windowValue);
  });

  // INP: the longest interaction, with one allowed outlier per 50 interactions. Ten longest are enough to find it.
  const longest = new Map<number, number>();
  let interactions = 0;
  const inpWatched = watch(
    'event',
    (raw) => {
      const entry = raw as EventTimingEntry;
      if (!entry.interactionId) return;
      const known = longest.get(entry.interactionId);
      if (known === undefined) interactions += 1;
      if (known === undefined || entry.duration > known) longest.set(entry.interactionId, entry.duration);
      if (longest.size > 10) {
        const shortest = [...longest.entries()].sort((a, b) => a[1] - b[1])[0]!;
        longest.delete(shortest[0]);
      }
    },
    { durationThreshold: INP_DURATION_THRESHOLD_MS },
  );

  let reported = false;
  return {
    flush() {
      if (reported) return;
      reported = true;
      if (lcp !== null) report('LCP', Math.round(lcp));
      if (cls !== null) report('CLS', Math.round(cls * 10000) / 10000);
      if (inpWatched && longest.size > 0) {
        const ranked = [...longest.values()].sort((a, b) => b - a);
        report('INP', Math.round(ranked[Math.min(Math.floor(interactions / 50), ranked.length - 1)]!));
      }
    },
  };
}
