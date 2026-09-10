# Phase 2 — JD Extract + Deterministic Scoring

**Goal:** Three sub-scores (keyword coverage, experience match, ATS safety) computed with **zero** LLM involvement, against fixed fixtures.

## Scope
- Define the `JobDescription` Zod schema.
- Implement JD text → `JobDescription` extraction (this one step uses Gemini; everything downstream in this phase is pure/deterministic).
- Implement the three deterministic scorers.
- Unit tests with fixed resume + JD fixtures producing exact expected numbers.

## Packages to install
- `vitest` (+ `@vitest/ui` optional)

## Files to create
```
src/features/job-description/schema.ts          # Zod: JobDescription
src/features/job-description/extract.ts         # JD text -> JobDescription (Gemini)
src/lib/gemini/prompts/extract-jd.ts

src/features/analysis/score/keyword-coverage.ts  # deterministic
src/features/analysis/score/experience-match.ts  # deterministic
src/features/analysis/score/ats-safety.ts        # deterministic

tests/unit/score.test.ts
```

## Schema (from main spec §5.2)
```ts
const JobDescription = z.object({
  title: z.string(),
  company: z.string().optional(),
  seniority: z.enum(['intern','junior','mid','senior','lead','unknown']),
  yearsRequired: z.number().nullable(),
  hardSkills: z.array(z.object({
    term: z.string(),
    aliases: z.array(z.string()),
    required: z.boolean(),
  })),
  softSkills: z.array(z.string()),
  responsibilities: z.array(z.string()),
});
```
Aliases matter: without them "Postgres" vs "PostgreSQL" wrongly reads as a miss.

## Scoring rules (from main spec §7)

| Sub-score | Weight | Method |
|---|---|---|
| Keyword coverage | 35% | Required JD skills present in resume, alias-aware, case-insensitive, word-boundary matched. Required skills weigh 2×, optional 1×. |
| Experience match | 25% | Total months from `experience[]` vs `yearsRequired`. Full marks at/above requirement, linear falloff below, floor at 20. |
| ATS safety | 20% | Rule penalties: missing email/phone, no date on a role, bullets >320 chars, <3 bullets on most recent role, empty skills section, summary >600 chars. |

Note: the 4th sub-score (`impactQuality`, LLM-judged) is **Phase 3**, not this phase — it needs the analyze orchestrator and is not deterministic.

## Each scorer's contract
- Pure function: `(resume: Resume, jd: JobDescription) => number` (0–100).
- No network calls, no randomness — same input must always produce the same output (this is tested directly).
- `keyword-coverage.ts`: build a matched/missing term list as a byproduct (used later by `Analysis.keywords` in Phase 3), but the exported score function itself stays pure and numeric.

## Unit tests (`tests/unit/score.test.ts`)
- Fixed resume fixture + fixed JD fixture → exact expected number per scorer (not just "greater than 0").
- Edge cases: JD with zero required skills, resume with zero experience entries, `yearsRequired: null`.

## Out of scope for this phase
- `impact-quality.ts` (LLM-judged) — Phase 3
- `index.ts` weighted composite — Phase 3 (needs all 4 sub-scores)
- `/api/analyze` route — Phase 3
- Report screen UI — Phase 3

## Definition of done
- `npx vitest run tests/unit/score.test.ts` passes with exact-value assertions.
- Re-running any scorer on the same fixture twice yields identical output.
