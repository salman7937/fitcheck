# Phase 6 — Auth + Session Cookie

**Goal:** Anonymous session mints silently, `requireSession()` guards every data route, a forged `__session` cookie returns 401.

Build auth **after** the core flow (Phases 1–5), not before — every manual test during those phases would otherwise start with a sign-in and slow the iteration that most needs speed.

## Scope
- Firebase project setup (Auth: Google + Anonymous providers enabled).
- Client SDK singleton + admin SDK singleton (server-only guarded).
- Anonymous sign-in on first load.
- `onIdTokenChanged` → POST ID token to `/api/auth/session` → `httpOnly` session cookie.
- `getSession()` / `requireSession()` in the Node runtime.
- `middleware.ts` — cookie-presence check only (Edge, UX-only, not a security boundary).
- Wire `requireSession()` into every route from Phases 1–5 (`/api/parse`, `/api/analyze`, `/api/improve`, `/api/export`).

## Files to create
```
src/lib/firebase/client.ts          # Browser SDK, singleton
src/lib/firebase/admin.ts           # Admin SDK, server-only guard ('server-only' import)
src/lib/firebase/session.ts         # getSession(), requireSession()

src/middleware.ts                   # cookie presence check only

src/app/api/auth/session/route.ts   # POST mint cookie, DELETE revoke

src/features/auth/use-auth.ts       # client hook, onIdTokenChanged
src/features/auth/sign-in.ts        # google popup + anonymous linking (stub for Phase 8)
src/features/auth/sync-session.ts   # posts ID token to /api/auth/session
src/features/auth/components/auth-provider.tsx
```

## Packages to install
- `firebase` (client SDK)
- `firebase-admin`
- `server-only`

## Providers (§6.1)
- **Anonymous** — created silently on first visit, no user action, no wall.
- **Google** — full linking flow is Phase 8; this phase only needs the Anonymous path working end to end plus the plumbing Google will reuse.

Email/password is deliberately excluded — not part of this or any phase.

## Session model (§6.2)
- ID token held in memory by the client SDK only. Never read from `localStorage` by app code, never sent as an `Authorization` header on page navigations.
- Listener is `onIdTokenChanged`, **not** `onAuthStateChanged` — it also fires on hourly token refresh, which is what keeps the server cookie in sync.
- Flow: `signInAnonymously()` → `onIdTokenChanged` fires → POST ID token to `/api/auth/session` → server calls `verifyIdToken()` then `createSessionCookie(14d)` → `Set-Cookie: __session; httpOnly; secure; sameSite=lax; path=/`.

## The Edge runtime constraint (§6.3) — the most important rule in this phase
`firebase-admin` is Node-only; Next.js middleware runs on Edge. Therefore:
- `middleware.ts` **only checks that `__session` exists** and redirects to `/` if absent. This is a UX optimization, never treat it as security.
- Real verification happens in `lib/firebase/session.ts`, in the Node runtime:
```ts
// server-only
export async function getSession(): Promise<Session | null> {
  const cookie = (await cookies()).get('__session')?.value;
  if (!cookie) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    return { uid: decoded.uid, isAnonymous: decoded.firebase.sign_in_provider === 'anonymous' };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new AppError('UNAUTHENTICATED');
  return session;
}
```
- Every route handler and every Server Component touching user data calls `requireSession()` as its **first statement**. No helper that "usually" has a session — apply this to all four Phase 1–5 routes now.
- `lib/firebase/admin.ts` must start with `import 'server-only'` so an accidental client-side import fails the build instead of leaking the service account key.

## Definition of done
- Loading the app with no prior session silently creates an anonymous Firebase user (visible in the Firebase console / network tab), no UI prompt.
- `/api/parse`, `/api/analyze`, `/api/improve`, `/api/export` all return `401` when called with no cookie.
- A hand-crafted/forged `__session` cookie value (not a valid session cookie) also returns `401` from `/api/analyze` — this specifically proves middleware's cookie-presence check is not standing in as the real boundary.
- Refreshing the page after 1+ hour (or manually forcing a token refresh) keeps the server cookie in sync without a re-login.
