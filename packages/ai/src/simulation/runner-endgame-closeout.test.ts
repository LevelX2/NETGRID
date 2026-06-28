import { describe, expect, it } from "vitest";
import {
  isCorpEndgameStallSymptom,
  isEndgameProtectionAction,
  isEndgameSetupOrEconomyAction,
} from "./runner-endgame-closeout";

describe("runner endgame closeout plan kinds", () => {
  it("matches endgame plan kinds by bounded terms", () => {
    expect(
      isEndgameSetupOrEconomyAction(entry(), {
        planKind: "economy_plan",
        runnerEconomyProgressAction: false,
        runnerSetupAction: false,
      }),
    ).toBe(true);
    expect(
      isEndgameSetupOrEconomyAction(entry(), {
        planKind: "microeconomy_noise",
        runnerEconomyProgressAction: false,
        runnerSetupAction: false,
      }),
    ).toBe(false);

    expect(isEndgameProtectionAction(corpEntry(), "protect_remote")).toBe(true);
    expect(isEndgameProtectionAction(corpEntry(), "protector_noise")).toBe(
      false,
    );

    expect(
      isCorpEndgameStallSymptom(corpEntry(), {
        planKind: "remote_build",
        meaningfulBoardProgress: false,
      }),
    ).toBe(true);
    expect(
      isCorpEndgameStallSymptom(corpEntry(), {
        planKind: "remote_builder_noise",
        meaningfulBoardProgress: false,
      }),
    ).toBe(false);
  });
});

function entry() {
  return {
    side: "runner",
    actionType: "play_event",
  };
}

function corpEntry() {
  return {
    side: "corp",
    actionType: "play_operation",
  };
}
