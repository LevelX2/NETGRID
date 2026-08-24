import { describe, expect, it } from "vitest";
import {
  counterAmountMeetsThreshold,
  counterThresholdDeactivated,
} from "./counter-thresholds";

describe("counter thresholds", () => {
  it("keeps an effect active while the remaining amount still meets its threshold", () => {
    expect(counterAmountMeetsThreshold(2, 2)).toBe(true);
    expect(counterAmountMeetsThreshold(1, 2)).toBe(false);
    expect(counterThresholdDeactivated(3, 2, 2)).toBe(false);
    expect(counterThresholdDeactivated(2, 1, 2)).toBe(true);
  });
});
