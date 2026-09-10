# Phase 4 — Improve + Diff + Review Screen

**Goal:** Accept/reject works, rescoring is live. This is the product's trust mechanism — read §8 (no-fabrication rule) fully before writing the prompt.

## Scope
- `Change` Zod schema.
- `improve.ts` — Gemini rewrite step, returns `Change[]`, **never** a full new resume.
- Fabrication post-check (deterministic, server-side).
- `diff.ts` and `apply-changes.ts` — pure functions.
- Review screen: change cards, accept/reject, live rescoring.
- `/api/improve` route, streaming.

## Files to create
```
src/features/improve/schema.ts               # Zod: Change, ImproveResult
src/features/improve/improve.ts               # Gemini rewrite -> Change[]
src/features/improve/apply-changes.ts         # Change[] -> Resume (pure)
src/features/improve/diff.ts                  # Resume x Resume -> Change[]
src/lib/gemini/prompts/improve-resume.ts

src/app/api/improve/route.ts

src/app/(workspace)/analyze/review/page.tsx
src/features/improve/components/change-card.tsx
src/features/improve/components/diff-text.tsx
src/features/improve/components/review-toolbar.tsx

tests/unit/apply-changes.test.ts
tests/unit/diff.test.ts
```

## Schema (from main spec §5.4)
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

## The no-fabrication rule (§8) — read this section of the main spec in full
**Permitted:** rewrite for clarity/verb strength/JD vocabulary, reorder by relevance, surface a number that already exists elsewhere in the CV, rewrite summary, move a skill to a more prominent category, tighten/split an overlong bullet.

**Forbidden, no exceptions:** inventing a company/role/date/tool/metric/responsibility, adding a skill absent from the source CV, turning a vague statement specific by supplying the specifics, changing dates/titles/company names.

**Three enforcement layers — all three, not just one:**
1. **Prompt** — constraints stated explicitly, with two worked negative examples embedded in `improve-resume.ts`.
2. **Schema** — `improve()` returns `Change[]` with `before`/`after` on every entry, never a replacement `Resume`. Fabrication is visible by construction because nothing is applied silently.
3. **Post-check (deterministic, server-side, not the LLM)** — for every `Change`: tokenize `after`, subtract tokens present in `before` plus a stopword/verb allowlist, flag any remaining proper noun, number, or technology term not found anywhere in the source `Resume`. Flagged changes are forced to `accepted: false` with an **Unverified** badge. They are never auto-applied.

If a JD requirement genuinely isn't in the CV, that belongs in `Analysis.findings` (already built in Phase 3) with `fixable: false` — it is not something `improve()` should try to paper over.

## `diff.ts` and `apply-changes.ts` — pure, no LLM
- `diff(before: Resume, after: Resume): Change[]` — used to verify the LLM's own output and to detect reorders specifically (a bullet moving position is a `reorder` change, not a `rewrite` — test this explicitly).
- `apply-changes(resume: Resume, changes: Change[]): Resume` — resolves each `Change.path` (JSON path) against the resume; rejected (`accepted: false`) changes are excluded from the result.

## Review screen
- Change-by-change cards, each with before/after, reason, an Unverified badge when flagged.
- Toggling accept/reject re-runs `apply-changes` + the Phase 2/3 scorers against the resulting resume → live score.
- No Tailwind styling yet (Phase 9); focus on state correctness.

## Out of scope for this phase
- PDF export — Phase 5
- Visual diff styling (strikethrough/underline colors) — Phase 9, though the underlying diff text data should already be structured for it (`diff-text.tsx` can compute the segments now, color them later)

## Definition of done
- `tests/unit/diff.test.ts`: a reordered bullet produces a `reorder` change, not `rewrite`.
- `tests/unit/apply-changes.test.ts`: a rejected change's `before` text survives in the applied resume.
- A fabrication post-check test: injecting "Kubernetes" into an `after` field that has no source in the resume gets flagged and forced `accepted: false`.
- On the review screen, toggling a change recalculates and re-renders the score without a page reload.
