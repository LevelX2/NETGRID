import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  handlePlayCardExecution,
  type PlayCardExecutionHost,
} from "./play-card-execution";

const EVENT_ID = "event_1" as CardInstanceId;
const OPERATION_ID = "operation_1" as CardInstanceId;

function state(): GameState {
  return {
    stateVersion: 5,
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    baseline: { engineSchemaVersion: "0.99.0" },
    runner: {
      credits: 5,
      clicks: 3,
      tags: 0,
      stack: [],
      grip: [EVENT_ID],
      heap: [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: { programs: [], hardware: [], resources: [] },
    },
    corp: {
      credits: 5,
      clicks: 3,
      hq: [OPERATION_ID],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      badPublicity: 2,
      servers: [],
    },
    cardInstances: {
      [EVENT_ID]: instance(EVENT_ID, "runner_event", {
        owner: "runner",
        controller: "runner",
        zone: { side: "runner", zone: "grip" },
      }),
      [OPERATION_ID]: instance(OPERATION_ID, "corp_operation", {
        owner: "corp",
        controller: "corp",
        zone: { side: "corp", zone: "hq" },
      }),
    },
    eventLog: [],
    randomCounter: 0,
  } as unknown as GameState;
}

function instance(
  id: CardInstanceId,
  definitionId: string,
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    id,
    definitionId,
    instanceId: id,
    owner: options.owner ?? "runner",
    controller: options.controller ?? "runner",
    zone: options.zone ?? { side: "runner", zone: "grip" },
    faceup: options.faceup ?? false,
    rezzed: options.rezzed ?? false,
    advancementCounters: 0,
    strengthModifier: 0,
    ...options,
  } as unknown as CardInstance;
}

function definition(
  id: string,
  type: CardDefinition["type"],
  cost = 1,
): CardDefinition {
  return {
    id,
    title: id,
    side: type === "operation" ? "corp" : "runner",
    type,
    cost,
  } as CardDefinition;
}

function legalAction(
  type: LegalAction["type"],
  cardId: CardInstanceId,
  credits = 1,
): LegalAction {
  return {
    actionId: `${type}.${cardId}`,
    type,
    label: type,
    side: type === "play_operation" ? "corp" : "runner",
    source: cardId,
    stateVersion: 5,
    timingPoint:
      type === "play_operation" ? "corp_action.main" : "runner_action.main",
    costs: [{ clicks: 1, credits }],
    payload: { cardId },
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 6,
  } as unknown as LegalAction;
}

type HostOverrides = {
  cards?: Partial<PlayCardExecutionHost["cards"]>;
  zones?: Partial<PlayCardExecutionHost["zones"]>;
  payment?: Partial<PlayCardExecutionHost["payment"]>;
  events?: Partial<PlayCardExecutionHost["events"]>;
  operations?: Partial<PlayCardExecutionHost["operations"]>;
  cardImplementation?: Partial<PlayCardExecutionHost["cardImplementation"]>;
};

function hostFor(
  targetState: GameState,
  calls: string[],
  overrides: HostOverrides = {},
): PlayCardExecutionHost {
  const host: PlayCardExecutionHost = {
    state: targetState,
    cards: {
      definitionFor: (cardId) => {
        const instance = targetState.cardInstances[cardId];
        return definition(
          instance?.definitionId ?? String(cardId),
          cardId === OPERATION_ID ? "operation" : "event",
        );
      },
      cardInstanceFor: (cardId) => targetState.cardInstances[cardId] as CardInstance,
    },
    zones: {
      removeFromAllZones: (cardId) => {
        calls.push(`remove:${cardId}`);
        targetState.runner.grip = targetState.runner.grip.filter(
          (id) => id !== cardId,
        );
        targetState.corp.hq = targetState.corp.hq.filter((id) => id !== cardId);
      },
    },
    payment: {
      spendClick: (side) => calls.push(`click:${side}`),
      spendCredits: (side, amount) => calls.push(`credits:${side}:${amount}`),
    },
    events: {
      runnerEventResolver: () => ({
        resolve: (_state, action) => calls.push(`runnerResolver:${action.type}`),
      }),
    },
    operations: {
      canPlayCorpOperation: () => true,
      resolveCorpOperation: (operationDefinition, action) =>
        calls.push(`operationResolver:${operationDefinition.id}:${action.type}`),
      resolveRunnerLastTurnInstalledResourceTargetId: (targetCardId) =>
        targetCardId ? (targetCardId as CardInstanceId) : undefined,
    },
    cardImplementation: {
      canPlayPrintedCostOnPlay: () => false,
      executeOnPlayAbility: (_action, playDefinition, cardId) =>
        calls.push(`onPlay:${playDefinition.id}:${cardId}`),
      hasPrintedCostOnPlay: () => false,
      additionalOperationCost: () => 0,
      needsLastTurnResourceTarget: () => false,
    },
  };

  return {
    state: targetState,
    cards: { ...host.cards, ...overrides.cards },
    zones: { ...host.zones, ...overrides.zones },
    payment: { ...host.payment, ...overrides.payment },
    events: { ...host.events, ...overrides.events },
    operations: { ...host.operations, ...overrides.operations },
    cardImplementation: {
      ...host.cardImplementation,
      ...overrides.cardImplementation,
    },
  };
}

