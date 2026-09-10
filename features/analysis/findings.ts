import type { Resume } from "@/features/resume/schema";
import type { Finding } from "./schema";
import type { KeywordCoverageResult } from "./score/keyword-coverage";
import { hasQuantifier } from "./score/impact-quality";

let counter = 0;
function findingId(): string {
  counter += 1;
  return `finding-${Date.now()}-${counter}`;
}

const MIN_RECENT_ROLE_BULLETS = 3;
const MAX_BULLET_LENGTH = 320;
const MAX_SUMMARY_LENGTH = 600;

/**
 * Deterministic finding generation from the already-computed signals.
 * No LLM call — same inputs always produce the same findings, matching
 * the reproducibility requirement on everything score-adjacent.
 */
export function generateFindings(
  resume: Resume,
  keywords: KeywordCoverageResult
): Finding[] {
  const findings: Finding[] = [];

  for (const missing of keywords.missing) {
    findings.push({
      id: findingId(),
      severity: missing.required ? "critical" : "warning",
      section: "keywords",
      target: null,
      title: missing.required
        ? `Missing required skill: ${missing.term}`
        : `Missing preferred skill: ${missing.term}`,
      detail: `This role asks for ${missing.term}. Nothing in your CV touches it — no rewrite fixes that. Consider whether a project could close it before you apply.`,
      fixable: false,
    });
  }

  if (!resume.basics.email) {
    findings.push({
      id: findingId(),
      severity: "critical",
      section: "basics",
      target: "basics.email",
      title: "No email listed",
      detail: "Recruiters and ATS parsers both expect a direct contact email.",
      fixable: true,
    });
  }

  if (!resume.basics.phone) {
    findings.push({
      id: findingId(),
      severity: "warning",
      section: "basics",
      target: "basics.phone",
      title: "No phone number listed",
      detail: "Some ATS systems flag a missing phone number as an incomplete profile.",
      fixable: true,
    });
  }

  const mostRecentRole = resume.experience[0];
  if (mostRecentRole && mostRecentRole.bullets.length < MIN_RECENT_ROLE_BULLETS) {
    findings.push({
      id: findingId(),
      severity: "critical",
      section: "experience",
      target: "experience[0]",
      title: "Your most recent role has too few bullets",
      detail: "Your most recent role has one bullet. Recruiters read that section first.",
      fixable: true,
    });
  }

  resume.experience.forEach((exp, i) => {
    exp.bullets.forEach((bullet, j) => {
      if (bullet.text.length > MAX_BULLET_LENGTH) {
        findings.push({
          id: findingId(),
          severity: "polish",
          section: "experience",
          target: `experience[${i}].bullets[${j}]`,
          title: "Bullet is too long",
          detail: "This bullet runs past 320 characters. Tighten it for scanability.",
          fixable: true,
        });
      }
      if (!hasQuantifier(bullet)) {
        findings.push({
          id: findingId(),
          severity: "polish",
          section: "experience",
          target: `experience[${i}].bullets[${j}]`,
          title: "No measurable outcome",
          detail: "This bullet has no number. A concrete metric makes the impact easier to trust.",
          fixable: true,
        });
      }
    });
  });

  const hasAnySkills = resume.skills.some((g) => g.items.length > 0);
  if (resume.skills.length === 0 || !hasAnySkills) {
    findings.push({
      id: findingId(),
      severity: "warning",
      section: "skills",
      target: null,
      title: "Skills section is empty",
      detail: "An empty skills section gives ATS keyword matching nothing to find.",
      fixable: true,
    });
  }

  if (resume.summary && resume.summary.length > MAX_SUMMARY_LENGTH) {
    findings.push({
      id: findingId(),
      severity: "polish",
      section: "summary",
      target: "summary",
      title: "Summary is too long",
      detail: "Your summary runs past 600 characters. Lead with what this JD asks for and cut the rest.",
      fixable: true,
    });
  }

  return findings;
}

export function generateVerdict(score: number, findings: Finding[]): string {
  const critical = findings.filter((f) => f.severity === "critical").length;
  const unfixable = findings.filter((f) => !f.fixable).length;

  if (score >= 85) {
    return "Strong match. Small polish aside, this CV is ready to send as-is.";
  }
  if (score >= 70) {
    return `Solid fit with ${critical} thing${critical === 1 ? "" : "s"} worth fixing before you apply.`;
  }
  if (score >= 50) {
    return `Worth tailoring — ${critical} critical issue${critical === 1 ? "" : "s"} and ${unfixable} genuine gap${unfixable === 1 ? "" : "s"} the rewrite can't close.`;
  }
  return `Weak fit as it stands. ${unfixable} gap${unfixable === 1 ? "" : "s"} in this CV can't be fixed by rewording — check whether the rest is worth pursuing anyway.`;
}
