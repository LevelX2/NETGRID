import type { GameState, LegalAction, PlayerAction } from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { configureApplyActionCoreHost } from "../apply-action";
import {
  configureBuildEventHost,
  type BuildEventHost,
} from "../events/build-event";
import {
  configureApplyActionHostComposition,
  createApplyActionHostComposition,
  type ApplyActionHostCompositionHost,
} from "./apply-action-hosts";

function state(): GameState {
  return {
    matchId: "match_1",
    stateVersion: 1,
    activeSide: "corp",
    phase: "corp_action_phase",
    timingPoint: "corp_action.main",
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
    stateVersion: 1,
    timingPoint: "corp_action.main",
    costs: [],
    payload: {},
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
  } as unknown as LegalAction;
}

function playerAction(actionId = "test.action"): PlayerAction {
  return {
    actionId,
    side: "corp",
    matchId: "match_1",
    clientKnownStateVersion: 1,
  } as PlayerAction;
}

function hostFor(calls: string[]): ApplyActionHostCompositionHost {
  const stateHost = (targetState: GameState) =>
    ({ state: targetState }) as never;
  return {
    perform: {
      turn: {
        turnBasicExecutionHost: (targetState) => {
          calls.push("turn");
          return stateHost(targetState);
        },
      },
      economy: { creditEconomyExecutionHost: stateHost },
      abilities: { triggerAbilityExecutionHost: stateHost },
      cardImplementation: {
        activatedCardImplementationExecutionHost: stateHost,
      },
      play: { playCardExecutionHost: stateHost },
      install: { installCardHost: stateHost },
      board: { boardStateActionExecutionHost: stateHost },
      corp: { scoredAgendaFlowHost: stateHost },
      run: {
        startRunActionExecutionHost: stateHost,
        runMovementHostForState: stateHost,
        runnerBreakerActionExecutionHost: stateHost,
        continueRun: () => calls.push("continueRun"),
      },
      rez: { rezActionExecutionHost: stateHost },
      access: { accessFlowHost: stateHost },
      choices: { pendingChoiceResolutionHost: stateHost },
    },
  };
}

function eventHost(): BuildEventHost {
  return {
    publicContext: {
      publicContextForAction: vi.fn(() => ({})),
      deps: {} as never,
    },
    constants: {
      badPublicityLossThreshold: 7,
    },
  };
}

describe("apply-action-hosts", () => {
  it("does not import from index or contain public context field logic", () => {
    const source = readFileSync(
      new URL("./apply-action-hosts.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("onr_v1_");
    expect(source).not.toContain("sourceDefinitionId");
  });

  it("creates an ApplyActionCoreHost backed by the perform-action executor", () => {
    const calls: string[] = [];
    const composition = createApplyActionHostComposition(hostFor(calls));
    const currentState = state();
    const action = legalAction("unsupported_action" as LegalAction["type"]);

    composition.applyActionCoreHost.actions.performAction(
      currentState,
      action,
      playerAction(action.actionId),
    );

    expect(composition.applyActionCoreHost.actions.performAction).toBe(
      composition.performAction,
    );
    expect(calls).toEqual(["turn"]);
  });

  it("keeps apply-game-action and replay as thin applyAction consumers", () => {
    const applyAction = vi.fn();
    const composition = createApplyActionHostComposition({
      ...hostFor([]),
      actions: { applyAction },
    });

    expect(composition.applyGameActionHost?.actions.applyAction).toBe(
      applyAction,
    );
    expect(composition.replayHost?.actions.applyAction).toBe(applyAction);
  });

  it("configures apply-action and event hosts without rebuilding public context", () => {
    const previousApply = configureApplyActionCoreHost(undefined);
    const previousEvent = configureBuildEventHost(undefined);
    const calls: string[] = [];
    const buildEventHost = eventHost();

    try {
      const composition = configureApplyActionHostComposition({
        ...hostFor(calls),
        events: buildEventHost,
      });

      const configuredApply = configureApplyActionCoreHost(undefined);
      const configuredEvent = configureBuildEventHost(undefined);

      expect(configuredApply).toBe(composition.applyActionCoreHost);
      expect(configuredEvent).toBe(buildEventHost);
    } finally {
      configureApplyActionCoreHost(previousApply);
      configureBuildEventHost(previousEvent);
    }
  });
});
