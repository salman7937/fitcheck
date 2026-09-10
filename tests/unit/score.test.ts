import { describe, it, expect } from "vitest";
import { keywordCoverage } from "@/features/analysis/score/keyword-coverage";
import { experienceMatch, totalExperienceMonths } from "@/features/analysis/score/experience-match";
import { atsSafety } from "@/features/analysis/score/ats-safety";
import { fixtureResume, fixtureJobDescription, fixtureReferenceDate } from "./fixtures";
import type { Resume } from "@/features/resume/schema";
import type { JobDescription } from "@/features/job-description/schema";

describe("keywordCoverage", () => {
  it("weighs required skills 2x and optional 1x, alias-aware", () => {
    // required: TypeScript(2) + React(2) + GraphQL(2) = 6, optional: Docker(1) = 1, total = 7
    // matched: TypeScript, React (both in resume skills) = 4 earned
    const result = keywordCoverage(fixtureResume, fixtureJobDescription);
    expect(result.score).toBe(57); // round(4/7 * 100)
    expect(result.matched.map((m) => m.term).sort()).toEqual(["React", "TypeScript"]);
    expect(result.missing.map((m) => m.term).sort()).toEqual(["Docker", "GraphQL"]);
  });

  it("is case-insensitive and word-boundary matched", () => {
    const resume: Resume = {
      ...fixtureResume,
      skills: [{ category: "Languages", items: ["typescript"] }],
    };
    const jd: JobDescription = {
      ...fixtureJobDescription,
      hardSkills: [{ term: "TypeScript", aliases: [], required: true }],
    };
    const result = keywordCoverage(resume, jd);
    expect(result.score).toBe(100);
  });

  it("does not false-positive match on partial words", () => {
    const resume: Resume = {
      ...fixtureResume,
      skills: [{ category: "Languages", items: ["JavaScript"] }],
    };
    const jd: JobDescription = {
      ...fixtureJobDescription,
      hardSkills: [{ term: "Java", aliases: [], required: true }],
    };
    const result = keywordCoverage(resume, jd);
    expect(result.score).toBe(0); // "Java" must not match inside "JavaScript"
  });

  it("matches via aliases", () => {
    const resume: Resume = {
      ...fixtureResume,
      skills: [{ category: "Tools", items: ["Postgres"] }],
    };
    const jd: JobDescription = {
      ...fixtureJobDescription,
      hardSkills: [{ term: "PostgreSQL", aliases: ["Postgres"], required: true }],
    };
    const result = keywordCoverage(resume, jd);
    expect(result.score).toBe(100);
  });

  it("returns full marks when the JD has no hard skills", () => {
    const jd: JobDescription = { ...fixtureJobDescription, hardSkills: [] };
    const result = keywordCoverage(fixtureResume, jd);
    expect(result.score).toBe(100);
  });
});

describe("experienceMatch", () => {
  it("computes total months across experience entries, treating null end as the reference date", () => {
    // exp-1: 2022-01 -> 2026-01 (reference) = 48 months
    // exp-2: 2019-01 -> 2022-01 = 36 months
    expect(totalExperienceMonths(fixtureResume, fixtureReferenceDate)).toBe(84);
  });

  it("gives full marks when actual months meet or exceed the requirement", () => {
    // 84 months actual >= 60 months required (5 years)
    expect(experienceMatch(fixtureResume, fixtureJobDescription, fixtureReferenceDate)).toBe(100);
  });

  it("falls off linearly below the requirement, floored at 20", () => {
    const jd: JobDescription = { ...fixtureJobDescription, yearsRequired: 14 }; // 168 months required
    // actual 84 / required 168 = 0.5 -> 20 + 0.5*80 = 60
    expect(experienceMatch(fixtureResume, jd, fixtureReferenceDate)).toBe(60);
  });

  it("floors at 20 for zero experience against a real requirement", () => {
    const resume: Resume = { ...fixtureResume, experience: [] };
    const jd: JobDescription = { ...fixtureJobDescription, yearsRequired: 5 };
    expect(experienceMatch(resume, jd, fixtureReferenceDate)).toBe(20);
  });

  it("gives full marks when the JD states no years requirement", () => {
    const jd: JobDescription = { ...fixtureJobDescription, yearsRequired: null };
    expect(experienceMatch(fixtureResume, jd, fixtureReferenceDate)).toBe(100);
  });
});

describe("atsSafety", () => {
  it("scores 100 for a clean resume", () => {
    expect(atsSafety(fixtureResume)).toBe(100);
  });

  it("penalizes a missing email and phone", () => {
    const resume: Resume = {
      ...fixtureResume,
      basics: { ...fixtureResume.basics, email: undefined, phone: undefined },
    };
    expect(atsSafety(resume)).toBe(75); // 100 - 15 - 10
  });

  it("penalizes a role with no start date", () => {
    const resume: Resume = {
      ...fixtureResume,
      experience: [{ ...fixtureResume.experience[0], start: "" }, fixtureResume.experience[1]],
    };
    expect(atsSafety(resume)).toBe(90); // 100 - 10
  });

  it("penalizes fewer than 3 bullets on the most recent role", () => {
    const resume: Resume = {
      ...fixtureResume,
      experience: [
        { ...fixtureResume.experience[0], bullets: fixtureResume.experience[0].bullets.slice(0, 2) },
        fixtureResume.experience[1],
      ],
    };
    expect(atsSafety(resume)).toBe(85); // 100 - 15
  });

  it("penalizes an empty skills section", () => {
    const resume: Resume = { ...fixtureResume, skills: [] };
    expect(atsSafety(resume)).toBe(85); // 100 - 15
  });

  it("penalizes an overlong summary", () => {
    const resume: Resume = { ...fixtureResume, summary: "x".repeat(601) };
    expect(atsSafety(resume)).toBe(90); // 100 - 10
  });

  it("never drops below 0", () => {
    const resume: Resume = {
      ...fixtureResume,
      basics: { ...fixtureResume.basics, email: undefined, phone: undefined },
      experience: [],
      skills: [],
      summary: "x".repeat(601),
    };
    expect(atsSafety(resume)).toBeGreaterThanOrEqual(0);
  });
});
