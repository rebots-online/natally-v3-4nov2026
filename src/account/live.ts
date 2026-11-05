// One shared Firestore listener per kind of live data, started by the first mounted hook and stopped by the last.
import { getFirestore, type Firestore } from 'firebase/firestore';
import { useEffect, useSyncExternalStore } from 'react';
import { firebaseApp, useSession } from '../auth';
import type { Uid } from '../types';

export interface Live<T> {
  uid: Uid | null;
  status: 'loading' | 'ready';
  value: T;
}

type Open<T> = (db: Firestore, uid: Uid, emit: (value: T) => void, fail: (error: unknown) => void) => () => void;

export function createLive<T>(label: string, empty: T, open: Open<T>) {
  const idle: Live<T> = { uid: null, status: 'loading', value: empty };
  let state: Live<T> = idle;
  let stop: (() => void) | null = null;
  let users = 0;
  const listeners = new Set<() => void>();

  const set = (next: Live<T>) => {
    state = next;
    listeners.forEach((l) => l());
  };
  const halt = () => {
    stop?.();
    stop = null;
  };

  function acquire(uid: Uid | null) {
    users++;
    if (state.uid !== uid) {
      halt();
      set(uid ? { uid, status: 'loading', value: empty } : idle);
    }
    if (uid && !stop) {
      stop = open(
        getFirestore(firebaseApp),
        uid,
        (value) => set({ uid, status: 'ready', value }),
        // The data stays "loading" rather than being shown as empty; the code carries no personal data.
        (error) => console.error(`${label} listener failed`, (error as { code?: string }).code ?? 'unknown'),
      );
    }
  }
  function release() {
    if (--users === 0) halt();
  }
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => void listeners.delete(l);
  };

  return {
    /** The latest delivered value, whatever is mounted. */
    peek: () => state,
    use(): Live<T> {
      const session = useSession();
      const uid = session.status === 'signed_in' ? session.uid : null;
      useEffect(() => {
        acquire(uid);
        return release;
      }, [uid]);
      const snapshot = useSyncExternalStore(subscribe, () => state);
      return snapshot.uid === uid ? snapshot : { uid, status: 'loading', value: empty };
    },
  };
}
