// useChart and saveBirth (§5.8): the customer's saved birth details and chart. Firestore's on-device cache serves both offline.
import { useEffect, useState } from 'react';
import { doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import { saveProfile, useProfile } from '../account';
import { track } from '../analytics';
import { firebaseApp, getSession, useSession } from '../auth';
import type { BirthDetails, Chart, Uid } from '../types';
import { computeChart } from './compute';

// Opened on each use: signing out terminates the Firestore instance and opens a new one.
const chartDoc = (uid: Uid) => doc(getFirestore(firebaseApp), 'users', uid, 'charts', 'primary');

export function useChart(): { status: 'loading' | 'absent' | 'ready'; birth: BirthDetails | null; chart: Chart | null } {
  const session = useSession();
  const { status: profileStatus, profile } = useProfile();
  const [saved, setSaved] = useState<{ uid: Uid; chart: Chart | null } | null>(null);
  const uid = session.uid;

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      chartDoc(uid),
      (snapshot) => setSaved({ uid, chart: snapshot.exists() ? (snapshot.data() as Chart) : null }),
      () => setSaved({ uid, chart: null }),
    );
  }, [uid]);

  if (session.status === 'loading') return { status: 'loading', birth: null, chart: null };
  if (session.status === 'signed_out') return { status: 'absent', birth: null, chart: null };
  if (profileStatus === 'loading' || saved?.uid !== uid) return { status: 'loading', birth: null, chart: null };
  const birth = profile?.birth ?? null;
  if (!birth || !saved.chart) return { status: 'absent', birth: null, chart: null };
  return { status: 'ready', birth, chart: saved.chart };
}

export async function saveBirth(birth: BirthDetails): Promise<Chart> {
  const started = performance.now();
  const chart = await computeChart(birth);
  track('chart_calculated', { house_system: chart.houseSystem, reason: chart.houseSystemReason, ms: Math.round(performance.now() - started) });

  const { uid } = getSession();
  if (!uid) throw new Error('signed_out');
  const writes = Promise.all([saveProfile({ birth }), setDoc(chartDoc(uid), chart)]);
  // Offline the SDK queues both writes and only settles them on reconnecting; the chart is already readable from its cache.
  if (navigator.onLine) await writes;
  return chart;
}
