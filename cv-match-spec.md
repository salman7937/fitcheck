# Fitcheck — Product & Engineering Specification

**Version** 1.0 · MVP scope
**Owner** Usman Ahmed
**Status** Ready to build

---

## 1. What this is

A web app that reads a candidate's CV against a specific job description, gives an honest fit score with a breakdown, explains exactly what's weak, and — on one click — rewrites the CV without inventing anything, returning a clean ATS-safe PDF.

**The one job of the product:** turn "I think my CV is fine" into "I know exactly which four lines are costing me this interview."

### Non-goals for v1

- No team or recruiter-side accounts — single-user only
- No email/password auth (Google + anonymous only)
- No cover letter generation
- No job board scraping or auto-apply
- No multi-CV comparison or recruiter-side features
- One resume template only

Everything above is a v2 conversation. Shipping v1 small is the point.

---

## 2. User flow

```
  Landing
     │
     ▼
  Anonymous session created silently (no wall)
     │
     ▼
  Upload CV (PDF/DOCX)  ──►  Parse to structured JSON
     │                            │
     ▼                            │
  Paste job description  ─────────┤
     │                            │
     ▼                            ▼
  [Run analysis]  ──────────►  Scan sequence (signature moment)
                                  │
                                  ▼
                            Report screen
                            · Fit score + 4 sub-scores
                            · Matched keywords / missing keywords
                            · Per-section findings
                            · Honest gap list (things the CV cannot fix)
                                  │
                                  ▼
                          [Improve my CV]
                                  │
                                  ▼
                            Review screen
                            · Change-by-change diff
                            · Accept / reject each change
                            · Live score recalculation
                                  │
                                  ▼
                          [Download PDF]
                                  │
                                  ▼
                     "Save this run?" → Sign in with Google
                     (anonymous account is linked, not replaced)
```

Working state lives in the Zustand store during a run. On completion it is written to Firestore under the current uid — anonymous or Google, both persist. Anonymous data survives on the same device via the Firebase-managed local session; signing in with Google promotes that same uid, so nothing is lost and no migration step is needed.

The sign-in prompt appears **after** value has been delivered, never before. There is no wall on the landing page.

---

## 3. Architecture

### 3.1 Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15, App Router, TypeScript strict | Server Actions remove the need for a separate API layer in most places |
| Styling | Tailwind CSS v4 + shadcn/ui | Fast, and the design tokens below map directly to CSS variables |
| Motion | Framer Motion (UI), GSAP (scan sequence timeline) | Framer for component-level state transitions; GSAP where a precisely orchestrated multi-stage timeline is needed |
| LLM | Google Gemini API, `gemini-2.5-pro` | Native PDF input removes an entire parsing layer |
| Validation | Zod | Same schema validates LLM output and API boundaries |
| PDF output | `@react-pdf/renderer` | Runs on serverless without a Chromium binary |
| Auth | Firebase Auth — Google + Anonymous | Anonymous-to-Google linking gives try-before-signup for free |
| Session | `firebase-admin` session cookies, `httpOnly` | Server Components can read auth state; no token in client storage |
| Persistence | Cloud Firestore | Comes with the auth decision; document shape matches `Resume` JSON directly |
| Rate limiting | Upstash Redis + `@upstash/ratelimit` | Keyed on uid, with a lower anonymous quota |
| Hosting | Vercel | |
| E2E | Playwright | |

### 3.2 The central architectural decision

**The CV is never handled as free text after ingestion.** It is parsed once into a strict `Resume` JSON object, and every subsequent operation — scoring, improving, diffing, rendering — reads and writes that object.

Consequences:

- The PDF template is deterministic. Same schema in, same layout out, every time.
- Diffs are computed on JSON paths, not on text. This makes per-change accept/reject trivial.
- The improve step cannot corrupt document structure, because it can only return a value that satisfies the schema.
- Adding a second template later means writing a new renderer, not re-architecting.

### 3.3 Request lifecycle

