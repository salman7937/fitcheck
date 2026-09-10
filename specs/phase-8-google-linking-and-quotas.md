# Phase 8 — Google Linking + Quotas

**Goal:** Signing in with Google preserves the anonymous run (uid unchanged); quota copy is correct at the limit.

## Scope
- Google sign-in via `linkWithPopup` on the existing anonymous user.
- `auth/credential-already-in-use` migration path (the one edge case that is not rare — must be handled, not just noted).
- Upstash Redis rate limiting, uid-keyed, with an IP-keyed floor.
- Sign-in dialog, save-run-prompt, account menu, sign-out (server-side revoke), delete account.

## Files to create
```
src/features/auth/sign-in.ts                      # complete: google popup + linking + migration
src/features/auth/components/sign-in-dialog.tsx
src/features/auth/components/save-run-prompt.tsx  # post-download upsell
src/features/auth/components/account-menu.tsx

src/lib/rate-limit.ts

src/app/api/auth/session/route.ts                  # extend: DELETE revokes via revokeRefreshTokens
# account deletion Cloud Function — location depends on where Cloud Functions live in this repo;
# document the decision when implementing (Firebase Functions dir vs. a Next.js route calling Admin SDK)
```

## Packages to install
- `@upstash/ratelimit`
- `@upstash/redis`

## Google linking flow (§6.1)
- Offered **after the first PDF download**, never before (no wall on landing, per §2).
- `linkWithPopup(anonymousUser, googleProvider)` — preserves the existing uid, so no data migration is needed in the common case (Firestore rules/data already keyed on that uid from Phase 7).
- If `linkWithPopup` throws `auth/credential-already-in-use`: the Google account already exists as a separate user. Handle it as:
  1. Sign in normally with that Google account (new uid).
  2. Copy the anonymous user's `runs` documents into the real uid.
  3. Discard/leave the anonymous account (cleanup can ride the Phase 6/7 30-day retention Cloud Function).
- This path must have its own test — it is explicitly called out as "not rare" in the spec, not a hypothetical edge case.

## Quotas (§6.6)
| Account | Analyses / 24h |
|---|---|
| Anonymous | 2 |
| Google | 10 |

- Rate limiting keys on **uid**, not IP, for the primary limit.
- Keep an IP-keyed limit alongside it as an abuse floor (anonymous accounts are free to mint, so uid-only limiting is gameable).
- The gap between tiers is the sign-in incentive — state it plainly in copy, not just discovered at the limit: *"You've used your 2 analyses for today. Resets at midnight UTC."* / sign-in dialog states "get 10 analyses a day instead of 2."
- Wire this into `/api/analyze` (and `/api/improve` if it also calls the LLM per run — confirm against Phase 4).

## Auth UI (§6.7)
- No sign-in page — nothing to gate since anonymous auth already works. Account menu in the header; anonymous state reads "Not saved" with a `--gap`-colored dot (styling itself is Phase 9; wire the state now, style later).
- `save-run-prompt.tsx`: appears inline beneath the download confirmation, not a modal.
- Sign-in dialog: single Google button, one line on what's stored, a link to deletion. No provider grid, no terms wall.
- Sign-out: calls `revokeRefreshTokens` server-side via the `/api/auth/session` DELETE, not just client `signOut()`.
- Delete account: one operation removing the auth record, the user document, and the entire `runs` subcollection. Confirm via a typed word, not a checkbox.
- Auth state must never flash: header renders a neutral placeholder until the first `onIdTokenChanged` fires — never a "Sign in" button that swaps to an avatar after the fact.

## Definition of done
- Downloading a PDF as an anonymous user shows the save-run-prompt; clicking through and completing Google sign-in keeps the same run visible in `/history` under the same uid.
- Simulating `auth/credential-already-in-use` (sign in with a Google account that was already used elsewhere) results in the anonymous run(s) appearing under the pre-existing Google uid.
- Making a 3rd analysis request as an anonymous user within 24h returns the rate-limited copy/error; a Google-signed-in user's 3rd request succeeds (until their own 11th).
- Delete account removes the user from Firebase Auth, the `users/{uid}` doc, and all `runs` — verified by attempting a subsequent read and getting nothing.
