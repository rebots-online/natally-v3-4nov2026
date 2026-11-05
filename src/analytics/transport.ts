// What index.ts needs from a sender. Exactly two implementations exist (§15.3): gtag.ts and collect.ts.
import type { AnalyticsParams } from '../types';

export interface Transport {
  /** Params are already scalar. Called only while consent is granted. */
  send(name: string, params: AnalyticsParams): void;
  /** Granted: the sender may load and send. Denied: it stops at once and drops anything held. */
  setConsent(granted: boolean): void;
  /** The `signed_in` property, never a uid. */
  setSignedIn(signedIn: boolean): void;
  /** Send what is held now (page hide). */
  flush(): void;
}
