import { describe, it, expect } from "vitest";
import { applyChanges } from "@/features/improve/apply-changes";
import { fixtureResume } from "./fixtures";
import type { Change } from "@/features/improve/schema";

function makeChange(overrides: Partial<Change>): Change {
  return {
    id: "c1",
    path: "experience[0].bullets[0].text",
    kind: "rewrite",
    before: fixtureResume.experience[0].bullets[0].text,
    after: "Rewrote the dashboard end to end.",
    reason: "test",
    linkedFindingId: null,
    accepted: true,
    unverified: false,
    ...overrides,
  };
}

describe("applyChanges", () => {
  it("applies an accepted rewrite at the given path", () => {
    const change = makeChange({});
    const result = applyChanges(fixtureResume, [change]);
    expect(result.experience[0].bullets[0].text).toBe("Rewrote the dashboard end to end.");
  });

  it("excludes rejected changes — original text survives", () => {
    const change = makeChange({ accepted: false });
    const result = applyChanges(fixtureResume, [change]);
    expect(result.experience[0].bullets[0].text).toBe(fixtureResume.experience[0].bullets[0].text);
  });

  it("does not mutate the input resume", () => {
    const originalText = fixtureResume.experience[0].bullets[0].text;
    applyChanges(fixtureResume, [makeChange({})]);
    expect(fixtureResume.experience[0].bullets[0].text).toBe(originalText);
  });

  it("removes a bullet for a remove change", () => {
    const change = makeChange({
      kind: "remove",
      path: "experience[0].bullets[0].text",
      after: "",
    });
    const result = applyChanges(fixtureResume, [change]);
    expect(result.experience[0].bullets).toHaveLength(fixtureResume.experience[0].bullets.length - 1);
  });

  it("reorders bullets for a reorder change", () => {
    const change = makeChange({
      kind: "reorder",
      path: "experience[0].bullets",
      before: "position 0",
      after: "position 2",
    });
    const result = applyChanges(fixtureResume, [change]);
    expect(result.experience[0].bullets[2].id).toBe(fixtureResume.experience[0].bullets[0].id);
  });
});
