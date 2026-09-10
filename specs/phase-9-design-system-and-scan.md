# Phase 9 — Design System + Scan Sequence

**Goal:** Tokens applied across every screen built in Phases 3–8; the signature scan animation lands.

**Do not start this phase before Phase 8 works end to end.** Styling an incomplete product means restyling twice.

## Scope
- Tailwind v4 tokens + shadcn/ui primitives.
- Fonts: Bricolage Grotesque (display), Instrument Sans (body — already partially embedded in Phase 5's PDF), JetBrains Mono (data).
- Apply tokens to every screen built so far: landing, analyze/upload, report, review, history, auth UI.
- The scan sequence — the one signature animation, built on the real streaming events from Phase 3.
- Restrained motion elsewhere (Framer Motion for component transitions).

## Files to create/modify
```
src/app/globals.css                     # @theme tokens
src/components/ui/                      # shadcn primitives
src/components/layout/site-header.tsx
src/components/layout/step-indicator.tsx
src/components/layout/footer.tsx

src/features/scan/use-scan-timeline.ts  # GSAP timeline
src/features/scan/scan-stage.tsx
src/features/scan/keyword-chip.tsx

src/app/(marketing)/page.tsx            # Landing
src/app/(marketing)/layout.tsx
src/app/layout.tsx                      # fonts, theme, providers
```

## Packages to install
- `gsap`
- `framer-motion`
- shadcn/ui CLI setup (`npx shadcn@latest init`) — installs its own deps

## Direction (§9.1)
Core idea: **the document under a scanner.** Paper on the left, extracted signal on the right, a scan line moving between them. Quiet and precise everywhere except the one scan moment.

## Tokens (§9.2)

**Color**
| Token | Hex | Role |
|---|---|---|
| `--paper` | `#F6F7F5` | Page background |
| `--graphite` | `#15181B` | Primary text, headings |
| `--muted` | `#6E7580` | Labels, metadata |
| `--rule` | `#DEE2DE` | Hairlines, borders |
| `--beam` | `#4B2EE8` | Scan beam, primary actions, focus rings |
| `--match` | `#0B7A6B` | Matched keywords, passing sub-scores |
| `--gap` | `#C42B6B` | Missing required keywords, critical findings |

`--match`/`--gap` are data, not decoration — never repurpose them for anything but pass/fail semantics. `--beam` is the only brand color: scan line, primary button, focus states, nothing else. No dark mode in v1.

**Type**
| Role | Face | Usage |
|---|---|---|
| Display | Bricolage Grotesque (variable) | Hero, section headings, score number (use the width axis, condensed for the numeral) |
| Body | Instrument Sans | All prose, UI labels, buttons |
| Data | JetBrains Mono | Keyword chips, JSON paths, diff text, sub-score values, timestamps |

Scale: `12/14/16/20/28/40/72`. Body 16/1.6. Headings 1.05 line-height, `-0.02em` tracking. Score numeral at 72, narrow width axis.

**Layout**
- 12-column grid, 1200px max, 24px gutters.
- Workspace: fixed two-pane split, document 58% left / analysis rail 42% right, independently scrolling.
- Below 900px: panes stack, rail becomes a bottom sheet.
- Radius: 6px cards, 4px chips, nothing is a pill (no 999px radius anywhere).
- One shadow only: `0 1px 2px rgb(0 0 0 / 0.05)`. Depth comes from hairlines, not elevation.

## The scan sequence (§9.3) — GSAP, 4 stages, ~4s total, bounded by real progress events (Phase 3 streaming), never a fake timer
1. **Settle** (0–400ms) — CV renders as grey line-blocks, staggered top-down, 18ms apart.
2. **Beam** (400–2800ms) — 2px `--beam` line with soft gradient falloff travels top to bottom; passed lines shift grey → `--graphite`.
3. **Extraction** (concurrent with Beam) — when the beam crosses a line containing a JD keyword, it lifts off as a mono chip, arcs (not straight-line) into the rail, lands in the matched column, tints `--match`.
4. **Verdict** (2800–4000ms) — missing keywords fade into the gap column in `--gap`; score numeral counts up (ease-out); sub-score bars fill left-to-right, 80ms apart.

Page goes fully still after — no ambient motion.

## Motion elsewhere (§9.4) — restrained, not decorative for its own sake
| Element | Treatment |
|---|---|
| Buttons | 120ms background transition only, no scale/lift |
| Change cards | Framer `layout` animation on accept/reject, list closes the gap |
| Score on re-calc | Numeral rolls 400ms, delta shown then fades after 2s |
| Route transitions | 180ms crossfade, no slide |
| Dropzone | Border → `--beam` on drag-over, nothing else |
| Loading | Real stream progress only — no skeleton shimmer, no spinner |

`prefers-reduced-motion: reduce` collapses the scan to a single 300ms fade landing on the same final state — every animation must be decorative on top of an already-correct state, never load-bearing.

## Copy (§9.5) — apply verbatim, don't paraphrase
| Context | Text |
|---|---|
| Empty dropzone | "Drop your CV here. PDF or Word, under 5 MB." |
| JD placeholder | "Paste the job description. The whole posting works better than a summary." |
| Primary CTA | "Run analysis" → "Improve my CV" → "Download PDF" |
| Critical finding | "Your most recent role has one bullet. Recruiters read that section first." |
| Unfixable gap | "This role wants 5 years. Your CV shows 3. Apply anyway if the rest fits — just know that's the gap." |
| Unverified change | "This adds something not in your original CV. Check it before you accept." |
| Parse failure | "Couldn't read that file. If it's a scanned image, export a text PDF and try again." |
| Rate limited | "You've used your 3 analyses for today. Resets at midnight UTC." |

Action names stay constant end-to-end: the button labeled "Download PDF" produces a toast that says "PDF downloaded" — not "Success" or "Done."

## Definition of done
- Every screen from Phases 3–8 uses tokens exclusively (no ad-hoc hex values, no default shadcn theme colors left in place).
- The scan sequence runs once on analysis, driven by real stream progress, and completes in ~4s.
- Toggling `prefers-reduced-motion` shows the same final state via a single 300ms fade.
- A visual pass confirms nothing uses a pill radius and no color other than `--beam`/`--match`/`--gap` is used for anything but its defined semantic role.
