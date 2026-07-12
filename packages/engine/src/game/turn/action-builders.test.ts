import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import { buildLegalAction, makeActionId } from "./action-builders";

describe("turn action builders", () => {
  it("builds stable basic main actions without index.ts helpers", () => {
    const state = createGame({
      seed: "arch-2-turn-action-builder",
      setupMode: "completed",
    });

    expect(
      buildLegalAction(
        state,
        "corp",
        "gain_credit",
        "1 Credit nehmen",
        "basic_action",
        [{ clicks: 1 }],
      ),
    ).toMatchObject({
      actionId: "corp.gain_credit",
      side: "corp",
      type: "gain_credit",
      label: "1 Credit nehmen",
      source: "basic_action",
      timingPoint: state.timingPoint,
      costs: [{ clicks: 1 }],
      targetRequirements: [],
      visibility: "private_to_actor",
      expiresAtStateVersion: state.stateVersion,
    });
  });

  it("keeps payload-bearing action IDs stable", () => {
    expect(
      makeActionId(
        "start_run",
        "runner",
        { serverId: "rd", runStartTaxCredits: 2 },
        "basic_action",
      ),
    ).toBe("runner.start_run.rd");
  });

  it("distinguishes a bonus run from a normal run on the same server", () => {
    const normalRun = makeActionId(
      "start_run",
      "runner",
      { serverId: "rd", runStartTaxCredits: 0 },
      "basic_action",
    );
    const bonusRun = makeActionId(
      "start_run",
      "runner",
      {
        serverId: "rd",
        runStartTaxCredits: 0,
        bonusRunNoClick: true,
        bonusRunSource: "onr_v1_123_bodyweight-data-creche",
      },
      "basic_action",
    );

    expect(normalRun).toBe("runner.start_run.rd");
    expect(bonusRun).toBe(
      "runner.start_run.rd.bonus_run.onr_v1_123_bodyweight-data-creche",
    );
    expect(bonusRun).not.toBe(normalRun);
  });
});