| Route | Method | Purpose | Est. latency |
|---|---|---|---|
| `/api/parse` | POST | File → `Resume` JSON | 6–12s |
| `/api/analyze` | POST | `Resume` + JD → `Analysis` | 8–15s |
| `/api/improve` | POST | `Resume` + `Analysis` → `ImprovedResume` | 10–20s |
| `/api/export` | POST | `Resume` → PDF stream | < 1s |
| `/api/auth/session` | POST | ID token → `httpOnly` session cookie | < 300ms |
| `/api/auth/session` | DELETE | Revoke cookie and sign out | < 200ms |

Every route except `/api/auth/session` resolves a verified session first and returns `401` on failure. There is no unauthenticated path to an LLM call.

`/api/parse` and `/api/analyze` stream progress events so the scan animation reflects real work rather than a fake timer. Use a `ReadableStream` returning newline-delimited JSON status frames:

```
{"stage":"extracting","progress":0.2}
{"stage":"structuring","progress":0.6}
{"stage":"done","payload":{...}}
```

---

## 4. Folder structure

Feature-first, not type-first. Everything a feature needs lives beside it; only genuinely shared code moves up.

```
fitcheck/
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   ├── page.tsx                 # Landing
│   │   │   └── layout.tsx
│   │   ├── (workspace)/
│   │   │   ├── analyze/
│   │   │   │   ├── page.tsx             # Upload + JD input
│   │   │   │   ├── report/page.tsx      # Score + findings
│   │   │   │   └── review/page.tsx      # Diff + accept/reject
│   │   │   ├── history/page.tsx         # Past runs (server component)
│   │   │   └── layout.tsx               # Workspace chrome, session guard
│   │   ├── api/
│   │   │   ├── auth/session/route.ts    # POST mint cookie, DELETE revoke
│   │   │   ├── parse/route.ts
│   │   │   ├── analyze/route.ts
│   │   │   ├── improve/route.ts
│   │   │   └── export/route.ts
│   │   ├── layout.tsx                   # Fonts, theme, providers
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   └── globals.css                  # @theme tokens
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── use-auth.ts              # Client hook, onIdTokenChanged
│   │   │   ├── sign-in.ts               # Google popup + anonymous linking
│   │   │   ├── sync-session.ts          # Posts ID token to /api/auth/session
│   │   │   └── components/
│   │   │       ├── auth-provider.tsx
│   │   │       ├── sign-in-dialog.tsx
│   │   │       ├── save-run-prompt.tsx  # Post-download upsell
│   │   │       └── account-menu.tsx
│   │   │
│   │   ├── history/
│   │   │   ├── repository.ts            # Firestore reads/writes (server-only)
│   │   │   └── components/
│   │   │       ├── run-list.tsx
│   │   │       └── run-card.tsx
│   │   │
│   │   ├── resume/
│   │   │   ├── schema.ts                # Zod: Resume
│   │   │   ├── parse.ts                 # File → Resume (server)
│   │   │   ├── normalize.ts             # Date cleanup, dedupe, trim
│   │   │   └── components/
│   │   │       ├── resume-dropzone.tsx
│   │   │       └── resume-preview.tsx
│   │   │
│   │   ├── job-description/
│   │   │   ├── schema.ts                # Zod: JobDescription
│   │   │   ├── extract.ts               # JD text → requirements
│   │   │   └── components/
│   │   │       └── jd-input.tsx
│   │   │
│   │   ├── analysis/
│   │   │   ├── schema.ts                # Zod: Analysis
│   │   │   ├── score/
│   │   │   │   ├── keyword-coverage.ts  # Deterministic
│   │   │   │   ├── experience-match.ts  # Deterministic
│   │   │   │   ├── ats-safety.ts        # Deterministic
│   │   │   │   ├── impact-quality.ts    # LLM-judged
│   │   │   │   └── index.ts             # Weighted composite
│   │   │   ├── analyze.ts               # Orchestrator
│   │   │   └── components/
│   │   │       ├── score-dial.tsx
│   │   │       ├── subscore-bars.tsx
│   │   │       ├── keyword-grid.tsx
│   │   │       └── findings-list.tsx
│   │   │
│   │   ├── improve/
│   │   │   ├── schema.ts                # Zod: Change, ImproveResult
│   │   │   ├── improve.ts               # LLM rewrite
│   │   │   ├── apply-changes.ts         # Change[] → Resume (pure)
│   │   │   ├── diff.ts                  # Resume × Resume → Change[]
│   │   │   └── components/
│   │   │       ├── change-card.tsx
│   │   │       ├── diff-text.tsx
│   │   │       └── review-toolbar.tsx
│   │   │
│   │   ├── export/
│   │   │   ├── templates/
│   │   │   │   └── precision/           # v1's only template
│   │   │   │       ├── document.tsx
│   │   │   │       ├── sections.tsx
│   │   │   │       └── styles.ts
│   │   │   └── render.ts
│   │   │
│   │   └── scan/                        # Signature animation
│   │       ├── use-scan-timeline.ts
│   │       ├── scan-stage.tsx
│   │       └── keyword-chip.tsx
│   │
│   ├── components/
│   │   ├── ui/                          # shadcn primitives
│   │   └── layout/
│   │       ├── site-header.tsx
│   │       ├── step-indicator.tsx
│   │       └── footer.tsx
│   │
│   ├── middleware.ts                    # Cookie presence check only (Edge)
│   │
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── client.ts                # Browser SDK, singleton
│   │   │   ├── admin.ts                 # Admin SDK, server-only guard
│   │   │   └── session.ts               # getSession(), requireSession()
│   │   ├── gemini/
│   │   │   ├── client.ts
│   │   │   ├── call.ts                  # Retry + JSON repair wrapper
│   │   │   └── prompts/
│   │   │       ├── parse-resume.ts
│   │   │       ├── extract-jd.ts
│   │   │       ├── judge-impact.ts
│   │   │       └── improve-resume.ts
│   │   ├── rate-limit.ts
│   │   ├── errors.ts                    # Typed AppError + codes
│   │   ├── stream.ts                    # NDJSON helpers
│   │   └── utils.ts
│   │
│   ├── store/
│   │   └── session.ts                   # Zustand: resume, jd, analysis, changes
│   │
│   └── types/
│       └── index.ts
│
├── tests/
│   ├── e2e/
│   │   ├── happy-path.spec.ts
│   │   ├── rejects-bad-file.spec.ts
│   │   └── fixtures/
│   │       ├── sample-cv.pdf
│   │       └── sample-jd.txt
│   └── unit/
│       ├── score.test.ts
│       ├── apply-changes.test.ts
│       └── diff.test.ts
│
├── public/
│   └── fonts/
├── firestore.rules
├── firestore.indexes.json
├── .env.example
├── CLAUDE.md
├── playwright.config.ts
├── next.config.ts
└── package.json
```

