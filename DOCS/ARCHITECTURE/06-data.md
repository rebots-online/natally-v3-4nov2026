# 06 — Data

## 6.1 Firestore collections

| Path | Shape | Client read | Client write | Server write |
|---|---|---|---|---|
| `users/{uid}` | `AccountDoc` | owner | none | reconcile, settle |
| `users/{uid}/ledger/{entryId}` | `LedgerEntry` | owner | none | reconcile, settle, souvenir finalize |
| `users/{uid}/private/profile` | `ProfileDoc` | owner | owner | none |
| `users/{uid}/charts/primary` | `Chart` | owner | owner | none |
| `users/{uid}/conversations/{conversationId}` | `Conversation` | owner | owner | none |
| `users/{uid}/conversations/{conversationId}/turns/{turnId}` | `ReadingTurn` | owner | owner | none |
| `users/{uid}/souvenirs/{snapshotId}` | `SouvenirSnapshot`; `snapshotId` equals its souvenir ledger entry id | owner | create only, and only if that ledger entry exists with kind `souvenir_purchase` | none |
| `users/{uid}/souvenirs/{snapshotId}/elements/{elementId}` | `SouvenirElementContent`; `elementId` is `encodeURIComponent(key)` | owner | none | souvenir element |
| `users/{uid}/souvenirJobs/{snapshotId}` | `SouvenirJob` | owner | owner | none |
| `serverKeys/{uid}` | `{ currentHash, limitUsd, settledUsd, settleSeq, createdAt, expiresAt }` | none | none | keys |
| `serverKeys/{uid}/retiring/{hash}` | `{ settledUsd, settleSeq, retiredAt }` | none | none | keys |
| `serverDelivery/{snapshotId}` | `{ uid, token, publishedAt, emailedAt }` | none | none | souvenir finalize |
| `publicShares/{shareId}` | `{ ownerUid, name, chart: Pick<Chart,'schema'|'houseSystem'|'houseSystemReason'|'planets'|'angles'|'houses'|'aspects'|'firstHouseFrom'>, createdAt }`, with no birth date, time or place | anyone | owner create and delete | none |

## 6.2 Ledger entry ids

| Kind | Id | Idempotency |
|---|---|---|
| `purchase`, `souvenir_purchase` | `rc:<encodeURIComponent(transactionId)>`; future rails use their own prefix | Create only if absent inside the transaction |
| `usage` | `usage:<keyHash>:<settleSeq>` | `settleSeq` read and advanced in the same transaction |

## 6.3 Security rules (`firestore.rules`, complete)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function owner(uid) { return signedIn() && request.auth.uid == uid; }

    match /users/{uid} {
      allow read: if owner(uid);
      allow write: if false;

      match /ledger/{entryId} {
        allow read: if owner(uid);
        allow write: if false;
      }
      match /private/{doc} {
        allow read, write: if owner(uid);
      }
      match /charts/{chartId} {
        allow read, write: if owner(uid);
      }
      match /conversations/{conversationId} {
        allow read, write: if owner(uid);
        match /turns/{turnId} {
          allow read, write: if owner(uid);
        }
      }
      match /souvenirs/{snapshotId} {
        allow read: if owner(uid);
        allow create: if owner(uid)
          && request.resource.data.uid == uid
          && request.resource.data.ledgerEntryId == snapshotId
          && get(/databases/$(database)/documents/users/$(uid)/ledger/$(snapshotId)).data.kind == 'souvenir_purchase';
        allow update, delete: if false;
        match /elements/{elementId} {
          allow read: if owner(uid);
          allow write: if false;
        }
      }
      match /souvenirJobs/{snapshotId} {
        allow read, write: if owner(uid);
      }
    }
    match /publicShares/{shareId} {
      allow read: if true;
      allow create: if signedIn() && request.resource.data.ownerUid == request.auth.uid;
      allow delete: if signedIn() && resource.data.ownerUid == request.auth.uid;
      allow update: if false;
    }
    match /serverKeys/{document=**} { allow read, write: if false; }
    match /serverDelivery/{document=**} { allow read, write: if false; }
  }
}
```

## 6.4 Indexes (`firestore.indexes.json`)

No composite index is needed. Every query orders one collection by one field: `ledger` by `occurredAt` desc, `conversations` by `updatedAt` desc, `turns` by `createdAt` asc. The file is `{ "indexes": [], "fieldOverrides": [] }`.

## 6.5 On-device storage

| What | Where | Key | Cleared |
|---|---|---|---|
| Settings | `localStorage` | `natally.settings` | Never |
| Voice profile | `localStorage` | `natally.voice.profile` | Re-tune; model revision or voice change |
| Voice skipped | `localStorage` | `natally.voice.skipped` | When a profile is stored |
| Weights | OPFS `natally-voice/<revision>/` or `$APPDATA/voice/<revision>/` | Repo-relative file path; partial files end in `.part` | Revision change |
| Analytics client id, session | `localStorage` | `natally.analytics.client`, `natally.analytics.session` | Never; rotated by GA session rule |
| Inset position | `sessionStorage` | `natally.inset.<id>` | Tab close |
| Secure redirect guard | `sessionStorage` | `natally.secureRedirect` | Tab close |
| Update reload guard | `sessionStorage` | `natally.pwa.reloadedFor` | Tab close |
| Chunk reload guard | `sessionStorage` | `natally.chunkReloaded` | Next successful route load |
| Pending landing purchase | `sessionStorage` | `natally.pendingProduct` | After checkout attempt |
| Souvenir work in progress: PDF, audio, package bytes | OPFS `natally-souvenir/<snapshotId>/` | File path | After `ready` |
| Firebase auth, Firestore cache | SDK IndexedDB (`persistentLocalCache`) | SDK | Sign-out clears auth; `terminate` + `clearIndexedDbPersistence` on sign-out |
| Reading key | Memory only | n/a | Tab close, sign-out |
| Service-worker caches | CacheStorage | Workbox | New worker activation |

Birth details and the conversation live in the customer's own Firestore documents and go to OpenRouter only inside reading prompts. Voice text and audio never leave the device, except souvenir replay audio the customer bought.
