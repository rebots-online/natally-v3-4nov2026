// The live account, ledger and profile (§5.6, §6.1). All reads are listeners on the customer's own documents.
import { collection, doc, getFirestore, limit, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import { firebaseApp, getSession } from '../auth';
import type { AccountDoc, LedgerEntry, MilliCredits, ProfileDoc } from '../types';
import { createLive } from './live';

const accountLive = createLive<AccountDoc | null>('account', null, (db, uid, emit, fail) =>
  onSnapshot(doc(db, 'users', uid), (snap) => emit(snap.exists() ? (snap.data() as AccountDoc) : null), fail),
);

const ledgerLive = createLive<LedgerEntry[]>('ledger', [], (db, uid, emit, fail) =>
  onSnapshot(
    query(collection(db, 'users', uid, 'ledger'), orderBy('occurredAt', 'desc'), limit(200)),
    (snap) => emit(snap.docs.map((d) => ({ ...(d.data() as Omit<LedgerEntry, 'id'>), id: d.id }))),
    fail,
  ),
);

const profileLive = createLive<ProfileDoc | null>('profile', null, (db, uid, emit, fail) =>
  onSnapshot(
    doc(db, 'users', uid, 'private', 'profile'),
    (snap) => {
      if (!snap.exists()) return emit(null);
      // The document is merged field by field, so any of them can still be absent.
      const d = snap.data() as Partial<ProfileDoc>;
      emit({ displayName: d.displayName ?? null, email: d.email ?? null, birth: d.birth ?? null, onboardedVoice: d.onboardedVoice ?? false, updatedAt: d.updatedAt ?? '' });
    },
    fail,
  ),
);

/** Credits never show below zero: settlement may leave the stored balance a hair under it (§7.4). */
const shown = (account: AccountDoc | null): MilliCredits => Math.max(0, account?.balanceMilli ?? 0);

export function useAccount(): { status: 'loading' | 'ready'; account: AccountDoc | null; balanceMilli: MilliCredits } {
  const live = accountLive.use();
  return { status: live.status, account: live.value, balanceMilli: shown(live.value) };
}

export function useLedger(): { status: 'loading' | 'ready'; entries: LedgerEntry[] } {
  const live = ledgerLive.use();
  return { status: live.status, entries: live.value };
}

export function useProfile(): { status: 'loading' | 'ready'; profile: ProfileDoc | null } {
  const live = profileLive.use();
  return { status: live.status, profile: live.value };
}

/** The balance last delivered to any mounted `useAccount`; 0 before the first delivery. */
export function getBalanceMilli(): MilliCredits {
  return shown(accountLive.peek().value);
}

/** Merges `patch` into users/{uid}/private/profile and stamps `updatedAt`. */
export async function saveProfile(patch: Partial<ProfileDoc>): Promise<void> {
  const { uid } = getSession();
  if (!uid) throw new Error('signed_out');
  const fields = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
  const updatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  await setDoc(doc(getFirestore(firebaseApp), 'users', uid, 'private', 'profile'), { ...fields, updatedAt }, { merge: true });
}
