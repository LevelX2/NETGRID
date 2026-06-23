import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createRunFlowAdapters,
  type RunFlowHost,
} from "./run-flow-hosts";

const ICE_ID = "ice_outer" as CardInstanceId;

function state(): GameState {
  const server = {
    id: "hq",
    kind: "hq",
    label: "HQ",
    ice: [ICE_ID],
    root: [],
  } as CorpServer;

  return {
    stateVersion: 3,
    activeSide: "runner",
    phase: "run",
    timingPoint: "run.approach_ice",
    baseline: { engineSchemaVersion: "0.99.0" },
    runner: {
      credits: 5,
      clicks: 2,
      tags: 0,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: { programs: [], hardware: [], resources: [] },
    },
    corp: {
      credits: 5,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      servers: [server],
    },
    cardInstances: {
      [ICE_ID]: {
        id: ICE_ID,
        definitionId: "outer_ice",
        owner: "corp",
        controller: "corp",
        zone: { side: "corp", zone: "serverIce", serverId: "hq" },
        faceup: true,
        rezzed: true,
        strengthModifier: 0,
      } as unknown as CardInstance,
    },
    run: {
      runId: "run_4",
      attackedServerId: "hq",
      phase: "access",
      position: { kind: "server", serverId: "hq" },
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: true,
      accessCount: 1,
    },
    eventLog: [],
    randomCounter: 0,
  } as unknown as GameState;
}

function definition(id = "outer_ice"): CardDefinition {
  return {
    id,
    title: id,
    side: "corp",
    type: "ice",
    subroutines: [],
  } as unknown as CardDefinition;
}

function hostFor(calls: string[]): RunFlowHost {
  const fake = state();
  const server = fake.corp.servers[0] as CorpServer;

  return {
    cards: {
      definitionFor: () => definition(),
      cardInstanceFor: () => fake.cardInstances[ICE_ID] as CardInstance,
      cardHasSubtype: () => false,
      runnerInstalledCardIds: () => [],
      publicInstalledCorpCardIdentityKnown: () => true,
      effectiveSubtypesForCard: () => [],
      hostedProgramStrengthModifier: () => 0,
      icebreakerEncounterStrengthBonus: () => 0,
      permanentIcebreakerStrengthCounterBonus: () => 0,
      cardImplementationAccessHookKindsForDefinition: () => [],
      canReplaceFortCardsFromHq: () => true,
    },
    servers: {
      mustServer: (_state, serverId) => {
        calls.push(`mustServer:${serverId}`);
        return server;
      },
      publicServerLabel: () => "HQ",
      randomHqAccess: () => undefined,
    },
    rules: {
      isV097OrLater: () => true,
      isV099OrLater: () => true,
    },
    turn: {
      ensureRunnerTurnFlags: (targetState) => {
        calls.push("ensureRunnerTurnFlags");
        targetState.runnerTurnFlags ??= {
          stoleAgendaThisTurn: false,
          stoleAgendaLastTurn: false,
        };
        return targetState.runnerTurnFlags;
      },
      consumeRunnerFutureActionDebt: () => calls.push("consumeDebt"),
    },
    access: {
      breachStateHost: (targetState) => ({ state: targetState }) as never,
      accessFlowHost: (targetState) => ({ state: targetState }) as never,
      hasHiddenResourceAccessStartActions: () => false,
      advanceArchivesBreachPastNonDecisionCards: () =>
        calls.push("advanceArchivesBreach"),
      startRunnerPrivateLookChoice: () => true,
      startExpertScheduleAnalyzerPostAccessChoice: () =>
        calls.push("expertScheduleAnalyzer"),
    },
    run: {
      currentRun: (targetState) => targetState.run as NonNullable<GameState["run"]>,
      currentEncounterSubroutines: () => [],
      runRemainderStrengthBonusForBreaker: () => 0,
      runnerDuringRunCardImplementationLegalActions: () => [],
      executeCardImplementationRunnerRunStartEffects: () =>
        calls.push("runStartEffects"),
      applyRunnerTraceCounterRunStartEffects: () =>
        calls.push("traceCounterRunStart"),
      applyRunStartRandomStrengthBonus: () => calls.push("runStartRandomStrengthBonus"),
      openStartOfRunFortUtilityWindow: () => false,
    },
    trace: {
      calculateRunnerLink: () => 0,
      traceBidChoice: () => ({}) as never,
      addHackerTrackerTraceCounters: () => 0,
      hackerTrackerCounterTotal: () => 0,
      recurringTraceCreditPoolTotal: () => 0,
      rabbitTraceLimitReductionForIceTrace: () => 0,
      resolveTraceHardwareWreckerSuccess: () => ({}),
      resolveTraceTrashRunnerResourceSuccess: () => ({}),
      supportsTraceSuccessEffect: () => true,
    },
    damage: {
      createDamageImminentEvent: (() => ({})) as never,
      doDamage: (() => ({
        damageType: "net",
        amount: 0,
        cardsTrashed: 0,
        flatline: false,
      })) as never,
      openDamageResolutionWindow: (() => false) as never,
      openEventModificationWindow: (() => false) as never,
      openReplacementWindow: (() => false) as never,
      resolveDamageImminentEvent: (() => ({
        damageType: "net",
        amount: 0,
        cardsTrashed: 0,
        flatline: false,
      })) as never,
      setDamagePayload: (() => undefined) as never,
    },
    payment: {
      spendCredits: () => undefined,
      spendCorpRunTemporaryCreditsForCurrentRunCost: () => undefined,
      credits: () => undefined,
      rezCostForCard: () => 0,
      creditCostForAction: () => 0,
    },
    counters: {
      cardCounter: () => 0,
      addCardCounter: () => undefined,
      setCardCounter: () => undefined,
      spendCardCounter: () => undefined,
      addVirusCounterWithCounterPrevention: () => 0,
      preventOneVirusCounterWithCounterPrevention: () => ({
        prevented: false,
        creditsPaid: 0,
      }),
      poxCountersForServer: () => 0,
    },
    ice: {
      strengthForIce: () => 0,
      icebreakerHasSpecial: () => false,
      dupreStrengthCounterBonus: () => 0,
      resetBreakerStrength: () => calls.push("resetBreakerStrength"),
      withoutVariableIceState: (card) => card,
    },
    zones: {
      removeFromAllZones: () => undefined,
      trashCorpInstalledCardToArchives: () => undefined,
      trashRunnerInstalledCardToHeap: () => undefined,
      trashRunnerInstalledProgram: () => calls.push("trashProgram"),
      cleanupEmptyRemotes: () => undefined,
      ensureSpecialZones: () => undefined,
    },
    choices: {
      hiddenZoneArrangeChoiceHandlerHost: () => ({}) as never,
      openRunnerInstalledTrashPreventionWindow: () => false,
    },
    effects: {
      executeEffectCommands: () => undefined,
      breakAbilityForLegalAction: () => undefined,
      breakSubroutineCostBreakdown: () => ({
        baseCost: 0,
        legacyRunAdditionalCost: 0,
        runnerHardwareAdditionalCost: 0,
        cardImplementationAdditionalCost: 0,
        additionalCost: 0,
        totalCost: 0,
        publicPayload: {},
      }),
      abilityMetadata: () => ({ targetRequirements: [] }),
      revealCorpRdTop: () => undefined,
    },
    rng: {
      nextRandom: () => 0,
      rollDie: () => 1,
      shuffleStateIds: (_state, ids) => ids,
    },
    callbacks: {
      finishRun: (_state, successful) => calls.push(`finishRun:${successful}`),
      drawCorpCards: () => calls.push("drawCorpCards"),
      activeObligationCount: () => 0,
      addActiveObligation: () => undefined,
      applyRunnerForgoNextAction: () => undefined,
      hasInstalledMicrotechTrodeSet: () => false,
      traceCounterEffectDefinitionFor: () => undefined,
      installedRunnerVirusSourceIds: () => [],
      virusCounterImplementationForCard: () => undefined,
      resolveTestSpinRunEnd: () => ({ handled: false }),
    },
  };
}