---

## 5. Data model

### 5.1 Resume

```ts
const Bullet = z.object({
  id: z.string(),              // stable, survives rewrites
  text: z.string().max(320),
});

const Resume = z.object({
  basics: z.object({
    name: z.string(),
    title: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    links: z.array(z.object({ label: z.string(), url: z.string() })),
  }),
  summary: z.string().max(600).optional(),
  experience: z.array(z.object({
    id: z.string(),
    company: z.string(),
    role: z.string(),
    location: z.string().optional(),
    start: z.string(),           // "2023-04" | "2023"
    end: z.string().nullable(),  // null = present
    bullets: z.array(Bullet),
  })),
  projects: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string().optional(),
    tech: z.array(z.string()),
    bullets: z.array(Bullet),
  })),
  skills: z.array(z.object({
    category: z.string(),
    items: z.array(z.string()),
  })),
  education: z.array(z.object({
    id: z.string(),
    institution: z.string(),
    degree: z.string(),
    year: z.string().optional(),
  })),
  certifications: z.array(z.object({
    id: z.string(),
    name: z.string(),
    issuer: z.string().optional(),
    year: z.string().optional(),
  })),
});
```

Stable `id` fields matter: they are how a change maps back to a specific bullet after a rewrite reorders things.

### 5.2 JobDescription

```ts
const JobDescription = z.object({
  title: z.string(),
  company: z.string().optional(),
  seniority: z.enum(['intern','junior','mid','senior','lead','unknown']),
  yearsRequired: z.number().nullable(),
  hardSkills: z.array(z.object({
    term: z.string(),
    aliases: z.array(z.string()),   // "Next.js" ~ "NextJS", "Next 15"
    required: z.boolean(),
  })),
  softSkills: z.array(z.string()),
  responsibilities: z.array(z.string()),
});
```

