import type { Resume } from "@/features/resume/schema";
import type { JobDescription } from "@/features/job-description/schema";
import { AnalysisSchema, type Analysis } from "./schema";
import { keywordCoverage } from "./score/keyword-coverage";
import { experienceMatch } from "./score/experience-match";
import { atsSafety } from "./score/ats-safety";
import { impactQuality } from "./score/impact-quality";
import { compositeScore } from "./score";
import { generateFindings, generateVerdict } from "./findings";

export type AnalyzeProgress = { stage: string; progress: number };

/**
 * Orchestrates the full analysis: 4 sub-scores (3 deterministic, 1 LLM-judged),
 * deterministic findings, a deterministic verdict, and the weighted composite.
 * `onProgress` lets the caller drive a streaming response without this
 * function knowing anything about HTTP.
 */
export async function analyze(
  resume: Resume,
  jd: JobDescription,
  onProgress?: (p: AnalyzeProgress) => void
): Promise<Analysis> {
  onProgress?.({ stage: "scoring-keywords", progress: 0.1 });
  const keywords = keywordCoverage(resume, jd);

  onProgress?.({ stage: "scoring-experience", progress: 0.25 });
  const experienceScore = experienceMatch(resume, jd);

  onProgress?.({ stage: "scoring-ats", progress: 0.4 });
  const atsScore = atsSafety(resume);

  onProgress?.({ stage: "judging-impact", progress: 0.55 });
  const impactScore = await impactQuality(resume);

  onProgress?.({ stage: "compositing", progress: 0.8 });
  const subscores = {
    keywordCoverage: keywords.score,
    experienceMatch: experienceScore,
    atsSafety: atsScore,
    impactQuality: impactScore,
  };
  const score = compositeScore(subscores);

  onProgress?.({ stage: "findings", progress: 0.9 });
  const findings = generateFindings(resume, keywords);
  const verdict = generateVerdict(score, findings);

  const analysis: Analysis = {
    score,
    subscores,
    keywords: {
      matched: keywords.matched.map((m) => ({ term: m.term, foundIn: m.foundIn })),
      missing: keywords.missing,
    },
    findings,
    verdict,
  };

  onProgress?.({ stage: "done", progress: 1 });
  return AnalysisSchema.parse(analysis);
}