describe("run-flow-hosts", () => {
  it("does not import from index or contain public event wiring", () => {
    const source = readFileSync(
      new URL("./run-flow-hosts.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("BuildEvent");
  });

  it("creates the expected run-flow adapters", () => {
    const adapters = createRunFlowAdapters(hostFor([]));

    expect(Object.keys(adapters).sort()).toEqual([
      "continueRun",
      "encounterEntryHostForState",
      "encounterPrintedEffectHostForState",
      "encounterPrintedNonTraceHostForState",
      "encounterResolutionHostForState",
      "encounterSpecialWindowHostForState",
      "fortPassWindowHostForState",
      "fortRunSideFamiliesHostForState",
      "runAccessTransitionHost",
      "runContinuationExecutionHost",
      "runCoreExecutionHost",
      "runEndCleanupHost",
      "runMovementHostForState",
      "runRezWindowHostForState",
      "runnerEncounterActionHostForState",
      "startRun",
      "successfulRunInterventionHost",
    ]);
  });

  it("wires core and continuation hosts through grouped host callbacks", () => {
    const targetState = state();
    const calls: string[] = [];
    const adapters = createRunFlowAdapters(hostFor(calls));

    adapters.runCoreExecutionHost(targetState).servers.mustServer("hq");
    adapters.runCoreExecutionHost(targetState).turn.ensureRunnerTurnFlags();
    adapters.runContinuationExecutionHost(targetState).callbacks.finishRun(false);
    adapters.runMovementHostForState(targetState).cleanup.finishRun(true);

    expect(calls).toEqual([
      "mustServer:hq",
      "ensureRunnerTurnFlags",
      "finishRun:false",
      "finishRun:true",
    ]);
  });

  it("fails clearly when required host groups are absent", () => {
    expect(() => createRunFlowAdapters({} as RunFlowHost)).toThrow(
      "RunFlowHost missing group: cards",
    );
  });
});
