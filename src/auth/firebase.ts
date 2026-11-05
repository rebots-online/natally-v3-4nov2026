// The single Firebase app (§5.5). Firestore is opened here, once, with its on-device cache, so every module that later calls
// getFirestore(firebaseApp) receives that same instance.
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from 'firebase/firestore';
import { config } from '../config';

export const firebaseApp: FirebaseApp = initializeApp({
  apiKey: config.firebase.apiKey,
  authDomain: config.firebase.authDomain,
  projectId: config.firebase.projectId,
  appId: config.firebase.appId,
  messagingSenderId: config.firebase.messagingSenderId,
});

export const auth = getAuth(firebaseApp);

/** Opens the app's default Firestore with the persistent cache. Called at load and again after sign-out has terminated it. */
export function openFirestore(): Firestore {
  return initializeFirestore(firebaseApp, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
}

openFirestore();
