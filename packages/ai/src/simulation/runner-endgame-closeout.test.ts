import { describe, expect, it } from "vitest";
import {
  isCorpEndgameStallSymptom,
  isEndgameKnownInfoTaken,
  isEndgameProtectionAction,
  isEndgameScoreOrStealPressureAction,
  isRunnerEndgameMeaningfulRunTaken,
  isEndgameSetupOrEconomyAction,
} from "./runner-endgame-closeout";

describe("runner endgame closeout", () => {
  it("uses the actual run start across event, choice and basic actions", () => {
    const evidence = { side: "runner", hqRunBoostedBecauseKnownAgenda: true };
    for (const actionType of ["play_event", "resolve_choice", "start_run"]) {
      const started = {
        ...evidence,
        actionType,
        runnerRunStarted: true as const,
      };
      expect(isRunnerEndgameMeaningfulRunTaken(started)).toBe(true);
      expect(isEndgameKnownInfoTaken(started)).toBe(true);
      expect(isEndgameScoreOrStealPressureAction(started)).toBe(true);
      expect(
        isRunnerEndgameMeaningfulRunTaken({ ...evidence, actionType }),
      ).toBe(false);
    }

    expect(
      isRunnerEndgameMeaningfulRunTaken({
        side: "runner",
        actionType: "steal_agenda",
      }),
    ).toBe(false);
  });

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
