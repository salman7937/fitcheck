# Phase 7 — Firestore + History

**Goal:** A run survives a page reload; Firestore rules tests pass on the emulator.

## Scope
- Firestore document shape under `users/{uid}/runs/{runId}`.
- Security rules — the actual authorization boundary (assume every client is hostile).
- Write path: server-side only, via Admin SDK, triggered on run completion (after export or at minimum after analysis — decide the exact trigger point when implementing, but writes never originate client-side).
- `/history` page (Server Component) reading a user's own runs.
- Emulator-based rules tests.

## Files to create
```
src/features/history/repository.ts        # Firestore reads/writes, server-only
src/features/history/components/run-list.tsx
src/features/history/components/run-card.tsx

src/app/(workspace)/history/page.tsx       # server component

firestore.rules
firestore.indexes.json

tests/rules/*.test.ts                      # or wherever the emulator test suite lives
```

## Packages to install
- `firebase-tools` (dev dependency, for the local emulator) — or confirm it's available globally
- `@firebase/rules-unit-testing` (dev dependency, for rules tests)

## Firestore shape (§6.4)
```
users/{uid}
  ├── createdAt, lastSeenAt, isAnonymous, runCount
  └── runs/{runId}
        ├── createdAt
        ├── jobTitle, company            # denormalised for the history list
        ├── score, subscores
        ├── resume        (Resume JSON, the improved version)
        ├── analysis      (Analysis JSON)
        └── changes       (Change[] with accepted flags)
```
**Deliberately not stored:** the uploaded PDF/DOCX itself. The parsed JSON is everything the product needs; holding raw files means holding identity documents for no feature gain. Discard the original file once parsing succeeds (this should already be true from Phase 1 — confirm nothing downstream accidentally persisted it).

A run document must stay comfortably under Firestore's 1MB limit. If a pathological CV approaches it, truncate `analysis.findings` before writing — never split a run across documents.

Retention: anonymous accounts and their runs are deleted after 30 days by a scheduled Cloud Function (the Cloud Function itself can be stubbed/deferred to Phase 10 hardening, but the schema and copy should already assume it exists).

## Security rules (§6.5)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false;                    // server-only, via Admin SDK

      match /runs/{runId} {
        allow read:  if request.auth != null && request.auth.uid == uid;
        allow write: if false;                  // server-only
      }
    }
  }
}
```
All writes go through the Admin SDK in route handlers — the client never writes to Firestore directly. This is what keeps score integrity server-side; a client that could write its own `score` field would make the entire product meaningless.

## `/history` page
- Server Component, calls `requireSession()` (Phase 6) first.
- Reads `users/{uid}/runs` ordered by `createdAt desc` via the Admin SDK repository — not the client SDK.
- Direct navigation to `/history` without a valid cookie redirects to `/` (via `middleware.ts` cookie check, backed by the real `requireSession()` check in the page itself).

## Definition of done
- Completing a run (Phases 1–5 flow) and reloading the browser shows that run in `/history` — the actual persistence claim, proven end to end, not just a Firestore console check.
- Emulator rules tests: uid A reading uid B's `runs` subcollection is denied; any client-initiated write (read-only client, attempt a direct `setDoc`) is denied.
- Direct navigation to `/history` with no cookie redirects to `/`.
