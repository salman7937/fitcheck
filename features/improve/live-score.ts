import type { Resume } from "@/features/resume/schema";
import type { JobDescription } from "@/features/job-description/schema";
import type { Change } from "./schema";
import { applyChanges } from "./apply-changes";
import { keywordCoverage } from "@/features/analysis/score/keyword-coverage";
import { experienceMatch } from "@/features/analysis/score/experience-match";
import { atsSafety } from "@/features/analysis/score/ats-safety";
import { compositeScore } from "@/features/analysis/score";

/**
 * Recomputes the 3 deterministic sub-scores against the resume with only
 * *accepted* changes applied, live on every toggle. `impactQuality` is
 * carried over from the original LLM-judged analysis rather than
 * re-invoking the LLM on every checkbox click — it does not shift enough
 * with wording-only edits to justify the latency/cost of a re-judge here.
 */
export function recalculateScore(
  resume: Resume,
  jd: JobDescription,
  changes: Change[],
  originalImpactQuality: number
) {
  const applied = applyChanges(resume, changes);

  const subscores = {
    keywordCoverage: keywordCoverage(applied, jd).score,
    experienceMatch: experienceMatch(applied, jd),
    atsSafety: atsSafety(applied),
    impactQuality: originalImpactQuality,
  };

  return { subscores, score: compositeScore(subscores) };
}
