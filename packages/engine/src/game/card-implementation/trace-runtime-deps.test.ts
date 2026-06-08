import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createTraceCardImplementationRuntimeDeps,
  type TraceRuntimeDepsHost,
} from "./trace-runtime-deps";

const sourceCardId = "source" as CardInstanceId;
const sourceDefinitionId = "source_def" as CardDefinitionId;
const targetResourceId = "target_resource" as CardInstanceId;

function state(): GameState {
  return {
    stateVersion: 10,
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    pendingChoice: undefined,
    randomCounter: 0,
    runner: {
      credits: 5,
      clicks: 1,
      tags: 0,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: { programs: [], hardware: [], resources: [] },
    },
    corp: {
      credits: 4,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      servers: [],
    },
    cardInstances: {
      [sourceCardId]: {
        id: sourceCardId,
        definitionId: sourceDefinitionId,
        owner: "runner",
        controller: "runner",
        zone: { side: "runner", zone: "grip" },
      } as unknown as CardInstance,
    },
    eventLog: [],
  } as unknown as GameState;
}

function action(payload: LegalAction["payload"] = {}): LegalAction {
  return {
    actionId: "trigger_ability:source",
    id: "trigger_ability:source",
    side: "runner",
    timingPoint: "runner_action.main",
    type: "trigger_ability",
    label: "Trigger",
    source: sourceCardId,
    payload,
    costs: [],
    targetRequirements: [],
  } as unknown as LegalAction;
}

function definition(id: CardDefinitionId): CardDefinition {
  return {
    id,
    title: String(id),
    type: "resource",
  } as CardDefinition;
}

function host(): TraceRuntimeDepsHost {
  return {
    trace: {
      orchestrationHost: (gameState) => ({
        state: gameState,
        cards: {
          definitionFor: (cardId) =>
            definition(
              gameState.cardInstances[cardId]?.definitionId as CardDefinitionId,
            ),
          runnerInstalledCardIds: () => [],
          hasCardImplementationForDefinition: () => false,
          activatedTraceAbilities: () => [],
          isSubmarineUplinkSource: () => false,
        },
        payment: {
          corpTracePaymentDeps: {} as never,
          runnerTracePaymentDeps: {} as never,
          runnerTraceLinkCreditSourceIds: () => [],
          hostedPaymentCredits: () => 0,
          spendRunnerCredits: () => undefined,
        },
        runner: {
          identityModifierAmount: () => 0,
        },
        corp: {
          rezzedCorpRootCardIds: () => [],
        },
        counters: {
          cardCounter: () => 0,
          hackerTrackerCounterTotal: () => 0,
          krumzTraceBitTotal: () => 0,
        },
        fort: {
          parisCityGridTracePoolSource: () => undefined,
        },
        run: {
          markSubmarineUplinkJackOutAfterEncounter: () => undefined,
          applyPrintedTraceSuccessFollowups: () => ({
            handled: true,
            payload: {},
            publicPayload: {},
          }),
        },
        trace: {
          supportsTraceSuccessEffect: () => true,
        },
        callbacks: {
          sanitizeId: (value) => value.replace(/[^a-zA-Z0-9_.-]/g, "_"),
          addHackerTrackerTraceCounters: () => 0,
          resolveTraceTrashRunnerResourceSuccess: () => ({}),
        },
        constants: {
          PARIS_CITY_GRID_TRACE_TAG_UPGRADE_ID: "paris" as CardDefinitionId,
        },
      }),
      resolveRunnerLastTurnInstalledResourceTargetId: (_gameState, targetRef) =>
        targetRef === targetResourceId ? targetResourceId : undefined,
    },
  };
}

describe("trace card implementation runtime deps", () => {
  it("creates only the trace runtime property", () => {
    const deps = createTraceCardImplementationRuntimeDeps(host());

    expect(Object.keys(deps)).toEqual(["startTrace"]);
  });

  it("delegates CardImplementation trace start to the existing trace orchestration", () => {
    const gameState = state();
    const legalAction = action({ existing: true });
    const deps = createTraceCardImplementationRuntimeDeps(host());

    const result = deps.startTrace(
      gameState,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      4,
      [{ kind: "add_tags", recipient: "runner", amount: 1, visibility: "public" }],
    );

    expect(result).toMatchObject({
      traceStarted: true,
      traceId: "op_trace.11.source_def.source",
      sourceCardId,
      sourceDefinitionId,
      baseTraceStrength: 4,
    });
    expect(gameState.trace).toMatchObject({
      traceId: "op_trace.11.source_def.source",
      sourceCardInstanceId: sourceCardId,
      sourceDefinitionId,
      baseTraceStrength: 4,
      corpBidMax: 4,
      status: "corp_bid",
      successEffect: { type: "add_tag", amount: 1 },
      returnPhase: "runner_action_phase",
      returnTimingPoint: "runner_action.main",
      returnActiveSide: "runner",
    });
    expect(gameState.pendingChoice).toMatchObject({
      side: "corp",
      kind: "bid_amount",
      source: "trace:op_trace.11.source_def.source",
      maxSelections: 1,
    });
    expect(gameState.pendingChoice?.options).toHaveLength(5);
    expect(gameState.activeSide).toBe("corp");
    expect(legalAction.payload).toMatchObject({
      existing: true,
      cardId: sourceCardId,
      traceStarted: true,
      traceId: "op_trace.11.source_def.source",
      sourceDefinitionId,
      baseTraceStrength: 4,
    });
  });

  it("binds target-required trace effects before creating TraceState", () => {
    const gameState = state();
    const legalAction = action({ traceSuccessTargetCardId: targetResourceId });
    const deps = createTraceCardImplementationRuntimeDeps(host());

    deps.startTrace(
      gameState,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      4,
      [
        {
          kind: "trash_runner_resource_and_add_tag",
          target: "runner_resource_installed_last_turn",
          visibility: "public",
        },
      ],
    );

    expect(gameState.trace?.successEffect).toEqual({
      type: "trash_runner_resource_and_add_tag",
      targetCardInstanceId: targetResourceId,
    });
  });

  it("rejects target-required trace effects before TraceState can contain an empty target", () => {
    const gameState = state();
    const legalAction = action();
    const deps = createTraceCardImplementationRuntimeDeps(host());

    expect(() =>
      deps.startTrace(
        gameState,
        legalAction,
        sourceCardId,
        sourceDefinitionId,
        4,
        [
          {
            kind: "trash_runner_resource_and_add_tag",
            target: "runner_resource_installed_last_turn",
            visibility: "public",
          },
        ],
      ),
    ).toThrow("Die gewaehlte Runner-Resource ist fuer diesen Trace nicht legal.");
    expect(gameState.trace).toBeUndefined();
  });

  it("does not import from the public engine index", () => {
    const source = readFileSync(
      new URL("./trace-runtime-deps.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain('from "../index"');
    expect(source).not.toContain("from '../index'");
    expect(source).not.toContain('from "../../index"');
    expect(source).not.toContain("from '../../index'");
  });
});
