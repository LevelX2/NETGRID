import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import {
  buildCorpDrawAction,
  buildCorpEndTurnAction,
  buildCorpGainCreditAction,
  buildCorpPurgeVirusAction,
} from "./corp-basic-actions";

describe("corp basic main actions", () => {
  it("builds the Corp gain-credit action with stable ID, costs and visibility", () => {
    const state = createGame({
      seed: "arch-3-corp-gain-credit",
      setupMode: "completed",
    });

    expect(buildCorpGainCreditAction(state)).toMatchObject({
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

  it("builds the Corp draw and end-turn actions without payloads", () => {
    const state = createGame({
      seed: "arch-3-corp-draw-end",
      setupMode: "completed",
    });

    const drawAction = buildCorpDrawAction(state);
    const endTurnAction = buildCorpEndTurnAction(state);

    expect(drawAction).toMatchObject({
      actionId: "corp.draw_card",
      type: "draw_card",
      costs: [{ clicks: 1 }],
    });
    expect(drawAction).not.toHaveProperty("payload");
    expect(endTurnAction).toMatchObject({
      actionId: "corp.end_turn",
      type: "end_turn",
      source: "game_rule",
      costs: [],
    });
    expect(endTurnAction).not.toHaveProperty("payload");
  });

  it("builds the Corp purge-virus action with stable payload and target requirements", () => {
    const state = createGame({
      seed: "arch-3-corp-purge-virus",
      setupMode: "completed",
    });

    expect(buildCorpPurgeVirusAction(state)).toMatchObject({
      actionId: "corp.purge_virus_counters",
      side: "corp",
      type: "purge_virus_counters",
      label: "Virus-Counter purgen",
      source: "basic_action",
      costs: [{ clicks: 3 }],
      payload: { purgedCounterType: "virus" },
      targetRequirements: [],
      visibility: "private_to_actor",
    });
  });
});
