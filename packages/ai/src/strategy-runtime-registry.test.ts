import { describe, expect, it } from "vitest";
import strategyGoals from "../../../data/ai/strategy-goals-v1.json";
import {
  STRATEGY_RUNTIME_FAMILY_BY_ID,
  strategicFamilyForStrategyId,
} from "./strategy-runtime-registry";

describe("strategy runtime registry", () => {
  it("covers every strategy goal with a non-unknown runtime family", () => {
    const taxonomyIds = strategyGoals.strategyGoals
      .map((goal) => goal.strategyId)
      .sort();
    const registryIds = Object.keys(STRATEGY_RUNTIME_FAMILY_BY_ID).sort();

    expect(registryIds).toEqual(taxonomyIds);
    expect(
      taxonomyIds.filter(
        (strategyId) => strategicFamilyForStrategyId(strategyId) === "unknown",
      ),
    ).toEqual([]);
  });

  it("keeps unknown external ids explicitly unknown", () => {
    expect(strategicFamilyForStrategyId("corp.not_registered")).toBe("unknown");
  });
});