Aliases are what make keyword matching honest. Without them the score punishes people for writing "Postgres" instead of "PostgreSQL".

### 5.3 Analysis

```ts
const Analysis = z.object({
  score: z.number().min(0).max(100),
  subscores: z.object({
    keywordCoverage: z.number(),
    experienceMatch: z.number(),
    atsSafety: z.number(),
    impactQuality: z.number(),
  }),
  keywords: z.object({
    matched: z.array(z.object({ term: z.string(), foundIn: z.array(z.string()) })),
    missing: z.array(z.object({ term: z.string(), required: z.boolean() })),
  }),
  findings: z.array(z.object({
    id: z.string(),
    severity: z.enum(['critical','warning','polish']),
    section: z.string(),
    target: z.string().nullable(),   // JSON path, e.g. "experience[0].bullets[2]"
    title: z.string(),
    detail: z.string(),
    fixable: z.boolean(),            // false = genuine gap, not a wording problem
  })),
  verdict: z.string().max(400),
});
```

### 5.4 Change

```ts
const Change = z.object({
  id: z.string(),
  path: z.string(),                  // "experience[0].bullets[2].text"
  kind: z.enum(['rewrite','reorder','add-skill','remove','tighten']),
  before: z.string(),
  after: z.string(),
  reason: z.string(),                // must reference the JD
  linkedFindingId: z.string().nullable(),
  accepted: z.boolean(),             // defaults true, user can toggle
});
```

---

## 6. Authentication, session, and persistence

### 6.1 Providers

| Provider | Purpose |
|---|---|
| Anonymous | Created silently on first visit. Carries the entire product flow. |
| Google | Offered after the first PDF download. **Linked** to the existing anonymous uid via `linkWithPopup`, so the uid is preserved and no data migration runs. |

Email/password is deliberately excluded — it adds password reset, verification email, and enumeration-hardening work for a v1 that gains nothing from it.

If `linkWithPopup` throws `auth/credential-already-in-use`, the Google account already exists. Sign in with it normally, then copy the anonymous run documents into the real uid before discarding the anonymous account. This is the one migration path that must be handled; it is not rare.

### 6.2 Session model

The client SDK holds the ID token in memory. It is never read from `localStorage` by application code and never sent as an `Authorization` header from page navigations.

```
Browser                          Server
───────                          ──────
signInAnonymously()
        │
        ▼
  onIdTokenChanged  ──POST──►  /api/auth/session
   (fires on login,             verifyIdToken()
    refresh, expiry)            createSessionCookie(14d)
        │                              │
        │        ◄──Set-Cookie─────────┘
        ▼                         __session; httpOnly; secure;
  Cookie is now the                sameSite=lax; path=/
  source of truth
```

`onIdTokenChanged` — not `onAuthStateChanged` — is the correct listener. It fires on hourly token refresh as well as sign-in, which is what keeps the server cookie from drifting out of sync.

### 6.3 The Edge runtime constraint

`firebase-admin` is Node-only. Next.js middleware runs on Edge. Therefore:

- **`middleware.ts` checks only that the `__session` cookie exists**, and redirects to `/` if it does not. This is a UX optimisation, not a security control. It must never be the only thing standing between a request and data.
- **Real verification lives in `lib/firebase/session.ts`**, running in the Node runtime:

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

Every route handler and every Server Component that touches user data calls `requireSession()` as its first statement. No exceptions, no helper that "usually" has a session.

Mark `lib/firebase/admin.ts` with `import 'server-only'` so an accidental client import fails at build time rather than leaking the service account key into a bundle.

### 6.4 Firestore shape

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

Deliberately **not** stored: the uploaded PDF or DOCX itself. The parsed JSON is everything the product needs, and holding raw CV files means holding a folder of identity documents — more PII exposure, more storage cost, and a deletion obligation, for no feature. The original file is discarded once parsing succeeds.

A run document stays comfortably under the 1 MB limit. If a pathological CV approaches it, truncate `analysis.findings` before writing; never split a run across documents.

