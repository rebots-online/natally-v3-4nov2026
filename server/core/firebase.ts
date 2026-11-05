// §5.20: Firestore admin and ID-token verification. An empty admin configuration answers 503 provider_unavailable (§7.7).
import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import type { Uid } from '../../src/types/index.ts';
import type { ServerConfigX } from './config.ts';
import { HttpError } from './errors.ts';

const APP_NAME = 'natally-server';

function adminApp(cfg: ServerConfigX): App {
  const { projectId, clientEmail, privateKey } = cfg.firebaseAdmin;
  if (!projectId || !clientEmail || !privateKey) throw new HttpError('provider_unavailable', 503);
  const existing = getApps().find((a) => a.name === APP_NAME);
  if (existing) return existing;
  try {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId }, APP_NAME);
  } catch {
    return getApp(APP_NAME);   // lost a race with a concurrent initialisation
  }
}

export function getDb(cfg: ServerConfigX): Firestore {
  return getFirestore(adminApp(cfg));
}

/** The uid of a valid Firebase ID token, or null when the token is missing, malformed, expired or revoked. */
export async function verifyIdToken(cfg: ServerConfigX, bearer: string | null): Promise<Uid | null> {
  if (!bearer) return null;
  const auth = getAuth(adminApp(cfg));
  try {
    return (await auth.verifyIdToken(bearer)).uid;
  } catch {
    return null;
  }
}
