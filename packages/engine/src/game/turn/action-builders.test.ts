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
});
