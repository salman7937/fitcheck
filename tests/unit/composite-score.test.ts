import { describe, it, expect } from "vitest";
import { compositeScore, scoreBand } from "@/features/analysis/score/index";

describe("compositeScore", () => {
  it("applies the §7 weights exactly", () => {
    const score = compositeScore({
      keywordCoverage: 80,
      experienceMatch: 100,
      atsSafety: 90,
      impactQuality: 60,
    });
    // 0.35*80 + 0.25*100 + 0.20*90 + 0.20*60 = 28 + 25 + 18 + 12 = 83
    expect(score).toBe(83);
  });

  it("is 0 when every sub-score is 0", () => {
    expect(
      compositeScore({ keywordCoverage: 0, experienceMatch: 0, atsSafety: 0, impactQuality: 0 })
    ).toBe(0);
  });

  it("is 100 when every sub-score is 100", () => {
    expect(
      compositeScore({ keywordCoverage: 100, experienceMatch: 100, atsSafety: 100, impactQuality: 100 })
    ).toBe(100);
  });
});

describe("scoreBand", () => {
  it("bands scores per §7", () => {
    expect(scoreBand(0)).toBe("Weak fit");
    expect(scoreBand(49)).toBe("Weak fit");
    expect(scoreBand(50)).toBe("Worth tailoring");
    expect(scoreBand(69)).toBe("Worth tailoring");
    expect(scoreBand(70)).toBe("Strong");
    expect(scoreBand(84)).toBe("Strong");
    expect(scoreBand(85)).toBe("Excellent");
    expect(scoreBand(100)).toBe("Excellent");
  });
});
