import { useCallback, useRef } from 'react';
import { track } from '../analytics';

/**
 * A ref callback that calls `fire` once, the first time half of the element is on screen (§15.2). An element taller than
 * the window counts when it fills half of the window.
 */
export function useSeen(fire: () => void): (el: Element | null) => void {
  const latest = useRef(fire);
  latest.current = fire;
  return useCallback((el: Element | null) => {
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const watcher = new IntersectionObserver(
      (entries) => {
        const seen = entries.some((e) => e.isIntersecting && (e.intersectionRatio >= 0.5 || e.intersectionRect.height >= window.innerHeight * 0.5));
        if (!seen) return;
        watcher.disconnect();
        latest.current();
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    watcher.observe(el);
    return () => watcher.disconnect();
  }, []);
}

export const useSectionSeen = (section: string) => useSeen(() => track('landing_section_view', { section }));
export const useOfferSeen = (offer: 'souvenir' | 'credits', surface: string) => useSeen(() => track('offer_view', { offer, surface }));
