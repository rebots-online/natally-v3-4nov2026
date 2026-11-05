// The sign-in methods of §1.3 and §11.1. Each resolves when the customer is signed in, or throws SignInFailure carrying the
// key of the message to show. Analytics: `sign_up` when Firebase says the account is new, else `login`; `signin_failed` on error.
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  type ConfirmationResult,
  type UserCredential,
} from 'firebase/auth';
import { track } from '../analytics';
import { getPlatform } from '../platform';
import { auth } from './firebase';
import { markNewUser } from './session';
import type { StringKey } from './strings';

export type SignInMethod = 'google' | 'email' | 'phone';

export class SignInFailure extends Error {
  override readonly name = 'SignInFailure';
  constructor(
    readonly messageKey: StringKey,
    readonly code: string,
  ) {
    super(messageKey);
  }
}

/** The customer closed the sign-in window themselves: nothing to report. */
const CANCELLED = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled']);

const MESSAGE_FOR_CODE: Record<string, StringKey> = {
  'auth/invalid-email': 'auth.emailInvalid',
  'auth/missing-email': 'auth.emailInvalid',
  'auth/invalid-credential': 'auth.wrongPassword',
  'auth/wrong-password': 'auth.wrongPassword',
  'auth/user-not-found': 'auth.wrongPassword',
  'auth/missing-password': 'auth.wrongPassword',
  'auth/email-already-in-use': 'auth.emailInUse',
  'auth/weak-password': 'auth.weakPassword',
  'auth/invalid-phone-number': 'auth.phoneInvalid',
  'auth/missing-phone-number': 'auth.phoneInvalid',
  'auth/invalid-verification-code': 'auth.codeWrong',
  'auth/missing-verification-code': 'auth.codeWrong',
  'auth/code-expired': 'auth.codeWrong',
  'auth/popup-blocked': 'auth.popupBlocked',
  'auth/network-request-failed': 'auth.network',
};

/** Turns anything a method threw into a SignInFailure, reports it, and returns null when the customer simply cancelled. */
function failed(error: unknown, method: SignInMethod): SignInFailure | null {
  if (error instanceof SignInFailure) {
    track('signin_failed', { method, code: error.code });
    return error;
  }
  const code = error instanceof FirebaseError ? error.code : 'platform';
  if (CANCELLED.has(code)) return null;
  track('signin_failed', { method, code });
  // Without a secure context the popup cannot work, whatever Firebase reports (§1.5).
  const key: StringKey = method === 'google' && !window.isSecureContext ? 'auth.popupInsecure' : (MESSAGE_FOR_CODE[code] ?? 'auth.network');
  return new SignInFailure(key, code);
}

async function run(method: SignInMethod, attempt: () => Promise<UserCredential>, knownNew = false): Promise<void> {
  try {
    const credential = await attempt();
    const isNew = knownNew || (getAdditionalUserInfo(credential)?.isNewUser ?? false);
    if (isNew) markNewUser(credential.user.uid);
    track(isNew ? 'sign_up' : 'login', { method });
  } catch (error) {
    const failure = failed(error, method);
    if (failure) throw failure;
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const checkEmail = (email: string) => {
  if (!EMAIL.test(email)) throw new SignInFailure('auth.emailInvalid', 'client/email-invalid');
};

export async function signInGoogle(): Promise<void> {
  await run('google', async () => {
    const platform = await getPlatform().googleSignIn();
    if (platform === 'popup') {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      return signInWithPopup(auth, provider);
    }
    return signInWithCredential(auth, GoogleAuthProvider.credential(platform.idToken, platform.accessToken));
  });
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  await run('email', async () => {
    checkEmail(email.trim());
    return signInWithEmailAndPassword(auth, email.trim(), password);
  });
}

export async function signUpWithEmail(email: string, password: string): Promise<void> {
  await run(
    'email',
    async () => {
      checkEmail(email.trim());
      if (password.length < 8) throw new SignInFailure('auth.weakPassword', 'client/weak-password');
      return createUserWithEmailAndPassword(auth, email.trim(), password);
    },
    true,
  );
}

/** Normalises "+1 416 555 0100" to E.164, or null. */
function e164(raw: string): string | null {
  const digits = raw.replace(/[\s().-]/g, '');
  return /^\+[1-9]\d{6,14}$/.test(digits) ? digits : null;
}

let verifier: RecaptchaVerifier | null = null;
function clearVerifier() {
  verifier?.clear();
  verifier = null;
}

/** Sends the SMS code. `containerId` is the invisible reCAPTCHA host (#signin-recaptcha) and must be in the page. */
export async function sendPhoneCode(phone: string, containerId: string): Promise<ConfirmationResult> {
  try {
    const number = e164(phone);
    if (!number) throw new SignInFailure('auth.phoneInvalid', 'client/phone-invalid');
    clearVerifier();
    verifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
    return await signInWithPhoneNumber(auth, number, verifier);
  } catch (error) {
    clearVerifier();
    const failure = failed(error, 'phone');
    if (failure) throw failure;
    throw new SignInFailure('auth.network', 'cancelled');
  }
}

export async function confirmPhoneCode(confirmation: ConfirmationResult, code: string): Promise<void> {
  await run('phone', () => confirmation.confirm(code.trim()));
  clearVerifier();
}

export const releasePhoneVerifier = clearVerifier;
