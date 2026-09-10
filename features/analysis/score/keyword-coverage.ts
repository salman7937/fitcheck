import type { Resume } from "@/features/resume/schema";
import type { JobDescription, HardSkill } from "@/features/job-description/schema";

export type KeywordMatch = {
  term: string;
  required: boolean;
  foundIn: string[];
};

export type KeywordCoverageResult = {
  score: number;
  matched: KeywordMatch[];
  missing: { term: string; required: boolean }[];
};

/** Sections searched for a skill mention, tagged with a label used for `foundIn`. */
function searchableSections(resume: Resume): { label: string; text: string }[] {
  const sections: { label: string; text: string }[] = [];

  if (resume.summary) sections.push({ label: "summary", text: resume.summary });

  resume.experience.forEach((exp, i) => {
    const text = exp.bullets.map((b) => b.text).join(" ");
    sections.push({ label: `experience[${i}]`, text });
  });

  resume.projects.forEach((proj, i) => {
    const text = [proj.tech.join(" "), proj.bullets.map((b) => b.text).join(" ")].join(" ");
    sections.push({ label: `projects[${i}]`, text });
  });

  resume.skills.forEach((group, i) => {
    if (!Array.isArray(group?.items)) return;
    sections.push({ label: `skills[${i}]`, text: group.items.join(" ") });
  });

  return sections;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function termMatches(term: string, text: string): boolean {
  const pattern = new RegExp(`\\b${escapeRegex(term)}\\b`, "i");
  return pattern.test(text);
}

function findSkill(
  skill: HardSkill,
  sections: { label: string; text: string }[]
): string[] {
  const terms = [skill.term, ...skill.aliases];
  const foundIn: string[] = [];

  for (const section of sections) {
    if (terms.some((term) => termMatches(term, section.text))) {
      foundIn.push(section.label);
    }
  }

  return foundIn;
}

/**
 * Deterministic, alias-aware, case-insensitive, word-boundary keyword match.
 * Required skills weigh 2x, optional 1x, of the max attainable weight.
 */
export function keywordCoverage(
  resume: Resume,
  jd: JobDescription
): KeywordCoverageResult {
  const sections = searchableSections(resume);

  if (jd.hardSkills.length === 0) {
    return { score: 100, matched: [], missing: [] };
  }

  let earned = 0;
  let total = 0;
  const matched: KeywordMatch[] = [];
  const missing: { term: string; required: boolean }[] = [];

  for (const skill of jd.hardSkills) {
    const weight = skill.required ? 2 : 1;
    total += weight;

    const foundIn = findSkill(skill, sections);
    if (foundIn.length > 0) {
      earned += weight;
      matched.push({ term: skill.term, required: skill.required, foundIn });
    } else {
      missing.push({ term: skill.term, required: skill.required });
    }
  }

  const score = Math.round((earned / total) * 100);
  return { score, matched, missing };
}
