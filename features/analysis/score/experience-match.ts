import type { Resume } from "@/features/resume/schema";
import type { JobDescription } from "@/features/job-description/schema";

const FLOOR = 20;

/** Parses "2023-04" or "2023" into a Date at the first of that month/year. */
function parseDate(value: string): Date | null {
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (monthMatch) {
    return new Date(Number(monthMatch[1]), Number(monthMatch[2]) - 1, 1);
  }

  const yearMatch = /^(\d{4})$/.exec(value.trim());
  if (yearMatch) {
    return new Date(Number(yearMatch[1]), 0, 1);
  }

  return null;
}

function monthsBetween(start: Date, end: Date): number {
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  return Math.max(0, months);
}

/**
 * Total months of experience across all `experience[]` entries.
 * `referenceDate` stands in for "now" for open-ended ("Present") roles —
 * defaults to the real current date, overridable for deterministic tests.
 */
export function totalExperienceMonths(
  resume: Resume,
  referenceDate: Date = new Date()
): number {
  let total = 0;

  for (const exp of resume.experience) {
    const start = parseDate(exp.start);
    if (!start) continue;

    const end = exp.end ? parseDate(exp.end) ?? referenceDate : referenceDate;
    total += monthsBetween(start, end);
  }

  return total;
}

/**
 * Full marks at or above `yearsRequired`, linear falloff below, floor at 20.
 * If the JD states no requirement, this sub-score is full marks.
 */
export function experienceMatch(
  resume: Resume,
  jd: JobDescription,
  referenceDate: Date = new Date()
): number {
  if (jd.yearsRequired === null || jd.yearsRequired <= 0) {
    return 100;
  }

  const requiredMonths = jd.yearsRequired * 12;
  const actualMonths = totalExperienceMonths(resume, referenceDate);

  if (actualMonths >= requiredMonths) {
    return 100;
  }

  const ratio = actualMonths / requiredMonths;
  const score = Math.round(FLOOR + ratio * (100 - FLOOR));
  return Math.max(FLOOR, score);
}
