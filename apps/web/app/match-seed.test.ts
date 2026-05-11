import { describe, expect, it, vi } from "vitest";
import { createMatchSeed, LEGACY_DEFAULT_MATCH_SEED, normalizeMatchSeed } from "./match-seed";

describe("match seed helpers", () => {
  it("creates a readable fresh match seed", () => {
    expect(createMatchSeed({ now: 1_700_000_000_000, randomPart: "abc123" })).toBe("match-loyw3v28-abc123");
  });

  it("keeps explicit custom seeds", () => {
    expect(normalizeMatchSeed("  custom-seed  ")).toBe("custom-seed");
  });

  it("replaces blank and legacy demo seeds with fresh seeds", () => {
    vi.spyOn(globalThis.Date, "now").mockReturnValue(1_700_000_000_000);
    vi.spyOn(globalThis.Math, "random").mockReturnValue(0.123456789);

    expect(normalizeMatchSeed("")).toMatch(/^match-loyw3v28-/);
    expect(normalizeMatchSeed(LEGACY_DEFAULT_MATCH_SEED)).toMatch(/^match-loyw3v28-/);
  });
});