Retention: anonymous accounts and their runs are deleted after 30 days by a scheduled Cloud Function. State this in the sign-in prompt copy.

### 6.5 Security rules

Rules are the actual authorization boundary. The app must remain safe assuming every client is hostile.

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

All writes go through the Admin SDK in route handlers. The client never writes to Firestore. This keeps score integrity server-side — a client that could write its own `score` field would make the whole product meaningless.

Rules are tested with the Firestore emulator in CI: assert that uid A cannot read uid B's runs, and that no client write succeeds.

### 6.6 Quotas

Rate limiting keys on uid, not IP, and differs by account type:

| Account | Analyses / 24h |
|---|---|
| Anonymous | 2 |
| Google | 10 |

The gap is the honest incentive to sign in, and it is stated plainly in the sign-in dialog rather than discovered at the limit. Keep an IP-keyed limit alongside it as an abuse floor, since anonymous accounts are free to mint.

### 6.7 Auth UI

- **No sign-in page.** Anonymous auth means there is nothing to gate. The account menu sits in the header; when anonymous it reads "Not saved" with a subtle `--gap` dot.
- **`save-run-prompt.tsx`** appears after the first PDF download, inline beneath the download confirmation — not a modal. Copy: *"This run isn't saved. Sign in with Google to keep it and get 10 analyses a day instead of 2."*
- **Sign-in dialog** is a single Google button, one line about what is stored, and a link to deletion. No provider grid, no terms wall.
- **Sign-out** revokes the session cookie server-side via `revokeRefreshTokens`, not just a client `signOut()`.
- **Delete account** ships in v1. It is one Cloud Function and it is the difference between a product and a data-collection exercise.
- Auth state resolution must not flash. The header renders a neutral placeholder until the first `onIdTokenChanged` fires — never a "Sign in" button that swaps to an avatar.

---

## 7. Scoring

Scores must be reproducible. A number the user cannot interrogate is worse than no number.

| Sub-score | Weight | Method |
|---|---|---|
| Keyword coverage | 35% | **Deterministic.** Required JD skills present in the resume (alias-aware, case-insensitive, word-boundary matched). Required skills weigh 2×, optional 1×. |
| Experience match | 25% | **Deterministic.** Total months from `experience[]` vs `yearsRequired`. Full marks at or above requirement, linear falloff below, floor at 20. |
| ATS safety | 20% | **Deterministic rules.** Penalties for: missing email or phone, no date on a role, bullets over 320 chars, fewer than 3 bullets on the most recent role, an empty skills section, a summary over 600 chars. |
| Impact quality | 20% | **LLM-judged, constrained.** Each bullet rated 0–2 on whether it states an outcome rather than a duty. Regex pre-pass counts bullets containing a number; the LLM only judges the qualitative half. |

```
score = round(
  0.35 * keywordCoverage +
  0.25 * experienceMatch +
  0.20 * atsSafety +
  0.20 * impactQuality
)
```

Bands: `0–49 Weak fit` · `50–69 Worth tailoring` · `70–84 Strong` · `85–100 Excellent`.

Display the band as the headline, the number as support. Bands are honest about precision in a way that "73" is not.

---

## 8. The no-fabrication rule

This is the product's integrity constraint and the reason someone would trust it over the dozen alternatives.

**Encoded in the improve prompt as hard rules:**

Permitted operations:
- Rewrite a bullet for clarity, verb strength, or JD vocabulary alignment
- Reorder bullets, roles, or skill categories by relevance to this JD
- Surface a number that already exists elsewhere in the CV
- Rewrite the summary to lead with what this JD asks for
- Move an existing skill into a more prominent category
- Tighten or split an overlong bullet

Forbidden without exception:
- Inventing a company, role, date, tool, metric, or responsibility
- Adding a skill that appears nowhere in the source CV
- Converting a vague statement into a specific one by supplying the specifics
- Changing employment dates, job titles, or company names

**Enforcement, in three layers:**

1. **Prompt.** Rules stated as constraints, with two worked negative examples.
2. **Schema.** Improve returns `Change[]`, not a new resume. Every change carries `before` and `after`, so an addition from nowhere is visible by construction.
3. **Post-check (server, deterministic).** For every `Change`, tokenize `after`, subtract tokens present in `before` plus a stopword/verb allowlist, and flag any remaining proper nouns, numbers, or technology terms that do not appear anywhere in the source resume. Flagged changes are returned with `accepted: false` and a visible **Unverified** badge. They are never silently applied.

