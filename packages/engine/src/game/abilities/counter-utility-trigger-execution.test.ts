import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  CounterType,
  GameState,
  LegalAction,
  ServerId,
  Side,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import { buildLegalAction } from "../turn/action-builders";
import {
  handleCounterUtilityTriggerExecution,
  type CounterUtilityTriggerExecutionHost,
} from "./counter-utility-trigger-execution";

describe("counter utility trigger execution", () => {
  it("returns unhandled for actions outside the counter/utility trigger boundary", () => {
    const state = baseState();
    const before = JSON.stringify(state);
    const action = buildLegalAction(
      state,
      "runner",
      "draw_card",
      "Karte ziehen",
      "basic_action",
      [{ clicks: 1 }],
    );

    expect(handleCounterUtilityTriggerExecution(testHost(state), action)).toEqual({
      handled: false,
    });
    expect(JSON.stringify(state)).toBe(before);
  });

  it("marks Preying Mantis action gain and end-turn damage due payload", () => {
    const sourceId = "preying_mantis_1" as CardInstanceId;
    const state = baseState();
    state.runner.clicks = 1;
    state.runner.rig.resources = [sourceId];
    state.cardInstances[sourceId] = instance(sourceId, "preying_mantis", "runner");
    const action = triggerAction(state, "runner", {
      cardId: sourceId,
      runnerUtilityAbility: "preying_mantis_gain_action",
    });

    expect(
      handleCounterUtilityTriggerExecution(
        testHost(state, {
          definitions: {
            preying_mantis: definition("preying_mantis", "resource"),
          },
          runnerUtilityKind:
            "preying_mantis_optional_action_unpreventable_core_damage",
        }),
        action,
      ),
    ).toMatchObject({ handled: true, actionType: "trigger_ability" });

    expect(state.runner.clicks).toBe(2);
    expect(state.runnerTurnFlags?.preyingMantisUsedSourceIdsThisTurn).toEqual([
      sourceId,
    ]);
    expect(state.runnerTurnFlags?.preyingMantisDamageDueSourceIdsThisTurn).toEqual([
      sourceId,
    ]);
    expect(action.payload).toMatchObject({
      sourceDefinitionId: "preying_mantis",
      gainedActions: 1,
      runnerClicksAfter: 2,
      unpreventableDamageDueAtEndOfTurn: true,
    });
  });

  it("removes a corp spy counter from the selected fort with stable payload", () => {
    const state = baseState();
    state.corp.clicks = 2;
    state.corp.credits = 6;
    state.spyCountersByServer = { rd: 1 } as Record<string, number>;
    const action = triggerAction(
      state,
      "corp",
      {
        corpAbility: "remove_spy_counter",
        serverId: "rd",
      },
      [{ clicks: 1, credits: 4 }],
    );

    handleCounterUtilityTriggerExecution(
      testHost(state, {
        serverLabel: "R&D",
      }),
      action,
    );

    expect(state.corp.clicks).toBe(1);
    expect(state.corp.credits).toBe(2);
    expect(state.spyCountersByServer?.rd).toBe(0);
    expect(action.payload).toMatchObject({
      serverId: "rd",
      serverLabel: "R&D",
      counterType: "spy",
      removedCounterAmount: 1,
      remainingCounters: 0,
      removedSpyCounter: true,
      corpCreditsAfter: 2,
    });
  });

  it("removes a runner trace counter from identity without changing marker names", () => {
    const state = baseState();
    const identityId = "runner_identity" as CardInstanceId;
    state.runner.identity = identityId;
    state.runner.clicks = 2;
    state.runner.credits = 5;
    state.cardInstances[identityId] = instance(identityId, "runner_identity_def", "runner");
    setCounter(state, identityId, "data_raven", 1);
    const action = triggerAction(
      state,
      "runner",
      {
        runnerAbility: "remove_runner_trace_counter",
        cardId: identityId,
        counterType: "data_raven",
        removeCounterAmount: 1,
        counterRemoveCreditCost: 2,
      },
      [{ clicks: 1, credits: 2 }],
    );

    handleCounterUtilityTriggerExecution(
      testHost(state, {
        traceCounterEffect: {
          counterType: "data_raven",
          removeCost: 2,
          sourceDefinitionId: "data_raven_source",
        },
      }),
      action,
    );

    expect(state.runner.clicks).toBe(1);
    expect(state.runner.credits).toBe(3);
    expect(counter(state, identityId, "data_raven")).toBe(0);
    expect(action.payload).toMatchObject({
      sourceDefinitionId: "data_raven_source",
      counterType: "data_raven",
      removedCounterAmount: 1,
      remainingCounters: 0,
      runnerCreditsAfter: 3,
    });
  });

  it("trashes the Data-Fort creation lock source through the utility boundary", () => {
    const sourceId = "lock_source" as CardInstanceId;
    const state = baseState();
    state.corp.clicks = 3;
    state.corp.credits = 5;
    state.runner.rig.resources = [sourceId];
    state.cardInstances[sourceId] = instance(sourceId, "lock_source_def", "runner");
    const action = triggerAction(
      state,
      "corp",
      {
        cardId: sourceId,
        corpAbility: "trash_new_data_fort_creation_lock_source",
      },
      [{ clicks: 2, credits: 3 }],
    );

    handleCounterUtilityTriggerExecution(
      testHost(state, {
        dataFortLock: {
          sourceDefinitionId: "lock_source_def",
          modifier: { corpTrashSourceCost: { clicks: 2, credits: 3 } },
        },
      }),
      action,
    );

    expect(state.corp.clicks).toBe(1);
    expect(state.corp.credits).toBe(2);
    expect(state.runner.rig.resources).toEqual([]);
    expect(state.runner.heap).toEqual([sourceId]);
    expect(action.payload).toMatchObject({
      sourceDefinitionId: "lock_source_def",
      trashedCardDefinitionId: "lock_source_def",
      trashCostPaid: 3,
      newDataFortCreationLockRemoved: true,
      corpCreditsAfter: 2,
    });
  });

  it("does not import from the public engine index", () => {
    const source = readFileSync(
      new URL("./counter-utility-trigger-execution.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain('from "../index"');
    expect(source).not.toContain("from '../index'");
    expect(source).not.toContain('from "../../index"');
    expect(source).not.toContain("from '../../index'");
  });
});

type HostOptions = {
  definitions?: Record<string, CardDefinition>;
  runnerUtilityKind?: string;
  serverLabel?: string;
  traceCounterEffect?: {
    counterType: CounterType;
    removeCost: number;
    sourceDefinitionId: string;
  };
  dataFortLock?: {
    sourceDefinitionId: string;
    modifier: { corpTrashSourceCost: { clicks: number; credits: number } };
  };
};

function baseState(): GameState {
  const state = createGame({
    seed: "arch-73-counter-utility-trigger",
    setupMode: "completed",
  });
  state.runner.clicks = 0;
  state.runner.credits = 0;
  state.runner.rig.resources = [];
  state.runner.heap = [];
  state.corp.clicks = 0;
  state.corp.credits = 0;
  state.cardInstances = {};
  state.corp.servers = [
    { id: "rd", kind: "rd", label: "R&D", ice: [], root: [] },
  ] as CorpServer[];
  return state;
}

function triggerAction(
  state: GameState,
  side: Side,
  payload: LegalAction["payload"],
  costs: LegalAction["costs"] = [],
): LegalAction {
  return buildLegalAction(
    state,
    side,
    "trigger_ability",
    "Trigger ausloesen",
    "card",
    costs,
    payload,
  );
}

function testHost(
  state: GameState,
  options: HostOptions = {},
): CounterUtilityTriggerExecutionHost {
  return {
    state,
    actions: {
      spendClick: (stateToMutate, side) => {
        if (side === "corp") stateToMutate.corp.clicks -= 1;
        else stateToMutate.runner.clicks -= 1;
      },
      spendClicks: (stateToMutate, side, amount) => {
        if (side === "corp") stateToMutate.corp.clicks -= amount;
        else stateToMutate.runner.clicks -= amount;
      },
    },
    cards: {
      definitionFor: (stateToRead, cardId) => {
        const card = stateToRead.cardInstances[cardId];
        if (!card) throw new Error(`CardInstance fehlt: ${cardId}`);
        return (
          options.definitions?.[card.definitionId] ??
          definition(card.definitionId, card.owner === "corp" ? "asset" : "resource")
        );
      },
      runnerUtilityLongtailKindForCard: () => options.runnerUtilityKind,
    },
    credits: {
      spend: (stateToMutate, side, amount) => {
        if (side === "corp") stateToMutate.corp.credits -= amount;
        else stateToMutate.runner.credits -= amount;
      },
    },
    counters: {
      cardCounter: counter,
      spendCardCounter: (stateToMutate, cardId, counterType, amount) =>
        setCounter(
          stateToMutate,
          cardId,
          counterType,
          counter(stateToMutate, cardId, counterType) - amount,
        ),
      spyCountersForServer: (stateToRead, serverId) =>
        Math.max(0, Math.floor(stateToRead.spyCountersByServer?.[serverId] ?? 0)),
      traceCounterEffectDefinitionFor: () => options.traceCounterEffect,
    },
    runner: {
      ensureTurnFlags: (stateToMutate) =>
        (stateToMutate.runnerTurnFlags ??= {
          stoleAgendaThisTurn: false,
          stoleAgendaLastTurn: false,
          stolenAgendaAdvancementCountersThisTurn: 0,
          stolenAgendaAdvancementCountersLastTurn: 0,
          runnerReceivedTagThisTurn: false,
          stoleResearchAgendaThisTurn: false,
          stoleGrayOpsAgendaThisTurn: false,
          stoleBlackOpsAgendaThisTurn: false,
          runAttemptsThisTurn: 0,
          runAttemptsLastTurn: 0,
          successfulHqRunThisTurn: false,
          successfulRunThisTurn: false,
          damagePreventionUsage: {},
          runnerActionsTakenThisTurn: 0,
          abilityUsedSourceIdsByLimitKey: {},
          startOfTurnFloatingCreditsApplied: false,
          allNighterBonusRunPending: false,
        }),
      trashInstalledCardToHeap: (stateToMutate, cardId) => {
        stateToMutate.runner.rig.resources =
          stateToMutate.runner.rig.resources.filter((id) => id !== cardId);
        stateToMutate.runner.heap.push(cardId);
        stateToMutate.cardInstances[cardId] = {
          ...stateToMutate.cardInstances[cardId]!,
          zone: { side: "runner", zone: "heap" },
          faceup: true,
          rezzed: true,
        };
      },
    },
    servers: {
      mustServer: (stateToRead, serverId) => {
        const server = stateToRead.corp.servers.find(
          (candidate) => candidate.id === serverId,
        );
        if (!server) throw new Error(`Server fehlt: ${serverId}`);
        return server;
      },
      publicServerLabel: () => options.serverLabel,
    },
    dataFort: {
      newDataFortCreationLockForSource: () =>
        options.dataFortLock as ReturnType<
          CounterUtilityTriggerExecutionHost["dataFort"]["newDataFortCreationLockForSource"]
        >,
    },
  };
}

function counter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
): number {
  const value = state.cardInstances[cardId]?.counters?.[counterType] ?? 0;
  return Math.max(0, Math.floor(value));
}

function setCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
  amount: number,
): void {
  const card = state.cardInstances[cardId];
  if (!card) throw new Error(`CardInstance fehlt: ${cardId}`);
  state.cardInstances[cardId] = {
    ...card,
    counters: {
      ...(card.counters ?? {}),
      [counterType]: Math.max(0, Math.floor(amount)),
    },
  };
}

function instance(
  id: CardInstanceId,
  definitionId: string,
  owner: Side,
): CardInstance {
  return {
    id,
    instanceId: id,
    definitionId,
    owner,
    controller: owner,
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier: 0,
    zone: { side: owner, zone: owner === "corp" ? "serverRoot" : "rig" },
  } as unknown as CardInstance;
}

function definition(
  id: string,
  type: CardDefinition["type"],
): CardDefinition {
  return {
    id,
    title: id,
    side: type === "asset" || type === "ice" || type === "upgrade" ? "corp" : "runner",
    type,
    mechanics: [],
  } as unknown as CardDefinition;
}
