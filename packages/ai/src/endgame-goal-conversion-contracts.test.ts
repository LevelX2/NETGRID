import { describe, expect, it } from "vitest";
import {
  ENDGAME_GOAL_CONVERSION_CONTRACTS,
  classifyEndgameGoalConversion,
  endgameGoalConversionContract,
} from "./endgame-goal-conversion-contracts";

describe("endgame goal conversion contracts", () => {
  it("defines the six read-only endgame contracts", () => {
    expect(ENDGAME_GOAL_CONVERSION_CONTRACTS.map((contract) => contract.id)).toEqual([
      "runner.fix_coverage",
      "runner.convert_reachability_to_access",
      "runner.find_payoff",
      "corp.convert_economy_to_scoreline",
      "corp.protect_scoreline",
      "corp.convert_tag_to_punish",
    ]);
  });

  it("classifies missing target context before payoff blockers", () => {
    expect(
      classifyEndgameGoalConversion({
        contractId: "corp.convert_tag_to_punish",
        staleCount: 8,
        hasLegalAlternative: true,
        targetContextComplete: false,
        payoffVisible: false,
      }),
    ).toMatchObject({
      status: "stale_without_conversion",
      blockerCategory: "missing_target_context",
    });
  });

  it("keeps below-threshold observations out of stale conversion fixes", () => {
    expect(
      classifyEndgameGoalConversion({
        contractId: "runner.convert_reachability_to_access",
        staleCount: endgameGoalConversionContract("runner.convert_reachability_to_access").staleThreshold - 1,
      }),
    ).toMatchObject({
      status: "conversion_observed",
    });
  });
});
