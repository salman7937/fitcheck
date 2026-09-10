# Phase 3 — Analysis Route + Report Screen

**Goal:** Score and findings render on screen (unstyled). `/api/analyze` streams real progress.

## Scope
- `Analysis` Zod schema.
- `impact-quality.ts` — the LLM-judged 4th sub-score.
- Weighted composite (`score/index.ts`).
- `analyze.ts` orchestrator (parse → extract → 4 scores → findings → verdict).
- `/api/parse` and `/api/analyze` routes, both streaming NDJSON progress frames.
- JSON repair-with-one-retry wrapper in `lib/gemini/call.ts` (needed now that two LLM calls exist in sequence).
- Report screen (unstyled): score, 4 sub-score bars, matched/missing keyword grid, findings list.

## Files to create
```
src/features/analysis/schema.ts                 # Zod: Analysis
src/features/analysis/score/impact-quality.ts    # LLM-judged
src/features/analysis/score/index.ts             # weighted composite
src/features/analysis/analyze.ts                 # orchestrator
src/lib/gemini/prompts/judge-impact.ts

src/app/api/parse/route.ts
src/app/api/analyze/route.ts
src/lib/stream.ts                                 # NDJSON helpers (encode/decode)
src/lib/errors.ts                                 # AppError + codes (start here, extend later)

src/app/(workspace)/analyze/page.tsx              # Upload + JD input (minimal, unstyled)
src/app/(workspace)/analyze/report/page.tsx        # Score + findings (unstyled)
src/features/analysis/components/score-dial.tsx
src/features/analysis/components/subscore-bars.tsx
src/features/analysis/components/keyword-grid.tsx
src/features/analysis/components/findings-list.tsx

src/store/session.ts                              # Zustand: resume, jd, analysis, changes
```

## Packages to install
- `zustand`

## Schema (from main spec §5.3)
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
    target: z.string().nullable(),
    title: z.string(),
    detail: z.string(),
    fixable: z.boolean(),
  })),
  verdict: z.string().max(400),
});
```

## Impact quality (§7)
- Regex pre-pass counts bullets containing a number (deterministic half).
- Gemini judges only the qualitative half: each bullet rated 0–2 on "states an outcome vs. states a duty."
- Combine into the 0–100 `impactQuality` sub-score.

## Composite score (§7)
```
score = round(
  0.35 * keywordCoverage +
  0.25 * experienceMatch +
  0.20 * atsSafety +
  0.20 * impactQuality
)
```
Bands: `0–49 Weak fit` · `50–69 Worth tailoring` · `70–84 Strong` · `85–100 Excellent`. Display band as headline, number as support.

## Streaming contract (§3.3)
`/api/parse` and `/api/analyze` return a `ReadableStream` of newline-delimited JSON:
```
{"stage":"extracting","progress":0.2}
{"stage":"structuring","progress":0.6}
{"stage":"done","payload":{...}}
```
This is what the Phase 9 scan animation will bind to — build the real events now so there is no fake timer to rip out later.

## Route contract (§3.3)
| Route | Purpose | Est. latency |
|---|---|---|
| `/api/parse` | File → `Resume` JSON | 6–12s |
| `/api/analyze` | `Resume` + JD → `Analysis` | 8–15s |

Auth guard (`requireSession()`) is **not** added yet — that's Phase 6. For now these routes are open; note this explicitly as temporary in code comments so it isn't mistaken for the final state.

## JSON repair (§11.8)
In `lib/gemini/call.ts`: if the model response fails `JSON.parse` or the Zod schema, strip markdown code fences, attempt a repair pass, retry once with the Zod error appended to the prompt. Fail loudly (throw a typed `AppError`) on the second failure — no silent fallback.

## Out of scope for this phase
- Improve/diff/review — Phase 4
- Any Tailwind/design tokens — Phase 9 (screens are functional, not styled)
- Auth guard on routes — Phase 6

## Definition of done
- Uploading a real PDF + pasting a JD and clicking "Run analysis" renders an unstyled report screen with a real score, 4 sub-scores, keyword grid, and findings list.
- Network tab shows NDJSON progress frames arriving before the final payload, not a single blocking response.
