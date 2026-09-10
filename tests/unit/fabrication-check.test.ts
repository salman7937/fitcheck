import { describe, it, expect } from "vitest";
import { applyFabricationCheck } from "@/features/improve/fabrication-check";
import { fixtureResume } from "./fixtures";
import type { Change } from "@/features/improve/schema";

function makeChange(overrides: Partial<Change>): Change {
  return {
    id: "c1",
    path: "experience[0].bullets[0].text",
    kind: "rewrite",
    before: fixtureResume.experience[0].bullets[0].text,
    after: "Rewrote the dashboard.",
    reason: "test",
    linkedFindingId: null,
    accepted: true,
    unverified: false,
    ...overrides,
  };
}

describe("applyFabricationCheck", () => {
  it("flags a change that injects an unsourced technology term", () => {
    const change = makeChange({ after: "Led the migration to Kubernetes." });
    const [result] = applyFabricationCheck(fixtureResume, [change]);
    expect(result.unverified).toBe(true);
    expect(result.accepted).toBe(false);
  });

  it("does not flag a rewrite using only words already in the source resume", () => {
    const change = makeChange({
      after: "Led migration of the dashboard to TypeScript.",
    });
    const [result] = applyFabricationCheck(fixtureResume, [change]);
    expect(result.unverified).toBe(false);
    expect(result.accepted).toBe(true);
  });

  it("does not flag common resume verbs absent from the exact before text", () => {
    const change = makeChange({ after: "Streamlined the dashboard migration to TypeScript." });
    const [result] = applyFabricationCheck(fixtureResume, [change]);
    expect(result.unverified).toBe(false);
  });

  it("does not flag a term that exists elsewhere in the resume (not just this bullet)", () => {
    // "React" appears in fixtureResume.skills, not in this specific bullet's `before`
    const change = makeChange({ after: "Built the dashboard with React." });
    const [result] = applyFabricationCheck(fixtureResume, [change]);
    expect(result.unverified).toBe(false);
  });
});