If a JD requirement genuinely isn't in the CV, it belongs in `findings` with `fixable: false` and phrasing that tells the truth: *"This role asks for Kubernetes. Nothing in your CV touches it — no rewrite fixes that. Consider whether a project could close it before you apply."*

---

## 9. Design system

### 9.1 Direction

The subject's world is **machine reading**. A recruiter spends six seconds on a CV; an ATS spends none — it parses. This product's job is to show the candidate what the machine sees. So the interface is built around one idea: **the document under a scanner.** Paper on the left, extracted signal on the right, a scan line moving between them.

Everything is quiet and precise except that one moment.

### 9.2 Tokens

**Color**

| Token | Hex | Role |
|---|---|---|
| `--paper` | `#F6F7F5` | Page background, cool off-white — document stock, not warm cream |
| `--graphite` | `#15181B` | Primary text, headings |
| `--muted` | `#6E7580` | Labels, metadata, captions |
| `--rule` | `#DEE2DE` | Hairlines, borders, dividers |
| `--beam` | `#4B2EE8` | The scan beam, primary actions, focus rings |
| `--match` | `#0B7A6B` | Matched keywords, passing sub-scores |
| `--gap` | `#C42B6B` | Missing required keywords, critical findings |

Two semantic colors carry actual information — match and gap are the product's data, not decoration. `--beam` is the only brand color and appears sparingly: the scan line, the primary button, focus states. Nothing else is colored.

Dark mode is out of scope for v1. A document product defaults to paper.

**Type**

| Role | Face | Usage |
|---|---|---|
| Display | **Bricolage Grotesque** (variable) | Hero, section headings, the score number. Use the width axis — condense the score to a tall narrow numeral. |
| Body | **Instrument Sans** | All prose, UI labels, buttons |
| Data | **JetBrains Mono** | Keyword chips, JSON paths, diff text, sub-score values, timestamps |

Mono is justified here, not stylistic: keyword chips and diff lines are machine-extracted tokens, and monospace signals that correctly.

Scale: `12 / 14 / 16 / 20 / 28 / 40 / 72`. Body 16/1.6. Headings tight at 1.05 with `-0.02em` tracking. The score numeral sits at 72 with the Bricolage width axis pulled narrow.

**Layout**

- 12-column grid, 1200px max, 24px gutters
- Workspace is a fixed two-pane split: document 58% left, analysis rail 42% right, independently scrolling
- Below 900px the panes stack; the rail becomes a bottom sheet
- Radius: 6px on cards, 4px on chips, 999px on nothing. Nothing is a pill.
- Elevation: one shadow only, `0 1px 2px rgb(0 0 0 / 0.05)`. Depth comes from hairlines.

### 9.3 Signature element — the scan

The one memorable moment. It runs once, on analysis, and takes roughly 4 seconds — bounded by real progress events from the stream, never a fake timer.

```
┌───────────────────────────┐   ┌──────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░      │   │                  │
│ ░░░░░░░░░  ░░░░░░         │   │   FIT            │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │◄── beam            │
│ ░░░░░░░░░░░░░░░░░░        │   │   ██             │
│ ░░░░░░  ░░░░░░░░░░░░      │   │                  │
│                           │   │  ▸ next.js       │
│   [ Next.js ]────────────────────▸ typescript    │
│                           │   │  ▸ postgres      │
└───────────────────────────┘   └──────────────────┘
     abstracted document            analysis rail
```

Sequence (GSAP timeline, four stages):

1. **Settle** (0–400ms) — the uploaded CV renders as abstracted grey line-blocks, staggered in from the top, 18ms apart.
2. **Beam** (400–2800ms) — a 2px `--beam` line with a soft gradient falloff travels top to bottom. Lines it has passed shift from grey to `--graphite`.
3. **Extraction** (concurrent) — as the beam crosses a line containing a JD keyword, that word lifts off the page as a mono chip and arcs into the rail, landing in the matched column and tinting `--match`. Chips animate along a slight curve, not a straight line.
4. **Verdict** (2800–4000ms) — missing keywords fade into the gap column in `--gap`, the score numeral counts up with an ease-out, and the sub-score bars fill left to right in sequence, 80ms apart.

