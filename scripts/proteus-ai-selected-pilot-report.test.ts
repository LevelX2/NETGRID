import { describe, expect, it } from "vitest";
import { proteusPilotTerminationTotals } from "./proteus-ai-selected-pilot-report";

describe("Proteus selected pilot report", () => {
  it("counts every simulation termination kind from the persisted game rows", () => {
    expect(
      proteusPilotTerminationTotals([
        { terminationKind: "game_result" },
        { terminationKind: "game_result" },
        { terminationKind: "action_limit" },
        { terminationKind: "runtime_failure" },
      ]),
    ).toEqual({
      completedGames: 2,
      actionLimitGames: 1,
      runtimeFailureGames: 1,
    });
  });
});
