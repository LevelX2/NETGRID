import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CounterType,
  GameState,
  LegalAction,
  RunState,
  ServerId,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createGameCardImplementationRuntimeDeps,
  type GameCardImplementationRuntimeDepsHost,
} from "./card-implementation-runtime-deps";

const sourceCardId = "source" as CardInstanceId;
const sourceDefinitionId = "source_def" as CardDefinitionId;

function state(): GameState {
  return {
    matchId: "match",
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
      hq: ["hq_a", "hq_b"] as CardInstanceId[],
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
        rezzed: true,
        zone: { side: "runner", zone: "rig", rigType: "program" },
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

function definition(id: CardDefinitionId = sourceDefinitionId): CardDefinition {
  return {
    id,
    title: String(id),
    type: "program",
  } as CardDefinition;
}

function host(calls: string[] = []): GameCardImplementationRuntimeDepsHost {
  return {
    cards: {
      definitionFor: (_state, cardId) =>
        definition(
          cardId === sourceCardId
            ? sourceDefinitionId
            : (`${cardId}_def` as CardDefinitionId),
        ),
      mustInstance: (instances, cardId) =>
        instances[cardId] ??
        ({
          id: cardId,
          definitionId: `${cardId}_def` as CardDefinitionId,
          rezzed: true,
          zone: { side: "runner", zone: "rig", rigType: "program" },
        } as unknown as CardInstance),
      rezzedCorpRootCardIds: () => [],
      runnerInstalledCardIds: () => [],
    },
    credits: {
      spendClick: () => undefined,
      spendCredits: () => undefined,
    },
    actions: {
      createAction: () => action(),
      appendResolvedEffectsToPayload: () => undefined,
    },
    run: {
      startRun: (gameState, serverId, accessCount, options) => {
        calls.push(`start_run:${serverId}:${accessCount}`);
        gameState.run = {
          attackedServerId: serverId,
          phase: "approach_ice",
          runnerRunTemporaryCredits: options.runnerRunTemporaryCredits,
        } as unknown as RunState;
      },
    },
    hiddenZone: {
      runtimeDepsHost: {
        cards: {
          runnerInstalledCardIds: () => [],
          topRunnerHeapCardId: () => undefined,
        },
        hiddenZone: {
          searchActivationTargetHost: () => ({} as never),
          searchActivationHandlerHost: () => ({} as never),
          arrangeChoiceHandlerHost: () => ({} as never),
          nonSearchChoiceHandlerHost: () => ({} as never),
          corpZoneChoiceHandlerHost: () => ({} as never),
        },
        callbacks: {
          startRunnerPrivateLookChoice: () => true,
          exposeInstalledCorpCardTargets: () => [],
          exposeInstalledCorpCard: () => ({ publicPayload: {} }),
          startExposeInstalledCorpCardsChoice: () => ({ publicPayload: {} }),
          exposeOutermostIceOfEachDataFort: () => ({ publicPayload: {} }),
          outermostIceExposures: () => [],
          shuffleGripTrashAndStackThenDrawForCardImplementation: () => ({
            publicPayload: {},
          }),
        },
      },
      startCorpDiscardHqWithRetainPayment: () => ({ publicPayload: {} }),
    },
    install: {
      runtimeDepsHost: {
        cards: { definitionFor: (_state, cardId) => definition(`${cardId}_def` as CardDefinitionId) },
        install: { runnerInstallableProgramIdsForValuPak: () => [] },
        rez: {
          affordableRezzedInstalledIceIdsForRunner: () => [],
          unrezzedInstalledIceIds: () => [],
          installedIceIds: () => [],
          rezzedBlackIceIds: () => [],
          startCoreCommandJettisonIceChoice: () => undefined,
          startSecurityCodeWormChipTrashIceChoice: () => undefined,
          startForgedActivationOrdersTargetChoice: () => undefined,
          startAnonymousTipDerezBlackIceChoice: () => undefined,
        },
        runner: {
          ensureTurnFlags: (gameState) =>
            (gameState.runnerTurnFlags ??= {
              stoleAgendaThisTurn: false,
              stoleAgendaLastTurn: false,
            } as NonNullable<GameState["runnerTurnFlags"]>),
        },
      },
    },
    trace: {
      trace: {
        orchestrationHost: () => ({} as never),
        resolveRunnerLastTurnInstalledResourceTargetId: () => undefined,
      },
    },
    counters: {
      counters: {
        cardCounter: () => 0,
        addCounterToAllInstalledRunnerIcebreakers: (
          _state,
          counterType,
          amount,
        ) => ({
          amount,
          counterType: counterType as Extract<
            CounterType,
            "militech" | "breaker_strength_penalty"
          >,
          countersAfter: amount,
          publicPayload: {},
        }),
      },
      lifecycle: {
        hasSuccessfulHqRunThisTurn: () => false,
        runnerLiberatedAgendaSubtypeThisTurn: () => false,
        corpScoredBlackOpsAgendaLastTurn: () => false,
      },
    },
    callbacks: {
      effectAdapters: {
        drawCards: () => ({ drawnCount: 0, publicPayload: {} }),
        addHostedCredits: (_state, _sourceCardId, amount) => ({
          amount,
          hostedCreditsAfter: amount,
          publicPayload: {},
        }),
        addCountersToSource: (_state, _sourceCardId, counterType, amount) => ({
          amount,
          counterType,
          countersAfter: amount,
          publicPayload: {},
        }),
        takeHostedCredits: (_state, _sourceCardId, _side, amount) => ({
          amount: amount === "all" ? 1 : amount,
          hostedCreditsAfter: 0,
          publicPayload: {},
        }),
        trashSourceWhenEmpty: () => ({ sourceTrashed: false }),
        trashSource: () => ({ sourceTrashed: true, publicPayload: {} }),
      },
      shuffleSourceIntoCorpRd: () => ({ publicPayload: { shuffled: true } }),
      trashCorpInstalledCardsInSourceServer: () => ({
        publicPayload: { trashed: true },
      }),
      awardRunnerEventAgendaPoint: (_state, legalAction, id) => {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          sourceDefinitionId: id,
          agendaPointsGained: 1,
        };
      },
      discardRandomCorpHqCards: (_state, _sourceDefinitionId, count) =>
        Array.from({ length: count }, (_, index) =>
          `discarded_${index}` as CardInstanceId,
        ),
      startDistributeAdvancementCounters: () => ({
        publicPayload: { advancementCounterChoiceOpened: true },
      }),
      startMoveAdvancementCounters: () => ({
        publicPayload: { advancementCounterMoveChoiceOpened: true },
      }),
      rezInstalledIceWithLifecycleCounters: () => ({
        publicPayload: { freeRez: true },
      }),
      replaceFortCardsFromHq: () => ({
        publicPayload: { replacedFortCards: true },
      }),
      trashTopCorpRdCards: () => ({
        publicPayload: { trashedCardsCount: 2 },
      }),
      rezCostForCard: () => 0,
      startPaidSourceReturnToGripChoice: () => {
        calls.push("return_choice");
      },
      startCorpChoiceDerezLastRezzedBlackIceOrBadPublicityChoice: () => {
        calls.push("senatorial_field_trip_choice");
        return { publicPayload: { choiceOpened: true } };
      },
    },
  };
}

describe("game card implementation runtime deps root", () => {
  it("creates the full CardImplementation RuntimeDeps surface", () => {
    const deps = createGameCardImplementationRuntimeDeps(host());

    expect(Object.keys(deps).sort()).toEqual(
      [
        "definitionFor",
        "mustInstance",
        "cardCounter",
        "rezzedCorpRootCardIds",
        "runnerInstalledCardIds",
        "runnerRunAttemptsLastTurn",
        "runnerRunAttemptsThisGame",
        "runnerTrashedAdvertisementThisTurn",
        "runnerTrashedNodeLastTurn",
        "runnerTrashedTransactionsThisTurn",
        "runnerInstalledResourceLastTurn",
        "runnerWasDamagedDuringLastThreeActions",
        "runnerMadeSuccessfulRunOnServerThisTurn",
        "runnerLiberatedAgendaSubtypeThisTurn",
        "corpScoredAgendaSubtypeLastTurn",
        "spendClick",
        "spendCredits",
        "createAction",
        "appendResolvedEffectsToPayload",
        "drawCards",
        "damageRunner",
        "unpreventableDamageRunner",
        "startTrace",
        "startRun",
        "startPrivateLook",
        "exposeInstalledCorpCardTargets",
        "exposeInstalledCorpCard",
        "startExposeInstalledCorpCardsChoice",
        "exposeOutermostIceEachDataFort",
        "outermostIceEachDataFortExposeCount",
        "startShowHqAgendasForCreditsChoice",
        "searchTrashToGripTargetCount",
        "searchStackToGripTargetCount",
        "topTrashToGripTargetCount",
        "topTrashToGripTargetId",
        "searchStackInstallTargetCount",
        "stackOrTrashProgramInstallTargetCount",
        "lookTopStackShowToCorpThenInstallMatchingTargetCount",
        "lookTopStackTakeMatchingTargetCount",
        "startSearchTrashToGripChoice",
        "startSearchStackToGripChoice",
        "moveTopTrashToGrip",
        "startSearchStackInstallChoice",
        "startStackOrTrashProgramInstallChoice",
        "startLookTopStackShowToCorpThenInstallMatchingChoice",
        "startLookTopStackTakeMatchingChoice",
        "startLookTopStackTakeOneArrangeRestChoice",
        "trashOwnInstalledCardTargetCount",
        "trashGripCardTargetCount",
        "startTrashOwnInstalledCardsForCreditsChoice",
        "startTrashCardsFromGripForCreditsChoice",
        "shuffleGripTrashAndStackThenDraw",
        "rezzedIceTargetCount",
        "unrezzedIceTargetCount",
        "installedIceTargetCount",
        "rezzedBlackIceTargetCount",
        "corpHqCardCount",
        "runnerValuPakInstallableProgramCount",
        "startPayRezCostToTrashRezzedIceChoice",
        "startTrashUnrezzedIceChoice",
        "startCorpChoiceRezOrTrashIceChoice",
        "startDerezRezzedBlackIceChoice",
        "startCorpDiscardHqWithRetainPayment",
        "startRunnerProgramInstallActionBundle",
        "addCounterToAllInstalledRunnerIcebreakers",
        "shuffleSourceIntoCorpRd",
        "trashCorpInstalledCardsInSourceServer",
        "gainRunnerEventAgendaPoint",
        "corpRandomDiscardFromHq",
        "addHostedCredits",
        "addCountersToSource",
        "removeRunnerTags",
        "avoidNextTag",
        "returnSourceToGripIfPaid",
        "takeHostedCredits",
        "trashSourceWhenEmpty",
        "trashSource",
        "startDistributeAdvancementCounters",
        "startMoveAdvancementCounters",
        "rezInstalledIceWithLifecycleCounters",
        "replaceFortCardsFromHq",
        "trashTopCorpRdCards",
        "rezCostForCard",
        "startCorpChoiceDerezLastRezzedBlackIceOrBadPublicityChoice",
        "addCurrentEncounterAdditionalSubroutine",
        "addCurrentRunAccessCount",
        "passCurrentEncounteredIce",
        "revealHiddenRunnerResource",
        "abilityLimits",
      ].sort(),
    );
  });

  it("keeps the CardImplementation start-run adapter semantics", () => {
    const calls: string[] = [];
    const deps = createGameCardImplementationRuntimeDeps(host(calls));
    const gameState = state();
    const legalAction = action();

    const result = deps.startRun(gameState, legalAction, "hq", {
      accessCount: 2,
      followupRunOnEnd: "optional",
      bypassFirstIce: true,
      runTraceLinkBonus: 3,
      runTemporaryCredits: {
        side: "runner",
        amount: 4,
        usableFor: "any_runner_cost_during_this_run",
        returnUnusedAtRunEnd: true,
      },
      afterRunCompletedUnpreventableCoreDamage: 1,
    });

    expect(calls).toEqual(["start_run:hq:2"]);
    expect(gameState.run?.runnerRunTemporaryCredits).toEqual({
      sourceDefinitionId,
      remaining: 4,
      returnUnusedAtRunEnd: true,
    });
    expect(result.publicPayload).toMatchObject({
      bonusRunOnFinish: true,
      bypassFirstIce: true,
      runTraceLinkBonus: 3,
      runTraceLinkBonusSourceDefinitionId: sourceDefinitionId,
      v1922RunnerEventAbility: "run_temporary_credits",
      temporaryRunCredits: 4,
      temporaryRunCreditsRemaining: 4,
      afterRunUnpreventableCoreDamage: 1,
    });
  });

  it("keeps direct movement, random, and source-return delegates stable", () => {
    const calls: string[] = [];
    const deps = createGameCardImplementationRuntimeDeps(host(calls));
    const gameState = state();
    const legalAction = action();

    expect(
      deps.corpRandomDiscardFromHq(gameState, sourceDefinitionId, 2)
        .publicPayload,
    ).toEqual({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "hq_random_discard",
      discardedCardsCount: 2,
    });
    expect(deps.returnSourceToGripIfPaid(gameState, legalAction, sourceCardId, 2))
      .toEqual({
        choiceOpened: true,
        publicPayload: {
          v1922RunnerEventAbility: "remove_tag_optional_return",
          returnToGripCost: 2,
          returnToGripChoiceOpened: true,
        },
      });
    expect(calls).toContain("return_choice");
  });

  it("keeps encounter additional-subroutine mutation in the root boundary", () => {
    const deps = createGameCardImplementationRuntimeDeps(host());
    const gameState = state();
    gameState.timingPoint = "run.encounter_ice";
    gameState.run = {
      phase: "encounter_ice",
      encounteredIceId: sourceCardId,
    } as unknown as RunState;

    const result = deps.addCurrentEncounterAdditionalSubroutine(
      gameState,
      action(),
      sourceCardId,
      sourceDefinitionId,
      "Source",
      { subroutineKind: "end_the_run_unless_runner_pays", amount: 2 },
    );

    expect(gameState.run.encounterAdditionalSubroutines).toEqual([
      {
        sourceCardInstanceId: sourceCardId,
        sourceDefinitionId,
        sourceTitle: "Source",
        subroutineKind: "end_the_run_unless_runner_pays",
        amount: 2,
      },
    ]);
    expect(result.publicPayload).toEqual({
      currentEncounterAdditionalSubroutines: 1,
      currentEncounterAdditionalSubroutineKind: "end_the_run_unless_runner_pays",
      currentEncounterAdditionalSubroutineSourceDefinitionId: sourceDefinitionId,
    });
  });

  it("throws a clear error when a required host group is missing", () => {
    expect(() =>
      createGameCardImplementationRuntimeDeps(
        {} as GameCardImplementationRuntimeDepsHost,
      ),
    ).toThrow("GameCardImplementationRuntimeDepsHost fehlt: cards.");
  });

  it("does not import from the public engine index or public context", () => {
    const source = readFileSync(
      new URL("./card-implementation-runtime-deps.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain('from "../index"');
    expect(source).not.toContain("from '../index'");
    expect(source).not.toContain('from "../../index"');
    expect(source).not.toContain("from '../../index'");
    expect(source).not.toContain("publicContext");
  });
});
