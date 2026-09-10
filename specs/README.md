# Fitcheck — Phase Specs

Derived from [`cv-match-spec.md`](../cv-match-spec.md), split into buildable phases per its §14 Build Order. LLM provider is **Google Gemini** (`gemini-2.5-pro`), not Anthropic — the root spec has been updated accordingly.

Build strictly in order. Phases 1–5 are a working product with no styling and no accounts — do not start Phase 9 before Phase 8 works end to end.

| Phase | Spec | Deliverable |
|---|---|---|
| 1 | [phase-1-schema-and-parse.md](phase-1-schema-and-parse.md) | A PDF becomes valid `Resume` JSON |
| 2 | [phase-2-jd-extract-and-scoring.md](phase-2-jd-extract-and-scoring.md) | 3 deterministic sub-scores, zero LLM |
| 3 | [phase-3-analysis-route-and-report.md](phase-3-analysis-route-and-report.md) | Score + findings render, unstyled |
| 4 | [phase-4-improve-diff-review.md](phase-4-improve-diff-review.md) | Accept/reject + live rescoring |
| 5 | [phase-5-pdf-export.md](phase-5-pdf-export.md) | Accepted changes in a downloaded PDF |
| 6 | [phase-6-auth-and-session.md](phase-6-auth-and-session.md) | Anonymous session + `requireSession()` guard |
| 7 | [phase-7-firestore-and-history.md](phase-7-firestore-and-history.md) | A run survives reload |
| 8 | [phase-8-google-linking-and-quotas.md](phase-8-google-linking-and-quotas.md) | Google linking preserves uid; quotas correct |
| 9 | [phase-9-design-system-and-scan.md](phase-9-design-system-and-scan.md) | Tokens + signature scan animation |
| 10 | [phase-10-hardening.md](phase-10-hardening.md) | Error taxonomy, a11y, E2E suite green |
