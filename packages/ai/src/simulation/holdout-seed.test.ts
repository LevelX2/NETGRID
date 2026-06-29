import { describe, expect, it } from "vitest";

import { isHoldoutSeed } from "./holdout-seed";

describe("isHoldoutSeed", () => {
  it("matches holdout seeds exactly", () => {
    expect(isHoldoutSeed("holdout-10", ["holdout-10"])).toBe(true);
    expect(isHoldoutSeed("holdout-1", ["holdout-10"])).toBe(false);
  });
});
