import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import {
  buildRunnerEndTurnAction,
  buildRunnerGainCreditAction,
  buildRunnerRemoveTagAction,
} from "./runner-basic-actions";

describe("runner basic main actions", () => {
  it("builds the Runner gain-credit action with stable ID, costs and visibility", () => {
    const state = createGame({
      seed: "arch-4-runner-gain-credit",
      setupMode: "completed",
    });

    expect(buildRunnerGainCreditAction(state)).toMatchObject({
      actionId: "runner.gain_credit",
      side: "runner",
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

  it("builds the Runner end-turn action without payload", () => {
    const state = createGame({
      seed: "arch-4-runner-end-turn",
      setupMode: "completed",
    });

    const endTurnAction = buildRunnerEndTurnAction(state);

    expect(endTurnAction).toMatchObject({
      actionId: "runner.end_turn",
      side: "runner",
      type: "end_turn",
      label: "Zug beenden",
      source: "game_rule",
      costs: [],
      targetRequirements: [],
      visibility: "private_to_actor",
    });
    expect(endTurnAction).not.toHaveProperty("payload");
  });

  it("builds the Runner remove-tag action with stable costs and no payload", () => {
    const state = createGame({
      seed: "arch-4-runner-remove-tag",
      setupMode: "completed",
    });

    const removeTagAction = buildRunnerRemoveTagAction(state);

    expect(removeTagAction).toMatchObject({
      actionId: "runner.remove_tag",
      side: "runner",
      type: "remove_tag",
      label: "Tag entfernen",
      source: "basic_action",
      costs: [{ clicks: 1, credits: 2 }],
      targetRequirements: [],
      visibility: "private_to_actor",
    });
    expect(removeTagAction).not.toHaveProperty("payload");
  });
});
