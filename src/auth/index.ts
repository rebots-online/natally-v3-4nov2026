// The auth module's only public door (§5.5).
export { firebaseApp } from './firebase';
export { useSession, getSession, getIdToken, signOutNow, type Session } from './session';
export { ApiError, apiFetch } from './api';
export { default as ScreenSignIn } from './ScreenSignIn';
export { default as ScreenDesktopBridge } from './ScreenDesktopBridge';
