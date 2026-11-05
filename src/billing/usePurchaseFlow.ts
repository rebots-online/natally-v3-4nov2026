// The states after "Continue" (§11.5, §11.6): checkout, confirming with retries at 2, 4, 8, 16 s, slow, done.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount } from '../account';
import { config } from '../config';
import type { MilliCredits, ProductRole, ReconcileResult } from '../types';
import { showToast } from '../ui';
import { reconcileNow, runBuy } from './purchase';
import { fill, strings } from './strings';

export type FlowPhase = 'idle' | 'checkout' | 'confirming' | 'slow';

interface Run {
  role: ProductRole;
  productId: string | null;
  baseline: MilliCredits | null;   // the balance before paying
  latest: MilliCredits | null;     // the highest balance seen since, live or from the server
  confirming: boolean;
  ended: boolean;
  eventSeen: boolean;
}

const RETRY_SECONDS = [2, 4, 8, 16];
const wait = (seconds: number) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));
const rose = (run: Run) => run.role === 'credits' && run.baseline !== null && run.latest !== null && run.latest > run.baseline;

function addedCredits(run: Run): number {
  const known = run.productId ? config.products.credits[run.productId] : undefined;
  return known ?? Math.floor(((run.latest ?? 0) - (run.baseline ?? 0)) / 1000);
}

export interface FlowHandlers {
  onDone(role: ProductRole): void;
  onNotBought(outcome: 'cancelled' | 'pending' | 'failed'): void;
}

export function usePurchaseFlow({ onDone, onNotBought }: FlowHandlers) {
  const [phase, setPhase] = useState<FlowPhase>('idle');
  const { status, balanceMilli } = useAccount();
  const run = useRef<Run | null>(null);
  const alive = useRef(true);
  const balance = useRef<MilliCredits | null>(null);
  balance.current = status === 'ready' ? balanceMilli : null;
  const handlers = useRef({ onDone, onNotBought });
  handlers.current = { onDone, onNotBought };

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const finish = useCallback(async (current: Run) => {
    if (current.ended) return;
    current.ended = true;
    if (current.role === 'credits') {
      const added = addedCredits(current);
      if (added > 0) showToast(fill(strings['billing.added'], added.toLocaleString('en-US')), 'success');
      // The webhook can credit before reconcile looks. The room still hears of it, once.
      if (!current.eventSeen) await reconcileNow('checkout_return').catch(() => null);
      if (!current.eventSeen) window.dispatchEvent(new CustomEvent('natally:credits-arrived', { detail: { credited: 1 } }));
    }
    run.current = null;
    if (!alive.current) return;
    setPhase('idle');
    handlers.current.onDone(current.role);
  }, []);

  useEffect(() => {
    const heard = () => {
      if (run.current) run.current.eventSeen = true;
    };
    window.addEventListener('natally:credits-arrived', heard);
    return () => window.removeEventListener('natally:credits-arrived', heard);
  }, []);

  // §11.5: a live balance change ends `confirming` and `slow`, whoever credited it.
  useEffect(() => {
    const current = run.current;
    if (!current || status !== 'ready') return;
    current.baseline ??= balanceMilli;
    current.latest = Math.max(current.latest ?? 0, balanceMilli);
    if (current.confirming && rose(current)) void finish(current);
  }, [status, balanceMilli, finish]);

  const start = useCallback(
    async (productId: string | null, role: ProductRole) => {
      if (run.current) return;
      const current: Run = { role, productId, baseline: balance.current, latest: balance.current, confirming: false, ended: false, eventSeen: false };
      run.current = current;
      setPhase('checkout');
      const { attempt, reconciled } = await runBuy(productId, role);
      current.productId = attempt.productId ?? productId;
      if (attempt.outcome !== 'purchased') {
        run.current = null;
        if (alive.current) {
          setPhase('idle');
          handlers.current.onNotBought(attempt.outcome);
        }
        return;
      }
      current.confirming = true;
      setPhase('confirming');
      const arrived = (result: ReconcileResult | null) => {
        if (result) current.latest = Math.max(current.latest ?? 0, result.balanceMilli);
        return (result !== null && (result.credited >= 1 || (role === 'souvenir' && result.souvenirEntryIds.length > 0))) || rose(current);
      };
      let result = reconciled;
      for (const seconds of RETRY_SECONDS) {
        if (arrived(result) || current.ended) break;
        await wait(seconds);
        if (current.ended || !alive.current) return;
        result = await reconcileNow('checkout_return').catch(() => null);
      }
      if (current.ended) return;
      if (arrived(result)) await finish(current);
      else setPhase('slow');
    },
    [finish],
  );

  return { phase, start };
}
