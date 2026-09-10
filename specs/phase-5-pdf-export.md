# Phase 5 — PDF Export

**Goal:** Accepted changes appear in a downloaded file. Phases 1–5 together are a working product with no styling and no accounts.

## Scope
- `Precision` template — v1's only resume template.
- `render.ts` — pure function `(resume: Resume) => Document`.
- `/api/export` route.
- Download button wired to the review screen's current (post accept/reject) resume state.

## Files to create
```
src/features/export/templates/precision/document.tsx
src/features/export/templates/precision/sections.tsx
src/features/export/templates/precision/styles.ts
src/features/export/render.ts

src/app/api/export/route.ts
public/fonts/                                    # Instrument Sans regular + semibold (.ttf)
```

## Packages to install
- `@react-pdf/renderer`

## Template rules (main spec §10)
- A4, 20mm margins.
- No tables, no columns, no images, no icons, no header/footer regions — ATS-safe by construction.
- Section headings: uppercase, 10pt, letter-spaced, hairline rule beneath.
- Body 10pt / 1.45, bullets with a plain `•`, no custom glyphs.
- Embedded fonts: Instrument Sans regular + semibold only.
- Contact line as plain text; links as full URLs (no "click here" style anchors — ATS parsers read raw text).
- Filename: `{lastname}-{jd-title-slug}.pdf`.

## `render.ts` contract
- Pure function, zero conditional layout logic beyond "hide empty sections" (e.g. no `projects` array → skip that section entirely, don't render an empty heading).
- Takes the **already-applied** `Resume` (i.e. `apply-changes(resume, changes)` from Phase 4 has already run) — this route does not know about `Change[]`, only the final `Resume`.

## `/api/export` route
- POST, `Resume` in → PDF stream out.
- Target latency <1s (§3.3) — no LLM call in this route at all.

## Out of scope for this phase
- Multiple templates (deferred to v2, §15)
- Auth guard — Phase 6

## Definition of done
- From the review screen, clicking "Download PDF" produces a non-empty PDF file matching the filename convention.
- Rejecting a change in Phase 4's review screen and then exporting produces a PDF whose text layer does not contain the rejected `after` text (verified by extracting text from the downloaded PDF).
- Opening the PDF in a plain text/ATS-style extractor shows no garbled characters (proves the no-tables/no-columns/no-icons constraint held).