Then the page goes still. No ambient motion afterwards.

### 9.4 Motion elsewhere — restrained

| Element | Treatment |
|---|---|
| Buttons | 120ms background transition. No scale, no lift. |
| Change cards | `layout` animation on accept/reject; the card collapses, the list closes the gap |
| Score on re-calc | Numeral rolls to the new value over 400ms; the delta appears beside it and fades after 2s |
| Route transitions | 180ms crossfade, no slide |
| Dropzone | Border shifts to `--beam` on drag-over. Nothing else. |
| Loading | Real progress from the stream. No skeleton shimmer, no spinner. |

`prefers-reduced-motion: reduce` collapses the scan to a single 300ms fade that ends in the same final state. Every animation is decorative on top of a state that is already correct.

### 9.5 Copy

Plain, direct, never cheerful about bad news.

| Context | Text |
|---|---|
| Empty dropzone | "Drop your CV here. PDF or Word, under 5 MB." |
| JD placeholder | "Paste the job description. The whole posting works better than a summary." |
| Primary CTA | "Run analysis" → then "Improve my CV" → then "Download PDF" |
| Critical finding | "Your most recent role has one bullet. Recruiters read that section first." |
| Unfixable gap | "This role wants 5 years. Your CV shows 3. Apply anyway if the rest fits — just know that's the gap." |
| Unverified change | "This adds something not in your original CV. Check it before you accept." |
| Parse failure | "Couldn't read that file. If it's a scanned image, export a text PDF and try again." |
| Rate limited | "You've used your 3 analyses for today. Resets at midnight UTC." |

Action names stay constant through the flow: the button that says "Download PDF" produces a toast that says "PDF downloaded."

---

## 10. PDF output

Template name: **Precision.** Single column, ATS-safe by construction.

- A4, 20mm margins
- No tables, no columns, no images, no icons, no header/footer regions
- Section headings: uppercase, 10pt, letter-spaced, with a hairline rule beneath
- Body 10pt / 1.45, bullets with a simple `•`, no custom glyphs
- Embedded fonts: Instrument Sans regular + semibold only
- Contact line as plain text, links as full URLs
- Filename: `{lastname}-{jd-title-slug}.pdf`

Renderer is a pure function `(resume: Resume) => Document`. Zero conditional layout logic beyond "hide empty sections."

---

## 11. Professional details worth building

These separate a demo from a product. Ordered by value per hour spent.

1. **Per-change accept/reject with live rescoring.** The single highest-value feature. Users don't want a black box rewrite; they want control. Rescoring on toggle makes the tradeoff visible.
2. **Before/after side-by-side.** Split view with removed text struck in `--gap` and added text underlined in `--match`, at the bullet level.
3. **Fabrication badges.** The post-check from §8 surfaced in the UI. This is the trust feature.
4. **Keyword provenance.** Clicking a matched chip highlights the exact bullet it was found in. Clicking a missing chip shows where it would need to go.
5. **Streaming progress.** Real stage events driving the scan animation. Removes the dead 15 seconds that kills most LLM products.
6. **Deterministic sub-scores.** Same input, same number. Users will re-run; inconsistency destroys credibility instantly.
7. **Typed error taxonomy.** `AppError` with codes (`FILE_TOO_LARGE`, `SCANNED_PDF`, `JD_TOO_SHORT`, `LLM_MALFORMED`, `RATE_LIMITED`), each mapped to a specific recovery instruction. No generic "something went wrong."
8. **JSON repair with one retry.** If the model returns invalid JSON, strip fences, attempt repair, retry once with the Zod error appended. Fail loudly on the second attempt.
9. **Rate limiting.** Per §6.6 — uid-keyed, with an IP floor behind it. Two LLM calls per run; unbounded usage is a real cost.
9b. **Account deletion that actually deletes.** Auth record, user document, and the `runs` subcollection, in one Cloud Function. Confirm by typed word, not a checkbox.
10. **Accessibility floor.** Visible `--beam` focus rings, full keyboard path through upload → analyze → review → download, score announced via `aria-live`, all findings reachable without a mouse.
11. **Print stylesheet** for the report screen itself, so the analysis can be saved alongside the CV.
12. **`CLAUDE.md`** at repo root documenting the schema-first rule, the no-fabrication constraint, and the token system — so future work doesn't erode either.

