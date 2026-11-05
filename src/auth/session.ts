// The session store (§5.5): one listener on Firebase Auth, read by useSession and getSession.
import { clearIndexedDbPersistence, getFirestore, terminate } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useSyncExternalStore } from 'react';
import type { Uid } from '../types';
import { setAnalyticsUser } from '../analytics';
import { auth, firebaseApp, openFirestore } from './firebase';

export interface Session {
  status: 'loading' | 'signed_out' | 'signed_in';
  uid: Uid | null;
  email: string | null;
  displayName: string | null;
  isNew: boolean;
}

const LOADING: Session = { status: 'loading', uid: null, email: null, displayName: null, isNew: false };
const SIGNED_OUT: Session = { status: 'signed_out', uid: null, email: null, displayName: null, isNew: false };

let session: Session = LOADING;
let newUid: Uid | null = null;
const listeners = new Set<() => void>();

function publish(next: Session) {
  session = next;
  listeners.forEach((listener) => listener());
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    newUid = null;
    publish(SIGNED_OUT);
    setAnalyticsUser(false);
    return;
  }
  publish({ status: 'signed_in', uid: user.uid, email: user.email, displayName: user.displayName, isNew: user.uid === newUid });
  setAnalyticsUser(true);
});

/** Called by the sign-in flows when Firebase reports that the account was created by this very sign-in. */
export function markNewUser(uid: Uid) {
  newUid = uid;
  if (session.uid === uid && !session.isNew) publish({ ...session, isNew: true });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

export const getSession = (): Session => session;
export const useSession = (): Session => useSyncExternalStore(subscribe, getSession);

/** The current ID token. Waits for the first auth state, so a call at start-up never sees a transient signed-out. */
export async function getIdToken(force = false): Promise<string> {
  await auth.authStateReady();
  if (!auth.currentUser) throw new Error('signed_out');
  return auth.currentUser.getIdToken(force);
}

/** Signs out, tells `reading` and `billing` to drop their state, then clears the device copy of the customer's Firestore data. */
export async function signOutNow(): Promise<void> {
  await signOut(auth);
  window.dispatchEvent(new Event('natally:signed-out'));
  const db = getFirestore(firebaseApp);
  await terminate(db);
  try {
    await clearIndexedDbPersistence(db);
  } finally {
    openFirestore();
  }
}
