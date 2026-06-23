import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CounterType,
  GameState,
  LegalAction,
  ResolvedGameEffect,
  Side,
  SpecialZoneState,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import { buildLegalAction } from "../turn/action-builders";
import {
  applyDelayedInstallStartOfTurn,
  handleRunnerSpecialTriggerExecution,
  delayedInstallPreparedTargetIds,
  delayedInstallPrepareTargetIds,
  topRunnerHeapCardId,
  type RunnerSpecialTriggerExecutionHost,
} from "./runner-special-trigger-execution";

const JUNKYARD_BBS_ID = "junkyard_bbs";
const SHELL_TRADERS_ID = "shell_traders";
const SELF_MODIFYING_CODE_ID = "self_modifying_code";

describe("runner special trigger execution", () => {
  it("returns unhandled for actions outside the runner-special boundary", () => {
    const state = createGame({
      seed: "arch-71-runner-special-unhandled",
      setupMode: "completed",
    });
    const before = JSON.stringify(state);
    const action = buildLegalAction(
      state,
      "runner",
      "draw_card",
      "Karte ziehen",
      "basic_action",
      [{ clicks: 1 }],
    );

    expect(handleRunnerSpecialTriggerExecution(testHost(state), action)).toEqual({
      handled: false,
    });
    expect(JSON.stringify(state)).toBe(before);
  });

  it("moves the top heap card to grip through Junkyard BBS", () => {
    const sourceId = "junkyard_1" as CardInstanceId;
    const heapId = "heap_top" as CardInstanceId;
    const state = baseState();
    state.runner.clicks = 2;
    state.runner.credits = 3;
    state.runner.rig.resources = [sourceId];
    state.runner.heap = [heapId];
    state.cardInstances[sourceId] = instance(sourceId, JUNKYARD_BBS_ID, "runner", "rig");
    state.cardInstances[heapId] = instance(heapId, "heap_card", "runner", "heap");
    const host = testHost(state, {
      [JUNKYARD_BBS_ID]: definition(JUNKYARD_BBS_ID, "resource"),
      heap_card: definition("heap_card", "program"),
    });
    const action = triggerAction(state, {
      cardId: sourceId,
      resourceAbility: "return_top_heap_card",
      targetCardId: heapId,
      targetCardDefinitionId: "heap_card",
    }, [{ clicks: 1, credits: 1 }]);

    expect(handleRunnerSpecialTriggerExecution(host, action)).toMatchObject({
      handled: true,
      actionType: "trigger_ability",
    });
    expect(state.runner.clicks).toBe(1);
    expect(state.runner.credits).toBe(2);
    expect(state.runner.heap).toEqual([]);
    expect(state.runner.grip[0]).toBe(heapId);
    expect(topRunnerHeapCardId(state)).toBeUndefined();
    expect(action.payload).toMatchObject({
      sourceDefinitionId: JUNKYARD_BBS_ID,
      returnedCardDefinitionId: "heap_card",
      returnedToGrip: true,
      runnerCreditsAfter: 2,
    });
  });

  it("sets aside a Shell Traders target with stable public marker payload", () => {
    const sourceId = "shell_1" as CardInstanceId;
    const targetId = "grip_program" as CardInstanceId;
    const state = baseState();
    state.runner.clicks = 2;
    state.runner.rig.resources = [sourceId];
    state.runner.grip = [targetId];
    state.cardInstances[sourceId] = instance(sourceId, SHELL_TRADERS_ID, "runner", "rig");
    state.cardInstances[targetId] = instance(targetId, "program_a", "runner", "grip");
    const host = testHost(state, {
      [SHELL_TRADERS_ID]: definition(SHELL_TRADERS_ID, "resource"),
      program_a: definition("program_a", "program", { installCost: 3, memoryCost: 1 }),
    });
    const action = triggerAction(state, {
      cardId: sourceId,
      delayedInstallAbility: "set_aside_from_grip",
      targetCardId: targetId,
      targetCardDefinitionId: "program_a",
      shellCounterAmount: 3,
    }, [{ clicks: 1 }]);

    expect(delayedInstallPrepareTargetIds(host)).toEqual([targetId]);
    handleRunnerSpecialTriggerExecution(host, action);

    expect(state.runner.clicks).toBe(1);
    expect(state.runner.grip).toEqual([]);
    expect(state.specialZones?.setAside).toEqual([targetId]);
    expect(state.cardInstances[targetId]?.zone).toMatchObject({
      side: "special",
      zone: "set_aside",
      visibility: "public",
    });
    expect(counter(state, targetId, "shell")).toBe(3);
    expect(action.payload).toMatchObject({
      hiddenZoneAction: "delayed_install_set_aside",
      sourceDefinitionId: SHELL_TRADERS_ID,
      targetCardDefinitionId: "program_a",
      counterType: "shell",
      addedCounterAmount: 3,
      remainingCounters: 3,
      specialZoneVisibility: "public",
    });
  });

  it("removes a Shell counter and installs the prepared card when countdown reaches zero", () => {
    const sourceId = "shell_1" as CardInstanceId;
    const targetId = "prepared_program" as CardInstanceId;
    const state = baseState();
    state.runner.credits = 2;
    state.runner.rig.resources = [sourceId];
    state.specialZones = { setAside: [targetId] } as SpecialZoneState;
    state.cardInstances[sourceId] = instance(sourceId, SHELL_TRADERS_ID, "runner", "rig");
    state.cardInstances[targetId] = {
      ...instance(targetId, "program_a", "runner", "set_aside"),
      zone: {
        side: "special",
        zone: "set_aside",
        visibility: "public",
        returnZone: { side: "runner", zone: "rig" },
      },
    } as CardInstance;
    setCounter(state, targetId, "shell", 1);
    const host = testHost(state, {
      [SHELL_TRADERS_ID]: definition(SHELL_TRADERS_ID, "resource"),
      program_a: definition("program_a", "program", { installCost: 1, memoryCost: 1 }),
    });
    const action = triggerAction(state, {
      cardId: sourceId,
      delayedInstallAbility: "remove_shell_counter",
      targetCardId: targetId,
      targetCardDefinitionId: "program_a",
    }, [{ credits: 1 }]);

    expect(delayedInstallPreparedTargetIds(host)).toEqual([targetId]);
    handleRunnerSpecialTriggerExecution(host, action);

    expect(state.runner.credits).toBe(1);
    expect(state.specialZones?.setAside).toEqual([]);
    expect(state.runner.rig.programs).toEqual([targetId]);
    expect(state.runner.memoryUsed).toBe(1);
    expect(counter(state, targetId, "shell")).toBe(0);
    expect(action.payload).toMatchObject({
      delayedInstallInstalledTarget: true,
      remainingCounters: 0,
      runnerCreditsAfter: 1,
    });
  });

  it("does not remove the final Shell counter when the prepared program cannot fit memory", () => {
    const sourceId = "shell_1" as CardInstanceId;
    const targetId = "prepared_program" as CardInstanceId;
    const state = baseState();
    state.runner.rig.resources = [sourceId];
    state.runner.memoryUsed = 4;
    state.runner.memoryLimit = 4;
    state.specialZones = { setAside: [targetId] } as SpecialZoneState;
    state.cardInstances[sourceId] = instance(
      sourceId,
      SHELL_TRADERS_ID,
      "runner",
      "rig",
    );
    state.cardInstances[targetId] = {
      ...instance(targetId, "program_a", "runner", "set_aside"),
      zone: {
        side: "special",
        zone: "set_aside",
        visibility: "public",
        returnZone: { side: "runner", zone: "rig" },
      },
    } as CardInstance;
    setCounter(state, targetId, "shell", 1);
    const host = testHost(state, {
      [SHELL_TRADERS_ID]: definition(SHELL_TRADERS_ID, "resource"),
      program_a: definition("program_a", "program", {
        installCost: 1,
        memoryCost: 1,
      }),
    });
    const effects: ResolvedGameEffect[] = [];

    expect(delayedInstallPreparedTargetIds(host)).toEqual([]);
    applyDelayedInstallStartOfTurn(host, effects);

    expect(effects).toEqual([]);
    expect(counter(state, targetId, "shell")).toBe(1);
    expect(state.specialZones?.setAside).toEqual([targetId]);
    expect(state.runner.rig.programs).toEqual([]);
    expect(state.runner.memoryUsed).toBe(4);
  });

  it("can progress a non-final Shell counter under memory pressure", () => {
    const sourceId = "shell_1" as CardInstanceId;
    const targetId = "prepared_program" as CardInstanceId;
    const state = baseState();
    state.runner.rig.resources = [sourceId];
    state.runner.memoryUsed = 4;
    state.runner.memoryLimit = 4;
    state.specialZones = { setAside: [targetId] } as SpecialZoneState;
    state.cardInstances[sourceId] = instance(
      sourceId,
      SHELL_TRADERS_ID,
      "runner",
      "rig",
    );
    state.cardInstances[targetId] = {
      ...instance(targetId, "program_a", "runner", "set_aside"),
      zone: {
        side: "special",
        zone: "set_aside",
        visibility: "public",
        returnZone: { side: "runner", zone: "rig" },
      },
    } as CardInstance;
    setCounter(state, targetId, "shell", 2);
    const host = testHost(state, {
      [SHELL_TRADERS_ID]: definition(SHELL_TRADERS_ID, "resource"),
      program_a: definition("program_a", "program", {
        installCost: 2,
        memoryCost: 1,
      }),
    });
    const effects: ResolvedGameEffect[] = [];

    expect(delayedInstallPreparedTargetIds(host)).toEqual([targetId]);
    applyDelayedInstallStartOfTurn(host, effects);

    expect(counter(state, targetId, "shell")).toBe(1);
    expect(state.specialZones?.setAside).toEqual([targetId]);
    expect(state.runner.rig.programs).toEqual([]);
    expect(state.runner.memoryUsed).toBe(4);
    expect(effects).toHaveLength(1);
    expect(delayedInstallPreparedTargetIds(host)).toEqual([]);
  });

  it("starts the same Self-Modifying Code hidden-zone search after trashing source", () => {
    const sourceId = "smc_1" as CardInstanceId;
    const stackProgramId = "stack_program" as CardInstanceId;
    const state = baseState();
    state.timingPoint = "run.encounter_ice";
    state.run = { runId: "run_1", attackedServerId: "rd", encounteredIceId: "ice_1" as CardInstanceId } as any;
    state.runner.rig.programs = [sourceId];
    state.runner.stack = [stackProgramId];
    state.cardInstances[sourceId] = instance(sourceId, SELF_MODIFYING_CODE_ID, "runner", "rig");
    state.cardInstances[stackProgramId] = instance(stackProgramId, "stack_program_def", "runner", "stack");
    const activations: CardInstanceId[] = [];
    const host = testHost(
      state,
      {
        [SELF_MODIFYING_CODE_ID]: definition(SELF_MODIFYING_CODE_ID, "program"),
        stack_program_def: definition("stack_program_def", "program"),
      },
      {
        startHiddenStackProgramInstallActivation: (sourceCardId) => {
          activations.push(sourceCardId);
          state.pendingChoice = {
            id: "choice_smc",
            source: `v1911.self_modifying_code:${sourceCardId}`,
            kind: "select_cards",
            prompt: "Programm waehlen",
            options: [],
            minSelections: 0,
            maxSelections: 1,
            stateVersion: state.stateVersion + 1,
            visibility: "hidden_info_barrier",
          } as any;
        },
      },
    );
    const action = triggerAction(state, {
      cardId: sourceId,
      v1911HiddenZoneAbility: "hidden_stack_program_install",
    });

    handleRunnerSpecialTriggerExecution(host, action);

    expect(state.runner.rig.programs).toEqual([]);
    expect(state.runner.heap).toEqual([sourceId]);
    expect(activations).toEqual([sourceId]);
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(action.payload).toMatchObject({
      hiddenZoneBarrier: true,
      sourceDefinitionId: SELF_MODIFYING_CODE_ID,
      hiddenZoneAction: "hidden_stack_program_install",
      trashOnUse: true,
      trashedCardDefinitionId: SELF_MODIFYING_CODE_ID,
    });
  });

  it("does not import from the public engine index", () => {
    const source = readFileSync(
      new URL("./runner-special-trigger-execution.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain('from "../index"');
    expect(source).not.toContain("from '../index'");
    expect(source).not.toContain('from "../../index"');
    expect(source).not.toContain("from '../../index'");
  });
});

function baseState(): GameState {
  const state = createGame({
    seed: "arch-71-runner-special-base",
    setupMode: "completed",
  });
  state.phase = "runner_action_phase";
  state.activeSide = "runner";
  state.runner.clicks = 0;
  state.runner.credits = 0;
  state.runner.grip = [];
  state.runner.heap = [];
  state.runner.stack = [];
  state.runner.rig.programs = [];
  state.runner.rig.hardware = [];
  state.runner.rig.resources = [];
  state.runner.memoryUsed = 0;
  state.runner.memoryLimit = 4;
  state.cardInstances = {};
  return state;
}

function triggerAction(
  state: GameState,
  payload: LegalAction["payload"],
  costs: LegalAction["costs"] = [],
): LegalAction {
  return buildLegalAction(
    state,
    "runner",
    "trigger_ability",
    "Trigger ausloesen",
    "card",
    costs,
    payload,
  );
}

type HostOverrides = {
  startHiddenStackProgramInstallActivation?: (
    sourceCardId: CardInstanceId,
    legalAction: LegalAction,
  ) => void;
};

function testHost(
  state: GameState,
  definitions: Record<string, CardDefinition> = {},
  overrides: HostOverrides = {},
): RunnerSpecialTriggerExecutionHost {
  return {
    state,
    actions: {
      spendClick: (stateToMutate, side) => {
        if (side === "runner") stateToMutate.runner.clicks -= 1;
        else stateToMutate.corp.clicks -= 1;
      },
    },
    cards: {
      definitionFor: (stateToRead, cardId) => {
        const card = stateToRead.cardInstances[cardId];
        if (!card) throw new Error(`CardInstance fehlt: ${cardId}`);
        const definitionForCard = definitions[card.definitionId];
        if (!definitionForCard)
          throw new Error(`Definition fehlt: ${card.definitionId}`);
        return definitionForCard;
      },
      mustInstance: (source, cardId) => {
        const card = source[cardId];
        if (!card) throw new Error(`CardInstance fehlt: ${cardId}`);
        return card;
      },
      isUniqueCard: () => false,
      hasInstalledUniqueCardDefinition: () => false,
      hasCardImplementationMemoryUnitModifier: () => false,
      shouldLoadLegacyRecurringCredits: (definitionToRead) =>
        (definitionToRead.recurringCredits ?? 0) > 0,
      publicTitle: (definitionId) => String(definitionId),
    },
    credits: {
      spend: (stateToMutate, side, amount) => {
        if (side === "runner") stateToMutate.runner.credits -= amount;
        else stateToMutate.corp.credits -= amount;
      },
    },
    counters: {
      cardCounter: counter,
      setCardCounter: setCounter,
      addCardCounter: (stateToMutate, cardId, counterType, amount) =>
        setCounter(
          stateToMutate,
          cardId,
          counterType,
          counter(stateToMutate, cardId, counterType) + amount,
        ),
      spendCardCounter: (stateToMutate, cardId, counterType, amount) =>
        setCounter(
          stateToMutate,
          cardId,
          counterType,
          Math.max(0, counter(stateToMutate, cardId, counterType) - amount),
        ),
    },
    zones: {
      removeFromAllZones,
      ensureSpecialZones: (stateToMutate) =>
        (stateToMutate.specialZones ??= {
          setAside: [],
          removedFromGame: [],
        } as SpecialZoneState),
      trashRunnerInstalledCardToHeap: (stateToMutate, cardId) => {
        removeFromAllZones(stateToMutate, cardId);
        stateToMutate.runner.heap.push(cardId);
        stateToMutate.cardInstances[cardId] = {
          ...stateToMutate.cardInstances[cardId]!,
          zone: { side: "runner", zone: "heap" },
          faceup: true,
          rezzed: true,
        };
      },
    },
    runner: {
      runnerMemoryLimit: (stateToRead) => stateToRead.runner.memoryLimit,
    },
    hiddenZone: {
      startHiddenStackProgramInstallActivation:
        overrides.startHiddenStackProgramInstallActivation ??
        (() => undefined),
    },
    constants: {
      BUTCHER_BOY_ID: "butcher_boy",
      JUNKYARD_BBS_ID,
      SELF_MODIFYING_CODE_ID,
      SHELL_TRADERS_ID,
      SKIVVISS_ID: "skivviss",
    },
  };
}

function removeFromAllZones(state: GameState, cardId: CardInstanceId): void {
  state.runner.grip = state.runner.grip.filter((id) => id !== cardId);
  state.runner.stack = state.runner.stack.filter((id) => id !== cardId);
  state.runner.heap = state.runner.heap.filter((id) => id !== cardId);
  state.runner.rig.programs = state.runner.rig.programs.filter(
    (id) => id !== cardId,
  );
  state.runner.rig.hardware = state.runner.rig.hardware.filter(
    (id) => id !== cardId,
  );
  state.runner.rig.resources = state.runner.rig.resources.filter(
    (id) => id !== cardId,
  );
  if (state.specialZones)
    state.specialZones.setAside = (state.specialZones.setAside ?? []).filter(
      (id) => id !== cardId,
    );
}

function counter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
): number {
  const value = (state.cardInstances[cardId] as any)?.counters?.[counterType];
  return Math.max(0, Math.floor(Number(value ?? 0)));
}

function setCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
  amount: number,
): void {
  const card = state.cardInstances[cardId];
  if (!card) throw new Error(`CardInstance fehlt: ${cardId}`);
  (card as any).counters = {
    ...((card as any).counters ?? {}),
    [counterType]: Math.max(0, Math.floor(amount)),
  };
}

function instance(
  id: CardInstanceId,
  definitionId: string,
  owner: Side,
  zone: "grip" | "heap" | "rig" | "set_aside" | "stack",
): CardInstance {
  const zoneState =
    zone === "set_aside"
      ? { side: "special", zone: "set_aside", visibility: "public" }
      : { side: owner, zone };
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
    zone: zoneState,
  } as unknown as CardInstance;
}

function definition(
  id: CardDefinitionId,
  type: CardDefinition["type"],
  extras: Partial<CardDefinition> = {},
): CardDefinition {
  return {
    id,
    title: String(id),
    side: type === "asset" || type === "ice" || type === "upgrade" ? "corp" : "runner",
    type,
    mechanics: [],
    ...extras,
  } as CardDefinition;
}
