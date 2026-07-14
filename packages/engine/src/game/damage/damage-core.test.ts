import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import {
  addRunnerTagsWithPrevention,
  configureDamageCoreHost,
  doDamage,
  resetDamageCoreHostForTests,
  resolveDamageOperation,
  resolveEventModificationChoice,
  resolveReplacementChoice,
  type DamageCoreHost,
} from "./damage-core";

describe("damage core", () => {
  afterEach(() => {
    resetDamageCoreHostForTests();
  });

  it("applies net damage by moving Runner grip cards to heap", () => {
    const gripCardId = "grip_1" as CardInstanceId;
    const state = minimalState({
      cardInstances: {
        [gripCardId]: instance(gripCardId, "grip_card", "runner", "grip"),
      },
      runnerGrip: [gripCardId],
    });
    configureDamageCoreHost(testHost());

    const summary = doDamage(state, {
      damageId: "damage_1",
      damageType: "net",
      amount: 1,
      source: "test",
    });

    expect(summary).toEqual({
      damageType: "net",
      amount: 1,
      cardsTrashed: 1,
      flatline: false,
      runnerGripBefore: 1,
      runnerGripAfter: 0,
    });
    expect(state.runner.grip).toEqual([]);
    expect(state.runner.heap).toEqual([gripCardId]);
    expect(state.cardInstances[gripCardId]?.zone).toEqual({
      side: "runner",
      zone: "heap",
    });
  });

  it("keeps flatline timing and state markers stable", () => {
    const state = minimalState({ cardInstances: {}, runnerGrip: [] });
    state.run = { runId: "run_1", attackedServerId: "rd" } as any;
    configureDamageCoreHost(testHost());

    const summary = doDamage(state, {
      damageId: "flatline_1",
      damageType: "meat",
      amount: 1,
      source: "test",
    });

    expect(summary).toMatchObject({
      damageType: "meat",
      amount: 1,
      cardsTrashed: 0,
      flatline: true,
    });
    expect(state.winner).toBe("corp");
    expect(state.gameEndReason).toBe("flatline");
    expect(state.phase).toBe("game_over");
    expect(state.timingPoint).toBe("game.checkpoint");
    expect(state.activeSide).toBe("corp");
    expect(state.run).toBeUndefined();
  });

  it("opens and resolves damage prevention choices with stable metadata", () => {
    const gripCardId = "grip_1" as CardInstanceId;
    const state = minimalState({
      cardInstances: {
        [gripCardId]: instance(gripCardId, "grip_card", "runner", "grip"),
      },
      runnerGrip: [gripCardId],
    });
    state.eventModificationHarness = {
      damagePrevention: { side: "runner", preventAmount: 1 },
    };
    configureDamageCoreHost(testHost());
    const action = actionFor("corp", "play_operation");

    resolveDamageOperation(state, action, "net", 1, "damage_source");

    expect(state.pendingChoice).toMatchObject({
      source: "v120.event_modification.prevent",
      kind: "select_option",
      side: "runner",
    });
    expect(action.payload).toMatchObject({
      eventModificationWindowOpened: true,
      eventModificationKind: "prevent",
      imminentEventType: "damage",
      redactedKind: "event_modification",
    });
    const preventOption = state.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    const choiceAction = actionFor("runner", "resolve_choice");

    resolveEventModificationChoice(
      state,
      choiceAction,
      playerChoice(String(preventOption)),
    );

    expect(state.pendingChoice).toBeUndefined();
    expect(state.eventModificationWindow).toBeUndefined();
    expect(state.imminentEvent).toBeUndefined();
    expect(state.runner.grip).toEqual([gripCardId]);
    expect(choiceAction.payload).toMatchObject({
      eventModificationDecision: "apply",
      eventModificationOutcome: "prevented",
      originalAmount: 1,
      preventedAmount: 1,
      finalAmount: 0,
      damageResolved: true,
      damageAmount: 0,
    });
  });

  it("chains public tag-avoidance sources until every incoming tag is handled", () => {
    const fallGuyId = "fall_guy_1" as CardInstanceId;
    const nomadId = "nomad_allies_1" as CardInstanceId;
    const state = minimalState({
      cardInstances: {
        [fallGuyId]: {
          ...instance(fallGuyId, "onr_v1_161_fall-guy", "runner", "grip"),
          faceup: true,
          rezzed: true,
          zone: { side: "runner", zone: "rig" },
        } as CardInstance,
        [nomadId]: {
          ...instance(nomadId, "onr_v1_170_nomad-allies", "runner", "grip"),
          faceup: true,
          rezzed: true,
          zone: { side: "runner", zone: "rig" },
        } as CardInstance,
      },
      runnerGrip: [],
    });
    state.runner.rig.resources = [fallGuyId, nomadId];
    configureDamageCoreHost(testHost());
    const initiatingAction = actionFor("corp", "play_operation");

    expect(
      addRunnerTagsWithPrevention(state, initiatingAction, 2, "trace:test"),
    ).toBe(true);
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: "v120.event_modification.avoid",
      prompt: "Tag vermeiden",
    });

    const firstChoice = actionFor("runner", "resolve_choice");
    resolveEventModificationChoice(
      state,
      firstChoice,
      playerChoice(
        String(
          state.pendingChoice?.options.find((option) =>
            option.id.includes(String(fallGuyId)),
          )?.id,
        ),
      ),
    );
    expect(state.runner.tags).toBe(0);
    expect(state.runner.heap).toContain(fallGuyId);
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      prompt: "Tag vermeiden",
    });
    expect(
      state.pendingChoice?.options.some((option) =>
        option.id.includes(String(nomadId)),
      ),
    ).toBe(true);

    const secondChoice = actionFor("runner", "resolve_choice");
    resolveEventModificationChoice(
      state,
      secondChoice,
      playerChoice(
        String(
          state.pendingChoice?.options.find((option) =>
            option.id.includes(String(nomadId)),
          )?.id,
        ),
      ),
    );
    expect(state.runner.tags).toBe(0);
    expect(state.runner.heap).toEqual(
      expect.arrayContaining([fallGuyId, nomadId]),
    );
    expect(state.pendingChoice).toBeUndefined();
    expect(state.eventModificationWindow).toBeUndefined();
    expect(state.imminentEvent).toBeUndefined();
  });

  it("continues prevention after an automatic avoid-next-tag credit", () => {
    const fallGuyId = "fall_guy_after_automatic_avoid" as CardInstanceId;
    const state = minimalState({
      cardInstances: {
        [fallGuyId]: {
          ...instance(fallGuyId, "onr_v1_161_fall-guy", "runner", "grip"),
          faceup: true,
          rezzed: true,
          zone: { side: "runner", zone: "rig" },
        } as CardInstance,
      },
      runnerGrip: [],
    });
    state.runner.rig.resources = [fallGuyId];
    state.runnerTagAvoidanceCredits = 1;
    configureDamageCoreHost(testHost());
    const initiatingAction = actionFor("corp", "play_operation");

    expect(
      addRunnerTagsWithPrevention(state, initiatingAction, 2, "trace:test"),
    ).toBe(true);
    expect(state.runnerTagAvoidanceCredits).toBe(0);
    expect(state.runner.tags).toBe(0);
    expect(initiatingAction.payload).toMatchObject({
      tagsAdded: 0,
      preventedTags: 1,
      tagAvoidanceCreditsAfter: 0,
      eventModificationWindowOpened: true,
    });
    const avoidOption = state.pendingChoice?.options.find((option) =>
      option.id.includes(String(fallGuyId)),
    )?.id;
    resolveEventModificationChoice(
      state,
      actionFor("runner", "resolve_choice"),
      playerChoice(String(avoidOption)),
    );

    expect(state.runner.tags).toBe(0);
    expect(state.runner.heap).toContain(fallGuyId);
    expect(state.pendingChoice).toBeUndefined();
  });

  it("charges Vintage Camaro credits and future-action debt when avoiding a tag", () => {
    const camaroId = "vintage_camaro_1" as CardInstanceId;
    const state = minimalState({
      cardInstances: {
        [camaroId]: {
          ...instance(
            camaroId,
            "onr_classic_051_vintage-camaro",
            "runner",
            "grip",
          ),
          faceup: true,
          rezzed: true,
          zone: { side: "runner", zone: "rig" },
        } as CardInstance,
      },
      runnerGrip: [],
    });
    state.runner.credits = 1;
    state.runner.rig.hardware = [camaroId];
    configureDamageCoreHost(testHost());
    const initiatingAction = actionFor("corp", "play_operation");

    expect(
      addRunnerTagsWithPrevention(state, initiatingAction, 1, "trace:test"),
    ).toBe(true);
    const avoidOption = state.pendingChoice?.options.find((option) =>
      option.id.includes(String(camaroId)),
    )?.id;
    const choiceAction = actionFor("runner", "resolve_choice");
    resolveEventModificationChoice(
      state,
      choiceAction,
      playerChoice(String(avoidOption)),
    );

    expect(state.runner.tags).toBe(0);
    expect(state.runner.credits).toBe(0);
    expect(state.runner.rig.hardware).toContain(camaroId);
    expect(state.runnerTurnFlags?.forgoNextActionsPending).toBe(1);
    expect(choiceAction.payload).toMatchObject({
      eventModificationOutcome: "avoided",
      sourceDefinitionId: "onr_classic_051_vintage-camaro",
      paidCredits: 1,
      runnerForgoNextActions: 1,
      tagsAdded: 0,
    });
  });

  it("opens and resolves replacement choices without changing payload markers", () => {
    const gripCardId = "grip_1" as CardInstanceId;
    const state = minimalState({
      cardInstances: {
        [gripCardId]: instance(gripCardId, "grip_card", "runner", "grip"),
      },
      runnerGrip: [gripCardId],
    });
    state.eventModificationHarness = {
      damageReplacement: { side: "runner", tagAmount: 2 },
    };
    configureDamageCoreHost(testHost());
    const action = actionFor("corp", "play_operation");

    resolveDamageOperation(state, action, "net", 1, "damage_source");

    expect(state.pendingChoice).toMatchObject({
      source: "v121.replacement.damage",
      kind: "select_option",
      side: "runner",
    });
    expect(action.payload).toMatchObject({
      replacementWindowOpened: true,
      originalEventType: "damage",
      redactedKind: "replacement",
    });
    const replacementOption = state.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    const choiceAction = actionFor("runner", "resolve_choice");

    resolveReplacementChoice(
      state,
      choiceAction,
      playerChoice(String(replacementOption)),
    );

    expect(state.pendingChoice).toBeUndefined();
    expect(state.replacementWindow).toBeUndefined();
    expect(state.imminentEvent).toBeUndefined();
    expect(state.runner.tags).toBe(2);
    expect(state.runner.grip).toEqual([gripCardId]);
    expect(choiceAction.payload).toMatchObject({
      replacementDecision: "apply",
      replacementOutcome: "replaced",
      replacementEventType: "add_tag",
      originalAmount: 1,
      tagsAdded: 2,
      sourceKind: "test_harness",
    });
  });

  it("does not import from index.ts", () => {
    const source = readFileSync(
      new URL("./damage-core.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
  });
});

