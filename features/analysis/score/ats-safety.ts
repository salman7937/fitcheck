import type { Resume } from "@/features/resume/schema";

const MAX_BULLET_LENGTH = 320;
const MAX_SUMMARY_LENGTH = 600;
const MIN_RECENT_ROLE_BULLETS = 3;

const PENALTIES = {
  missingEmail: 15,
  missingPhone: 10,
  roleMissingDate: 10,
  overlongBullet: 5,
  thinRecentRole: 15,
  emptySkillsSection: 15,
  overlongSummary: 10,
};

/**
 * Deterministic rule-based ATS safety score, 0-100.
 * Assumes `experience[0]` is the most recent role (reverse-chronological CV convention).
 */
export function atsSafety(resume: Resume): number {
  let score = 100;

  if (!resume.basics.email) score -= PENALTIES.missingEmail;
  if (!resume.basics.phone) score -= PENALTIES.missingPhone;

  for (const exp of resume.experience) {
    if (!exp.start || exp.start.trim() === "") {
      score -= PENALTIES.roleMissingDate;
    }
  }

  const allBullets = [
    ...resume.experience.flatMap((e) => e.bullets),
    ...resume.projects.flatMap((p) => p.bullets),
  ];
  for (const bullet of allBullets) {
    if (bullet.text.length > MAX_BULLET_LENGTH) {
      score -= PENALTIES.overlongBullet;
    }
  }

  const mostRecentRole = resume.experience[0];
  if (mostRecentRole && mostRecentRole.bullets.length < MIN_RECENT_ROLE_BULLETS) {
    score -= PENALTIES.thinRecentRole;
  }

  const hasAnySkills = resume.skills.some((group) => group.items.length > 0);
  if (resume.skills.length === 0 || !hasAnySkills) {
    score -= PENALTIES.emptySkillsSection;
  }

  if (resume.summary && resume.summary.length > MAX_SUMMARY_LENGTH) {
    score -= PENALTIES.overlongSummary;
  }

  return Math.max(0, Math.min(100, score));
}