describe("play-card-execution", () => {
  it("does not import from index or contain public event wiring", () => {
    const source = readFileSync(
      new URL("./play-card-execution.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("BuildEvent");
  });

  it("returns unhandled for unrelated actions", () => {
    const calls: string[] = [];
    const result = handlePlayCardExecution(
      hostFor(state(), calls),
      legalAction("gain_credit", EVENT_ID),
    );

    expect(result).toEqual({ handled: false });
    expect(calls).toEqual([]);
  });

  it("plays a runner event by spending, moving to heap and resolving event logic", () => {
    const calls: string[] = [];
    const targetState = state();
    const action = legalAction("play_event", EVENT_ID, 2);

    const result = handlePlayCardExecution(hostFor(targetState, calls), action);

    expect(result.handled).toBe(true);
    expect(targetState.runner.grip).not.toContain(EVENT_ID);
    expect(targetState.runner.heap).toContain(EVENT_ID);
    expect(targetState.cardInstances[EVENT_ID]).toMatchObject({
      faceup: true,
      zone: { side: "runner", zone: "heap" },
    });
    expect(calls).toEqual([
      "click:runner",
      "credits:runner:2",
      `remove:${EVENT_ID}`,
      "runnerResolver:play_event",
    ]);
  });

  it("uses on-play CardImplementation for runner events before resolver fallback", () => {
    const calls: string[] = [];
    const targetState = state();

    handlePlayCardExecution(
      hostFor(targetState, calls, {
        cardImplementation: { canPlayPrintedCostOnPlay: () => true },
      }),
      legalAction("play_event", EVENT_ID),
    );

    expect(calls).toEqual([
      "click:runner",
      "credits:runner:1",
      `remove:${EVENT_ID}`,
      `onPlay:runner_event:${EVENT_ID}`,
    ]);
  });

  it("plays a corp operation by spending, moving to archives and resolving operation logic", () => {
    const calls: string[] = [];
    const targetState = state();
    const action = legalAction("play_operation", OPERATION_ID, 3);

    const result = handlePlayCardExecution(hostFor(targetState, calls), action);

    expect(result.handled).toBe(true);
    expect(targetState.corp.hq).not.toContain(OPERATION_ID);
    expect(targetState.corp.archives).toContain(OPERATION_ID);
    expect(targetState.cardInstances[OPERATION_ID]).toMatchObject({
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "archives" },
    });
    expect(calls).toEqual([
      "click:corp",
      "credits:corp:3",
      `remove:${OPERATION_ID}`,
      "operationResolver:corp_operation:play_operation",
    ]);
  });

  it("keeps printed-cost operation revalidation and hidden/bad-publicity payloads stable", () => {
    const hiddenCalls: string[] = [];
    const hiddenState = state();
    hiddenState.cardInstances[OPERATION_ID] = instance(
      OPERATION_ID,
      "v098_hq_rd_swap_operation",
      { owner: "corp", controller: "corp", zone: { side: "corp", zone: "hq" } },
    );
    const hiddenAction = legalAction("play_operation", OPERATION_ID, 4);
    hiddenAction.payload = {
      ...(hiddenAction.payload ?? {}),
      traceSuccessTargetCardId: "resource_1",
    };

    handlePlayCardExecution(
      hostFor(hiddenState, hiddenCalls, {
        cards: {
          definitionFor: () =>
            definition("v098_hq_rd_swap_operation", "operation", 2),
        },
        cardImplementation: {
          hasPrintedCostOnPlay: () => true,
          additionalOperationCost: () => 2,
          needsLastTurnResourceTarget: () => true,
        },
      }),
      hiddenAction,
    );

    expect(hiddenAction.payload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "swap_hq_rd",
    });

    const badPublicityCalls: string[] = [];
    const badPublicityState = state();
    badPublicityState.cardInstances[OPERATION_ID] = instance(
      OPERATION_ID,
      "v099_bad_publicity_operation",
      { owner: "corp", controller: "corp", zone: { side: "corp", zone: "hq" } },
    );
    const badPublicityAction = legalAction("play_operation", OPERATION_ID);

    handlePlayCardExecution(
      hostFor(badPublicityState, badPublicityCalls, {
        cards: {
          definitionFor: () =>
            definition("v099_bad_publicity_operation", "operation"),
        },
      }),
      badPublicityAction,
    );

    expect(badPublicityAction.payload).toMatchObject({
      badPublicityAfter: 2,
    });
  });
});