function minimalState(input: {
  cardInstances: Record<CardInstanceId, CardInstance>;
  runnerGrip: CardInstanceId[];
}): GameState {
  return {
    matchId: "match_1",
    stateVersion: 1,
    randomCounter: 0,
    randomDrawRecords: [],
    activeSide: "corp",
    phase: "corp_action_phase",
    timingPoint: "corp_action.main",
    runner: {
      identity: "runner_identity" as CardInstanceId,
      clicks: 4,
      credits: 5,
      stack: [],
      grip: [...input.runnerGrip],
      heap: [],
      scoreArea: [],
      tags: 0,
      coreDamage: 0,
      memoryUsed: 0,
      memoryLimit: 4,
      rig: { programs: [], hardware: [], resources: [] },
    },
    corp: {
      clicks: 3,
      credits: 5,
      rd: [],
      hq: [],
      archives: [],
      scoreArea: [],
      badPublicity: 0,
      servers: [],
    },
    cardInstances: {
      runner_identity: instance(
        "runner_identity" as CardInstanceId,
        "runner_identity_def",
        "runner",
        "identity",
      ),
      ...input.cardInstances,
    },
    eventLog: [],
  } as unknown as GameState;
}

function definition(id: string, type: CardDefinition["type"]): CardDefinition {
  return {
    id: id as CardDefinitionId,
    title: id,
    type,
    installCost: 0,
    rezCost: 0,
    agendaPoints: 0,
    advancementRequirement: 0,
    mechanics: [],
    subtypes: [],
  } as unknown as CardDefinition;
}