---

## 12. Testing

**Unit** (Vitest)
- `score/*` — fixed resume + JD fixtures produce exact expected numbers
- `apply-changes` — pure function, path resolution, rejected changes excluded
- `diff` — reordering produces `reorder` changes, not `rewrite`
- Fabrication post-check — a change introducing "Kubernetes" is flagged

**E2E** (Playwright)
- Happy path: upload → analyze → improve → accept all → download; assert a PDF arrives with non-zero bytes
- Reject a change, assert the score drops and the change is absent from the PDF text layer
- Upload a 6 MB file, assert the `FILE_TOO_LARGE` message
- Upload a scanned image PDF, assert the `SCANNED_PDF` recovery message
- `prefers-reduced-motion` run: assert the final state matches the animated run

**Auth** (Firestore emulator + Playwright)
- Rules: uid A reading uid B's `runs` is denied; any client write is denied
- Anonymous session is created on first load without user action
- A completed run appears in `/history` after reload — the persistence claim, end to end
- Anonymous quota exhausts at 2 and returns the `RATE_LIMITED` copy
- Signing in with Google preserves the anonymous run (uid unchanged)
- `credential-already-in-use`: run documents are copied to the existing account
- Direct navigation to `/history` without a cookie redirects to `/`
- A forged `__session` cookie returns `401` from `/api/analyze` — proves middleware is not the boundary

Auth runs use Playwright `storageState`: one project signs in against the emulator and writes state to disk, dependent projects reuse it rather than re-authenticating per test.

LLM calls are mocked at the `lib/gemini/call.ts` boundary with recorded fixtures. Firebase runs against the local emulator suite. No test should hit the real API or a live project.

---

## 13. Environment

```
GEMINI_API_KEY=

# Firebase — client (safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase — admin (server only, never NEXT_PUBLIC_)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=          # newlines escaped as \n, unescape at read time

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_APP_URL=
```

`NEXT_PUBLIC_FIREBASE_API_KEY` being public is expected and not a leak — it is a project identifier, and Security Rules are what protect the data. `FIREBASE_PRIVATE_KEY` is the one that matters; keep `lib/firebase/admin.ts` behind `import 'server-only'`.

Add the Vercel preview and production domains to Firebase **Authorized domains**, or Google sign-in fails silently on deploy.

---

## 14. Build order

| Phase | Deliverable | Definition of done |
|---|---|---|
| 1 | Schema + parse | A PDF becomes valid `Resume` JSON, printed to console |
| 2 | JD extract + deterministic scoring | Three sub-scores computed with zero LLM involvement |
| 3 | Analysis route + report screen | Score and findings render, unstyled |
| 4 | Improve + diff + review screen | Accept/reject works, rescoring is live |
| 5 | PDF export | Accepted changes appear in a downloaded file |
| 6 | Auth + session cookie | Anonymous session mints, `requireSession()` guards every route, forged cookie returns 401 |
| 7 | Firestore + history | A run survives reload; rules tests pass on the emulator |
| 8 | Google linking + quotas | Sign-in preserves the anonymous run; quota copy is correct at the limit |
| 9 | Design system + scan sequence | Tokens applied, signature animation lands |
| 10 | Hardening | Error taxonomy, account deletion, a11y pass, E2E suite green |

Phases 1–5 are a working product with no styling and no accounts. Do not start phase 9 before phase 8 works end to end.

Build auth **after** the core flow, not before. Auth in front of an unfinished product means every manual test starts with a sign-in, which slows the phase that actually needs fast iteration.

---

## 15. Deferred to v2

Email/password and GitHub sign-in · re-running an old CV against a new JD from history · multiple templates · cover letter generation · JD-from-URL fetching · bulk CV comparison · LinkedIn profile import · shareable report links · a browser extension that scores a posting in place.
