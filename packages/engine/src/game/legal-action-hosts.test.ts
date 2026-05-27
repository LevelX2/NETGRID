import type { ChoiceRequest, GameState, LegalAction } from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { buildLegalActions, getLegalActions } from "./legal-actions";
import {
  configureLegalActionHostComposition,
  createLegalActionHostComposition,
  type LegalActionHostCompositionHost,
} from "./legal-action-hosts";

function state(): GameState {
  return {
    matchId: "match_1",
    stateVersion: 4,
    activeSide: "corp",
    phase: "corp_draw",
    timingPoint: "corp_draw.mandatory_draw",
    baseline: { engineSchemaVersion: "0.99.0" },
    runner: {
      credits: 5,
      clicks: 4,
      tags: 0,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      identity: "runner_identity",
      rig: { programs: [], hardware: [], resources: [] },
    },
    corp: {
      credits: 5,
      clicks: 3,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity",
      servers: [],
    },
    cardInstances: {},
    eventLog: [],
    randomCounter: 0,
  } as unknown as GameState;
}

function legalAction(type: LegalAction["type"]): LegalAction {
  return {
    actionId: `test.${type}`,
    type,
    label: type,
    side: "corp",
    source: "game_rule",
    stateVersion: 4,
    timingPoint: "corp_draw.mandatory_draw",
    costs: [],
    payload: {},
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 5,
  } as unknown as LegalAction;
}

function hostFor(calls: string[] = []): LegalActionHostCompositionHost {
  const unusedHost = () => {
    throw new Error("unexpected host access");
  };
  return {
    actions: {
      buildChoiceAction: (_state: GameState, choice: ChoiceRequest) => {
        calls.push(`choice:${choice.choiceId}`);
        return legalAction("resolve_choice");
      },
      corpRunnerActionPaidWindowActions: () => {
        calls.push("paidWindow");
        return [];
      },
    },
    counters: {
      corpActionDebtPending: () => 2,
      purgeableRunnerVirusCounterTotal: () => 3,
    },
    hosts: {
      corpMainActionGenerationHost: unusedHost,
      runnerMainActionGenerationHost: unusedHost,
      runnerEncounterActionHost: unusedHost,
      encounterEntryHost: unusedHost,
      runRezWindowHost: unusedHost,
      runCardImplementationActionHost: unusedHost,
      runnerAccessActionHost: unusedHost,
    },
  } as unknown as LegalActionHostCompositionHost;
}

describe("legal-action-hosts", () => {
  it("does not import from index or contain public/player-view wiring", () => {
    const source = readFileSync(
      new URL("./legal-action-hosts.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("PlayerView");
    expect(source).not.toContain("publicContext");
  });

  it("creates the same mandatory draw legal action shape", () => {
    const composition = createLegalActionHostComposition(hostFor());
    const action = composition
      .legalActionGenerationHost(state())
      .actions.buildMandatoryDrawAction();

    expect(action).toMatchObject({
      actionId: "corp.mandatory_draw",
      type: "mandatory_draw",
      side: "corp",
      label: "Korp Pflichtkarte ziehen",
      timingPoint: "corp_draw.mandatory_draw",
    });
  });

  it("delegates pending choice action generation without resolving choices", () => {
    const calls: string[] = [];
    const currentState = {
      ...state(),
      pendingChoice: {
        choiceId: "choice_1",
        side: "runner",
        kind: "select_cards",
        source: "test",
        prompt: "Choose",
        options: [],
        minSelections: 0,
        maxSelections: 1,
        stateVersion: 4,
        visibility: "private_to_side",
      } as ChoiceRequest,
    } as GameState;
    const composition = createLegalActionHostComposition(hostFor(calls));

    const actions = buildLegalActions(
      composition.legalActionGenerationHost(currentState),
      "runner",
    );

    expect(actions).toHaveLength(1);
    expect(actions[0]?.type).toBe("resolve_choice");
    expect(calls).toEqual(["choice:choice_1"]);
  });

  it("keeps purge and action-debt helper payloads stable", () => {
    const currentState = {
      ...state(),
      runnerVirusPurgeWindow: {
        windowId: "purge_window_1",
        timingFamily: "corp_start_of_turn_between_effects",
      },
    } as unknown as GameState;
    const composition = createLegalActionHostComposition(hostFor());

    expect(
      composition.buildPurgeableRunnerVirusPurgeAction(currentState).payload,
    ).toMatchObject({
      purgeModel: "future_action_debt",
      actionDebtAdded: 3,
      timingWindowId: "purge_window_1",
      timingFamily: "corp_start_of_turn_between_effects",
    });
    expect(composition.buildCorpForgoActionDebtAction(currentState)).toMatchObject({
      type: "forgo_action",
      costs: [{ clicks: 1 }],
      payload: {
        actionDebtPaid: 1,
        corpActionDebtTotalBefore: 2,
      },
    });
  });

  it("configures the LegalActions facade with the generated host", () => {
    configureLegalActionHostComposition(hostFor());

    expect(getLegalActions(state(), "corp").map((action) => action.type)).toEqual([
      "mandatory_draw",
    ]);
  });

  it("fails clearly when a required host group is missing", () => {
    expect(() =>
      createLegalActionHostComposition({
        ...hostFor(),
        actions: undefined,
      } as unknown as LegalActionHostCompositionHost),
    ).toThrow("LegalActionHostCompositionHost.actions ist erforderlich.");
  });
});
