import { describe, it, expect } from "vitest";
import { diff } from "@/features/improve/diff";
import { fixtureResume } from "./fixtures";
import type { Resume } from "@/features/resume/schema";

describe("diff", () => {
  it("produces a reorder change, not a rewrite, when bullet order changes with text unchanged", () => {
    const before: Resume = fixtureResume;
    const after: Resume = {
      ...fixtureResume,
      experience: [
        {
          ...fixtureResume.experience[0],
          bullets: [...fixtureResume.experience[0].bullets].reverse(),
        },
        fixtureResume.experience[1],
      ],
    };

    const changes = diff(before, after);
    const reorderChanges = changes.filter((c) => c.kind === "reorder");
    const rewriteChanges = changes.filter((c) => c.kind === "rewrite");

    expect(reorderChanges.length).toBeGreaterThan(0);
    // no bullet text actually changed, so nothing should be classified as a rewrite
    expect(rewriteChanges.length).toBe(0);
  });

  it("produces a rewrite change when a bullet's text changes at the same position", () => {
    const before: Resume = fixtureResume;
    const after: Resume = {
      ...fixtureResume,
      experience: [
        {
          ...fixtureResume.experience[0],
          bullets: [
            { ...fixtureResume.experience[0].bullets[0], text: "Rewrote the whole dashboard." },
            ...fixtureResume.experience[0].bullets.slice(1),
          ],
        },
        fixtureResume.experience[1],
      ],
    };

    const changes = diff(before, after);
    const rewriteChanges = changes.filter((c) => c.kind === "rewrite");
    expect(rewriteChanges).toHaveLength(1);
    expect(rewriteChanges[0].after).toBe("Rewrote the whole dashboard.");
  });

  it("produces a remove change when a bullet disappears", () => {
    const before: Resume = fixtureResume;
    const after: Resume = {
      ...fixtureResume,
      experience: [
        { ...fixtureResume.experience[0], bullets: fixtureResume.experience[0].bullets.slice(1) },
        fixtureResume.experience[1],
      ],
    };

    const changes = diff(before, after);
    const removeChanges = changes.filter((c) => c.kind === "remove");
    expect(removeChanges).toHaveLength(1);
    expect(removeChanges[0].before).toBe(fixtureResume.experience[0].bullets[0].text);
  });
});