function instance(
  id: CardInstanceId,
  definitionId: string,
  owner: "corp" | "runner",
  runnerZone: "grip" | "heap" | "identity",
): CardInstance {
  return {
    id,
    definitionId: definitionId as CardDefinitionId,
    owner,
    controller: owner,
    faceup: runnerZone !== "grip",
    rezzed: runnerZone !== "grip",
    zone: { side: "runner", zone: runnerZone },
  } as unknown as CardInstance;
}

function actionFor(
  side: "corp" | "runner",
  type: LegalAction["type"],
): LegalAction {
  return {
    actionId: `${side}.${type}`,
    type,
    side,
    label: type,
    source: "test",
    timing: "main",
    costs: [],
    payload: {},
  } as unknown as LegalAction;
}

function playerChoice(optionId: string): PlayerAction {
  return {
    actionId: "choice",
    side: "runner",
    type: "resolve_choice",
    stateVersion: 1,
    selectedChoices: { selectedOptionIds: [optionId] },
  } as unknown as PlayerAction;
}

function testHost(): DamageCoreHost {
  return {
    cards: {
      definitionFor: (state, cardId) => {
        const definitionId = state.cardInstances[cardId]?.definitionId;
        if (!definitionId) throw new Error(`Definition fehlt: ${cardId}`);
        if (definitionId === "runner_identity_def")
          return { ...definition(definitionId, "identity"), baseLink: 0 };
        return definition(definitionId, "program");
      },
      runnerInstalledCardIds: (state) => [
        ...state.runner.rig.programs,
        ...state.runner.rig.hardware,
        ...state.runner.rig.resources,
      ],
      scoredCorpAgendaIds: (state) => [...state.corp.scoreArea],
      scoredAgendaKindForDefinition: () => undefined,
    },
    zones: {
      removeFromAllZones: (state, cardId) => {
        state.runner.grip = state.runner.grip.filter((id) => id !== cardId);
        state.runner.heap = state.runner.heap.filter((id) => id !== cardId);
        state.runner.stack = state.runner.stack.filter((id) => id !== cardId);
      },
      trashRunnerInstalledCardToHeap: (state, cardId) => {
        state.runner.rig.programs = state.runner.rig.programs.filter(
          (id) => id !== cardId,
        );
        state.runner.rig.hardware = state.runner.rig.hardware.filter(
          (id) => id !== cardId,
        );
        state.runner.rig.resources = state.runner.rig.resources.filter(
          (id) => id !== cardId,
        );
        state.runner.heap.push(cardId);
      },
      returnRunnerInstalledCardToGrip: (state, cardId) => {
        state.runner.grip.push(cardId);
      },
    },
    runner: {
      drawRunnerCard: (state) => {
        const cardId = state.runner.stack.shift();
        if (cardId) state.runner.grip.push(cardId);
      },
      ensureRunnerTurnFlags: (state) => {
        state.runnerTurnFlags ??= {
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
          bonusRunPending: false,
          forgoNextActionPending: false,
          forgoNextActionsPending: 0,
          runLockActionsPending: 0,
          runnerRunLockCreditCost: 0,
          valuPakProgramInstallActionsRemaining: 0,
          valuPakTemporaryProgramInstallCredits: 0,
          delayedInstallStartTurnResolvedSourceIds: [],
          successfulRunExtraRunPending: false,
          successfulRunExtraRunUsedThisTurn: false,
        };
        return state.runnerTurnFlags;
      },
      addFutureActionDebt: (state, amount) => {
        const flags = (state.runnerTurnFlags ??= {} as any);
        flags.forgoNextActionsPending =
          Math.max(0, Math.floor(flags.forgoNextActionsPending ?? 0)) + amount;
      },
    },
    corp: {
      agendaPointTotal: () => 0,
      chooseAgendasForPointCost: () => [],
      agendaPointsForScoredCard: () => 0,
      forfeitAgendaForPointCost: () => undefined,
      spendAgendaPointCost: () => ({
        paidPoints: 0,
        bonusPointsSpent: 0,
        spentAgendaIds: [],
        spentAgendaDefinitionIds: [],
      }),
    },
    counters: {
      cardCounter: () => 0,
      spendCardCounter: () => undefined,
    },
    credits: {
      gain: (state, side, amount) => {
        state[side].credits += amount;
      },
      spend: (state, side, amount) => {
        state[side].credits -= amount;
      },
    },
    rng: {
      nextRandom: (state) => {
        state.randomCounter += 1;
        return 0;
      },
    },
  };
}
