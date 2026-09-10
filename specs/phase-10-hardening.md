# Phase 10 — Hardening

**Goal:** Error taxonomy, account deletion, accessibility pass, E2E suite green. This is what turns a working demo into a shippable v1.

## Scope
- Typed `AppError` taxonomy across every route (extend the stub from Phase 3).
- Account deletion Cloud Function finished (stubbed in Phase 8).
- Accessibility floor.
- Print stylesheet for the report screen.
- Full Playwright E2E suite + Firestore emulator auth suite.
- `CLAUDE.md` documenting the schema-first rule, no-fabrication constraint, and token system.

## Files to create/modify
```
src/lib/errors.ts                         # finalize: AppError + full code list
src/app/error.tsx
src/app/not-found.tsx

tests/e2e/happy-path.spec.ts
tests/e2e/rejects-bad-file.spec.ts
tests/e2e/fixtures/sample-cv.pdf
tests/e2e/fixtures/sample-jd.txt
playwright.config.ts

# auth/rules emulator tests (extends Phase 6/7/8 suites into the full checklist below)

# print stylesheet — likely a `@media print` block scoped to the report route
```

## Packages to install
- `@playwright/test`

## Error taxonomy (§11.7)
`AppError` with codes, each mapped to a **specific** recovery instruction — no generic "something went wrong":
- `FILE_TOO_LARGE`
- `SCANNED_PDF`
- `JD_TOO_SHORT`
- `LLM_MALFORMED`
- `RATE_LIMITED`

Wire these through every route from Phases 1–8 that can fail this way, and surface the corresponding copy from §9.5 (e.g. `SCANNED_PDF` → "Couldn't read that file. If it's a scanned image, export a text PDF and try again.").

## Account deletion (§11.9b)
One Cloud Function: Auth record + `users/{uid}` document + entire `runs` subcollection, deleted together. Confirmed by a typed word in the UI, not a checkbox — this was stubbed in Phase 8, finish it here.

## Accessibility floor (§11.10)
- Visible `--beam` focus rings on every interactive element (buttons, chips, toggles).
- Full keyboard path through upload → analyze → review → download — no mouse-only interaction anywhere in the golden path.
- Score announced via `aria-live` when it updates (initial load and on rescoring after accept/reject).
- All findings reachable and actionable without a mouse.

## Print stylesheet (§11.11)
- Report screen gets a `@media print` treatment so the analysis itself can be printed/saved alongside the CV — separate concern from the PDF export template in Phase 5.

## `CLAUDE.md` (§11.12)
Document, at repo root:
- The schema-first rule (§3.2) — CV is never handled as free text after ingestion.
- The no-fabrication constraint (§8) and its three enforcement layers.
- The token system (§9.2) so future styling work doesn't erode it.

## Testing checklist (§12) — full suite, not a sample

**Unit** (already partially built in Phases 2 and 4, complete here)
- `score/*` fixtures produce exact expected numbers
- `apply-changes` — pure function, path resolution, rejected changes excluded
- `diff` — reordering produces `reorder`, not `rewrite`
- Fabrication post-check flags an injected "Kubernetes"

**E2E** (Playwright)
- Happy path: upload → analyze → improve → accept all → download; assert PDF arrives with non-zero bytes
- Reject a change → score drops and the change is absent from the PDF text layer
- Upload a 6MB file → `FILE_TOO_LARGE`
- Upload a scanned image PDF → `SCANNED_PDF`
- `prefers-reduced-motion` run → final state matches the animated run

**Auth** (Firestore emulator + Playwright)
- Rules: uid A cannot read uid B's `runs`; no client write succeeds
- Anonymous session created on first load, no user action
- A completed run appears in `/history` after reload
- Anonymous quota exhausts at 2 → `RATE_LIMITED` copy
- Google sign-in preserves the anonymous run (uid unchanged)
- `credential-already-in-use` → run documents copied to the existing account
- Direct nav to `/history` with no cookie → redirect to `/`
- Forged `__session` cookie → `401` from `/api/analyze`

Use Playwright `storageState`: one project signs in against the emulator and writes state to disk; dependent projects reuse it instead of re-authenticating per test.

LLM calls are mocked at the `lib/gemini/call.ts` boundary with recorded fixtures — no test hits the real Gemini API or a live Firebase project.

## Definition of done
- Every error path in the product returns a typed `AppError` with copy matching §9.5, not a generic message.
- Account deletion removes all three pieces of user data, verified by a subsequent failed read.
- Keyboard-only walkthrough completes the entire golden path.
- `npx playwright test` and the full unit suite are green in CI, with zero calls reaching the real Gemini API or a live Firebase project.
