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

    expect(
      handleCounterUtilityTriggerExecution(testHost(state), action),
    ).toEqual({
      handled: false,
    });
    expect(JSON.stringify(state)).toBe(before);
  });

  it("marks Preying Mantis action gain and end-turn damage due payload", () => {
    const sourceId = "preying_mantis_1" as CardInstanceId;
    const state = baseState();
    state.runner.clicks = 1;
    state.runner.rig.resources = [sourceId];
    state.cardInstances[sourceId] = instance(sourceId, 3954350644, "runner");
    const action = triggerAction(state, "runner", {
      cardId: sourceId,
      runnerUtilityAbility: "optional_extra_action_with_delayed_damage",
    });

    expect(
      handleCounterUtilityTriggerExecution(
        testHost(state, {
          definitions: {
            3954350644: definition(3954350644, "resource"),
          },
          runnerUtilityImplementation: {
            kind: "optional_extra_action_with_delayed_damage",
            extraActions: 1,
            damageType: "core",
            damageAmount: 1,
            damageTiming: "end_of_turn",
            preventable: false,
            limit: "once_per_turn_per_source",
            visibility: "public",
          },
        }),
        action,
      ),
    ).toMatchObject({ handled: true, actionType: "trigger_ability" });

    expect(state.runner.clicks).toBe(2);
    expect(
      state.runnerTurnFlags?.abilityUsedSourceIdsByLimitKey?.[
        "optional_extra_action_with_delayed_damage"
      ],
    ).toEqual([sourceId]);
    expect(state.runnerTurnFlags?.delayedEndTurnEffects).toEqual([
      {
        sourceCardInstanceId: sourceId,
        sourceDefinitionId: 3954350644,
        abilityKey: "optional_extra_action_with_delayed_damage",
        kind: "damage",
        damageType: "core",
        amount: 1,
        preventable: false,
      },
    ]);
    expect(action.payload).toMatchObject({
      sourceDefinitionId: 3954350644,
      gainedActions: 1,
      runnerClicksAfter: 2,
      delayedDamageDueAtEndOfTurn: true,
      damageCannotBePrevented: true,
      abilityLimitKey: "optional_extra_action_with_delayed_damage",
    });
  });

  it("removes a corp spy counter from the selected fort with stable payload", () => {
    const state = baseState();
    const rootId = "remote_root" as CardInstanceId;
    const iceId = "remote_ice" as CardInstanceId;
    state.corp.clicks = 2;
    state.corp.credits = 6;
    state.spyCountersByServer = { rd: 1 } as Record<string, number>;
    state.corp.servers[0]!.root = [rootId];
    state.corp.servers[0]!.ice = [iceId];
    state.cardInstances[rootId] = instance(rootId, 2072368119, "corp");
    state.cardInstances[iceId] = instance(iceId, 2630481112, "corp");
    const action = triggerAction(
      state,
      "corp",
      {
        corpAbility: "remove_spy_counter",
        serverId: "rd",
      },
      [{ clicks: 1, credits: 4 }],
    );

    state.corpTemporaryInstallRezCredits = {
      sourceCardInstanceId: "contract",
      sourceDefinitionId: 117,
      remaining: 3,
      usableFor: "corp_install_or_rez",
      returnUnusedAtTurnEnd: true,
    };
    const beforeRestrictedAttempt = JSON.stringify(state);
    expect(() =>
      handleCounterUtilityTriggerExecution(testHost(state), action),
    ).toThrow("nicht zweckgebundene Credits");
    expect(JSON.stringify(state)).toBe(beforeRestrictedAttempt);
    delete state.corpTemporaryInstallRezCredits;
    handleCounterUtilityTriggerExecution(
      testHost(state, {
        serverLabel: "R&D",
        definitions: {
          2072368119: definition(2072368119, "asset"),
          2630481112: definition(2630481112, "ice"),
        },
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
    expect(action.counterMutations).toEqual([
      expect.objectContaining({
        operation: "remove",
        counterType: "spy",
        scope: { kind: "server", serverId: "rd" },
        before: 1,
        amount: 1,
        after: 0,
      }),
    ]);
    expect(action.publicVisibilityTransitions).toEqual([
      {
        kind: "counter_threshold_identity_visibility_ended",
        counterType: "spy",
        scope: { kind: "server", serverId: "rd" },
        activeAtOrAbove: 1,
        before: 1,
        after: 0,
        cards: [
          {
            definitionId: 2630481112,
            serverId: "rd",
            area: "ice",
            positionKey: "ice:0",
          },
          {
            definitionId: 2072368119,
            serverId: "rd",
            area: "root",
            positionKey: "root:0",
          },
        ],
      },
    ]);
  });

  it("keeps threshold visibility active when counters remain", () => {
    const state = baseState();
    state.corp.clicks = 2;
    state.corp.credits = 6;
    state.spyCountersByServer = { rd: 2 } as Record<string, number>;
    const action = triggerAction(
      state,
      "corp",
      { corpAbility: "remove_spy_counter", serverId: "rd" },
      [{ clicks: 1, credits: 4 }],
    );

    handleCounterUtilityTriggerExecution(testHost(state), action);

    expect(state.spyCountersByServer?.rd).toBe(1);
    expect(action.counterMutations).toEqual([
      expect.objectContaining({ before: 2, amount: 1, after: 1 }),
    ]);
    expect(action.publicVisibilityTransitions).toBeUndefined();
  });

  it("removes a runner trace counter from identity without changing marker names", () => {
    const state = baseState();
    const identityId = "runner_identity" as CardInstanceId;
    state.runner.identity = identityId;
    state.runner.clicks = 2;
    state.runner.credits = 5;
    state.cardInstances[identityId] = instance(identityId, 198573098, "runner");
    setCounter(state, identityId, "trace_tag_counter", 1);
    const action = triggerAction(
      state,
      "runner",
      {
        runnerAbility: "remove_runner_trace_counter",
        cardId: identityId,
        counterType: "trace_tag_counter",
        removeCounterAmount: 1,
        counterRemoveCreditCost: 2,
      },
      [{ clicks: 1, credits: 2 }],
    );

    handleCounterUtilityTriggerExecution(
      testHost(state, {
        traceCounterEffect: {
          counterType: "trace_tag_counter",
          removeCost: 2,
          sourceDefinitionId: 284051578,
        },
      }),
      action,
    );

    expect(state.runner.clicks).toBe(1);
    expect(state.runner.credits).toBe(3);
    expect(counter(state, identityId, "trace_tag_counter")).toBe(0);
    expect(action.payload).toMatchObject({
      sourceDefinitionId: 284051578,
      counterType: "trace_tag_counter",
      removedCounterAmount: 1,
      remainingCounters: 0,
      runnerCreditsAfter: 3,
    });
    expect(action.counterMutations).toEqual([
      expect.objectContaining({
        operation: "remove",
        counterType: "trace_tag_counter",
        scope: {
          kind: "public_card",
          side: "runner",
          cardInstanceId: identityId,
        },
        before: 1,
        amount: 1,
        after: 0,
      }),
    ]);
  });

  it("trashes the Data-Fort creation lock source through the utility boundary", () => {
    const sourceId = "lock_source" as CardInstanceId;
    const state = baseState();
    state.corp.clicks = 3;
    state.corp.credits = 5;
    state.runner.rig.resources = [sourceId];
    state.cardInstances[sourceId] = instance(sourceId, 106069206, "runner");
    const action = triggerAction(
      state,
      "corp",
      {
        cardId: sourceId,
        corpAbility: "trash_new_data_fort_creation_lock_source",
      },
      [{ clicks: 2, credits: 3 }],
    );

    state.corpTemporaryInstallRezCredits = {
      sourceCardInstanceId: "contract",
      sourceDefinitionId: 117,
      remaining: 3,
      usableFor: "corp_install_or_rez",
      returnUnusedAtTurnEnd: true,
    };
    const beforeReservedAttempt = JSON.stringify(state);
    expect(() =>
      handleCounterUtilityTriggerExecution(
        testHost(state, {
          dataFortLock: {
            sourceDefinitionId: 106069206,
            modifier: { corpTrashSourceCost: { clicks: 2, credits: 3 } },
          },
        }),
        action,
      ),
    ).toThrow("kann die Trash-Kosten nicht bezahlen");
    expect(JSON.stringify(state)).toBe(beforeReservedAttempt);
    delete state.corpTemporaryInstallRezCredits;
    handleCounterUtilityTriggerExecution(
      testHost(state, {
        dataFortLock: {
          sourceDefinitionId: 106069206,
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
      sourceDefinitionId: 106069206,
      trashedCardDefinitionId: 106069206,
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
  runnerUtilityImplementation?: CounterUtilityTriggerExecutionHost["cards"] extends {
    runnerUtilityLongtailImplementationForCard: (
      ...args: any[]
    ) => infer Implementation;
  }
    ? Implementation
    : never;
  serverLabel?: string;
  traceCounterEffect?: {
    counterType: CounterType;
    removeCost: number;
    sourceDefinitionId: number;
  };
  dataFortLock?: {
    sourceDefinitionId: number;
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
          definition(
            card.definitionId,
            card.owner === "corp" ? "asset" : "resource",
          )
        );
      },
      runnerUtilityLongtailKindForCard: () => options.runnerUtilityKind,
      runnerUtilityLongtailImplementationForCard: () =>
        options.runnerUtilityImplementation,
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
        Math.max(
          0,
          Math.floor(stateToRead.spyCountersByServer?.[serverId] ?? 0),
        ),
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
          runnerActionOrdinal: 0,
          abilityUsedSourceIdsByLimitKey: {},
          startOfTurnFloatingCreditsApplied: false,
          bonusRunPending: false,
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
  definitionId: number,
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

function definition(id: number, type: CardDefinition["type"]): CardDefinition {
  return {
    id,
    title: id,
    side:
      type === "asset" || type === "ice" || type === "upgrade"
        ? "corp"
        : "runner",
    type,
    mechanics: [],
  } as unknown as CardDefinition;
}
