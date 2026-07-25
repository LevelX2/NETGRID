import { describe, expect, it } from "vitest";

import { createGameAfterSetup, getPlayerView } from "../../index";
import {
  moveRunnerCardToGrip,
  removeEverywhere,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import type { CardInstanceId, GameState } from "@netgrid/shared";

function installRunnerHardware(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  // The compact demo fixture does not carry every enabled card; its instance
  // remains a normal Engine card instance after we select the implemented
  // definition under test.
  const cardId = moveRunnerCardToGrip(state, "simple_decoder");
  removeEverywhere(state, cardId);
  state.runner.rig.hardware.push(cardId);
  state.cardInstances[cardId] = {
    ...state.cardInstances[cardId]!,
    definitionId,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return cardId;
}

function corpQuotes(state: GameState) {
  return getPlayerView(state, "corp").corpCentralAccessQuotes;
}

describe("Corp central access quotes", () => {
  it("projects complete baseline HQ and R&D facts bound to the current state version", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "central-access-baseline" }),
    );
    expect(corpQuotes(state)).toEqual([
      expect.objectContaining({
        serverId: "hq",
        complete: true,
        effectiveAccessCount: 1,
        isMultiaccess: false,
        stateVersion: state.stateVersion,
        sourceDefinitionIds: [],
        serverBoundEffects: [],
      }),
      expect.objectContaining({
        serverId: "rd",
        complete: true,
        effectiveAccessCount: 1,
        isMultiaccess: false,
        stateVersion: state.stateVersion,
        sourceDefinitionIds: [],
        serverBoundEffects: [],
      }),
    ]);
  });

  it("includes HQ Interface as a structured, canonical HQ source", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "central-access-hq-interface" }),
    );
    installRunnerHardware(state, "onr_v1_129_hq-interface");
    expect(
      corpQuotes(state)?.find((quote) => quote.serverId === "hq"),
    ).toMatchObject({
      effectiveAccessCount: 2,
      isMultiaccess: true,
      sourceDefinitionIds: ["onr_v1_129_hq-interface"],
    });
  });

  it("models Highlighter at zero, one, and two counters without double counting", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "central-access-highlighter" }),
    );
    const rd = () =>
      corpQuotes(state)?.find((quote) => quote.serverId === "rd");
    expect(rd()).toMatchObject({
      effectiveAccessCount: 1,
      serverBoundEffects: [],
    });
    state.purgeableRunnerVirusCounters = { corp: { highlighter: 1 } };
    expect(rd()).toMatchObject({
      effectiveAccessCount: 1,
      serverBoundEffects: [
        { id: "corp:highlighter", counterCount: 1, additionalAccessCount: 0 },
      ],
    });
    state.purgeableRunnerVirusCounters = { corp: { highlighter: 2 } };
    expect(rd()).toMatchObject({
      effectiveAccessCount: 2,
      serverBoundEffects: [
        { id: "corp:highlighter", counterCount: 2, additionalAccessCount: 1 },
      ],
    });
  });

  it("combines installed and counter sources in canonical order", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "central-access-combined" }),
    );
    installRunnerHardware(state, "onr_v1_139_r-and-d-interface");
    state.purgeableRunnerVirusCounters = { corp: { highlighter: 3 } };
    expect(
      corpQuotes(state)?.find((quote) => quote.serverId === "rd"),
    ).toMatchObject({
      effectiveAccessCount: 4,
      sourceDefinitionIds: [
        "onr_proteus_090_highlighter",
        "onr_v1_139_r-and-d-interface",
      ],
      serverBoundEffects: [
        {
          id: "corp:highlighter",
          kind: "purgeable_runner_virus_counter_access_modifier",
          serverId: "rd",
          counterKind: "highlighter",
          formula: "per_counter_after_first",
          sourceDefinitionId: "onr_proteus_090_highlighter",
          counterCount: 3,
          additionalAccessCount: 2,
        },
      ],
    });
  });

  it("projects Vienna counters as structured HQ access pressure without card-instance leakage", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "central-access-vienna" }),
    );
    installRunnerHardware(state, "onr_v1_129_hq-interface");
    state.purgeableRunnerVirusCounters = { corp: { vienna: 2 } };
    expect(corpQuotes(state)?.find((quote) => quote.serverId === "hq")).toEqual(
      {
        serverId: "hq",
        stateVersion: state.stateVersion,
        complete: true,
        effectiveAccessCount: 4,
        isMultiaccess: true,
        sourceDefinitionIds: [
          "onr_proteus_098_vienna-22",
          "onr_v1_129_hq-interface",
        ],
        serverBoundEffects: [
          {
            id: "corp:vienna",
            kind: "purgeable_runner_virus_counter_access_modifier",
            serverId: "hq",
            counterKind: "vienna",
            formula: "per_counter",
            sourceDefinitionId: "onr_proteus_098_vienna-22",
            counterCount: 2,
            additionalAccessCount: 2,
          },
        ],
      },
    );
  });

  it("keeps the contract Corp-only and fails closed for inconsistent internal counter facts", () => {
    const state = toRunnerTurn(
      createGameAfterSetup({ seed: "central-access-private" }),
    );
    installRunnerHardware(state, "onr_v1_129_hq-interface");
    const runnerView = getPlayerView(state, "runner");
    expect(runnerView).not.toHaveProperty("corpCentralAccessQuotes");
    expect(JSON.stringify(runnerView)).not.toContain("corpCentralAccessQuotes");
    state.purgeableRunnerVirusCounters = { corp: { highlighter: -1 } };
    expect(corpQuotes(state)).toBeUndefined();
  });
});
