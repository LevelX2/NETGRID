import { describe, expect, it } from "vitest";
import { normalizedRunTargetGuidanceValue } from "./runner-run-target-guidance-score";

describe("runner run-target guidance score", () => {
  it("normalizes raw run-target guidance into the AI-COMPLETE-17 consumer scale", () => {
    expect(normalizedRunTargetGuidanceValue(0)).toBe(0);
    expect(normalizedRunTargetGuidanceValue(-900)).toBe(-18);
    expect(normalizedRunTargetGuidanceValue(-2100)).toBe(-42);
    expect(normalizedRunTargetGuidanceValue(-5000)).toBe(-100);
    expect(normalizedRunTargetGuidanceValue(7500)).toBe(100);
  });
});
