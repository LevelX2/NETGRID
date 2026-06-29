import { describe, expect, it } from "vitest";
import {
  REQUIRED_SCORING_CONSUMER_DIMENSIONS,
  SCORING_CONSUMER_DIMENSIONS,
  scoringConsumerDimensionById,
} from "./scoring-consumer-contract";

describe("scoring consumer contract", () => {
  it("defines every required AI-COMPLETE-17 scoring dimension exactly once", () => {
    const ids = SCORING_CONSUMER_DIMENSIONS.map((dimension) => dimension.id);

    expect([...ids].sort()).toEqual(
      [...REQUIRED_SCORING_CONSUMER_DIMENSIONS].sort(),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps each scoring dimension bounded and owned", () => {
    for (const id of REQUIRED_SCORING_CONSUMER_DIMENSIONS) {
      const dimension = scoringConsumerDimensionById(id);

      expect(dimension.owner).toMatch(/\.ts$/);
      expect(dimension.scale.min).toBeLessThanOrEqual(dimension.scale.neutral);
      expect(dimension.scale.neutral).toBeLessThanOrEqual(dimension.scale.max);
      expect(dimension.scale.min).toBeGreaterThanOrEqual(-100);
      expect(dimension.scale.max).toBeLessThanOrEqual(100);
      expect(dimension.evidenceKeys.length).toBeGreaterThan(0);
    }
  });
});
