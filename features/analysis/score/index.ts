export { keywordCoverage } from "./keyword-coverage";
export { experienceMatch, totalExperienceMonths } from "./experience-match";
export { atsSafety } from "./ats-safety";
export { impactQuality, hasQuantifier } from "./impact-quality";

export type Subscores = {
  keywordCoverage: number;
  experienceMatch: number;
  atsSafety: number;
  impactQuality: number;
};

const WEIGHTS = {
  keywordCoverage: 0.35,
  experienceMatch: 0.25,
  atsSafety: 0.2,
  impactQuality: 0.2,
} as const;

export type ScoreBand = "Weak fit" | "Worth tailoring" | "Strong" | "Excellent";

export function scoreBand(score: number): ScoreBand {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Worth tailoring";
  return "Weak fit";
}

/** Weighted composite per spec §7. Pure function of the four sub-scores. */
export function compositeScore(subscores: Subscores): number {
  const weighted =
    WEIGHTS.keywordCoverage * subscores.keywordCoverage +
    WEIGHTS.experienceMatch * subscores.experienceMatch +
    WEIGHTS.atsSafety * subscores.atsSafety +
    WEIGHTS.impactQuality * subscores.impactQuality;

  return Math.round(weighted);
}
