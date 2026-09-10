# Phase 1 — Schema + Parse

**Goal:** A PDF becomes a valid `Resume` JSON object, printed to console. No UI, no auth, no scoring yet.

## Scope
- Define the `Resume` Zod schema (source of truth for the whole app — see main spec §5.1).
- Set up the Gemini client and a thin call wrapper.
- Implement file → `Resume` JSON parsing using Gemini's native PDF input.
- Verify manually via a script/console log — no route, no UI required yet.

## Packages to install
- `zod`
- `@google/genai` (Gemini SDK)

## Files to create
```
src/features/resume/schema.ts        # Zod: Bullet, Resume
src/features/resume/parse.ts         # File (Buffer/Blob) -> Resume, server-only
src/lib/gemini/client.ts             # Singleton Gemini client
src/lib/gemini/call.ts               # Retry + JSON parse/repair wrapper (see Phase 3 note)
src/lib/gemini/prompts/parse-resume.ts
src/types/index.ts                   # re-export inferred types (Resume, Bullet, ...)
```

## Schema (from main spec §5.1)
```ts
const Bullet = z.object({
  id: z.string(),
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
    start: z.string(),
    end: z.string().nullable(),
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
Every `id` field must be stable and generated once (e.g. `crypto.randomUUID()`), since later phases map changes back to these ids.

## Parsing approach
- Send the PDF/DOCX bytes directly to Gemini (native document input — no separate PDF-text-extraction library needed for PDFs).
- Prompt instructs the model to return **only** JSON matching the `Resume` shape (field names, types, required arrays even if empty).
- Response is parsed with `Resume.safeParse`. On failure, do **not** silently coerce — this is where the JSON-repair-with-one-retry pattern (Phase 3/§11.8) will eventually plug in, but for Phase 1 a thrown error is enough.
- DOCX support: if Gemini's file API doesn't accept `.docx` directly, extract text first (e.g. `mammoth`) and send as text instead of binary — decide this once and document it in `parse.ts`.

## Out of scope for this phase
- `/api/parse` route (Phase 3 wires routes + streaming)
- Any UI (dropzone, preview)
- `normalize.ts` (date cleanup/dedupe) — nice-to-have, can be added once real CVs are tested against

## Definition of done
- Running a local script against a sample PDF resume prints a `Resume` object that passes `Resume.parse()` with no errors.
- Malformed/unparseable model output throws a clear error rather than crashing with a raw JSON parse exception.
