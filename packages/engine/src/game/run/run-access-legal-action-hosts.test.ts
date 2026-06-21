import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createRunAccessLegalActionHostComposition,
  type RunAccessLegalActionHostCompositionHost,
} from "./run-access-legal-action-hosts";

const CARD_ID = "accessed_card" as CardInstanceId;
const ICE_ID = "ice_outer" as CardInstanceId;

function state(): GameState {
  const hq = {
    id: "hq",
    kind: "hq",
    label: "HQ",
    ice: [ICE_ID],
    root: [],
  } as CorpServer;

  return {
    stateVersion: 7,
    activeSide: "runner",
    phase: "run",
    timingPoint: "run.jack_out_window",
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
      hq: [CARD_ID],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      servers: [hq],
    },
    cardInstances: {
      [CARD_ID]: {
        id: CARD_ID,
        definitionId: "agenda",
        owner: "corp",
        controller: "corp",
        zone: { side: "corp", zone: "hq" },
        faceup: false,
        rezzed: false,
      } as unknown as CardInstance,
      [ICE_ID]: {
        id: ICE_ID,
        definitionId: "ice",
        owner: "corp",
        controller: "corp",
        zone: { side: "corp", zone: "serverIce", serverId: "hq" },
        faceup: true,
        rezzed: true,
      } as unknown as CardInstance,
    },
    run: {
      runId: "run_1",
      attackedServerId: "hq",
      phase: "access",
      position: { kind: "server", serverId: "hq" },
      successful: true,
      accessCount: 1,
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
    },
    eventLog: [],
    randomCounter: 0,
  } as unknown as GameState;
}

function definition(type: CardDefinition["type"] = "agenda"): CardDefinition {
  return {
    id: type,
    title: type,
    side: "corp",
    type,
    subtypes: [],
    subroutines: [],
  } as unknown as CardDefinition;
}

function hostFor(calls: string[]): RunAccessLegalActionHostCompositionHost {
  const fake = state();
  const server = fake.corp.servers[0] as CorpServer;

  return {
    cards: {
      definitionFor: () => definition(),
      cardInstanceFor: (_state: GameState, cardId: CardInstanceId) =>
        fake.cardInstances[cardId]!,
      cardHasSubtype: () => false,
      runnerInstalledCardIds: () => [],
      publicInstalledCorpCardIdentityKnown: () => true,
      effectiveSubtypesForCard: () => [],
      hostedProgramStrengthModifier: () => 0,
      icebreakerEncounterStrengthBonus: () => 0,
      permanentIcebreakerStrengthCounterBonus: () => 0,
    },
    servers: {
      mustServer: (_state: GameState, serverId: string) => {
        calls.push(`mustServer:${serverId}`);
        return server;
      },
      publicServerLabel: () => "HQ",
      randomHqAccess: () => {
        calls.push("randomHqAccess");
        return CARD_ID;
      },
    },
    run: {
      currentRun: (targetState: GameState) =>
        targetState.run as NonNullable<GameState["run"]>,
      currentEncounterSubroutines: () => [],
      runRemainderStrengthBonusForBreaker: () => 0,
      executeCardImplementationRunnerRunStartEffects: () =>
        calls.push("runStartEffects"),
      applyRunnerTraceCounterRunStartEffects: () =>
        calls.push("traceCounterRunStart"),
      applyAiBoonRunStart: () => calls.push("aiBoonRunStart"),
      finishRun: (_state: GameState, successful: boolean) =>
        calls.push(`finishRun:${successful}`),
      successfulRunInterventionHost: (targetState: GameState) =>
        ({ state: targetState }) as never,
      startExpertScheduleAnalyzerPostAccessChoice: () => false,
    },
    access: {
      advanceArchivesBreachPastNonDecisionCards: () =>
        calls.push("advanceArchives"),
      startRunnerPrivateLookChoice: () => true,
    },
    payment: {
      spendCredits: (_state: GameState, side: string, amount: number) =>
        calls.push(`spendCredits:${side}:${amount}`),
      credits: () => undefined,
      rezCostForCard: () => 0,
      creditCostForAction: () => 0,
      hostedPaymentCredits: () => 0,
      restrictedHostedCreditSourceIds: () => [],
      isRestrictedHostedCreditSource: () => false,
      spendRunnerAccessTrashCredits: () => ({
        recurringSpent: 0,
        runnerCreditsSpent: 0,
      }),
    },
    choices: {
      hiddenZoneArrangeChoiceHandlerHost: () => ({}) as never,
      openRunnerInstalledTrashPreventionWindow: () => false,
    },
    cardImplementation: {
      accessEffectsForDefinition: () => [],
      hiddenReplacementLongtailKindForDefinition: () => undefined,
      accessHookKindsForDefinition: () => [],
      runCardImplementationActionHost: (targetState: GameState) =>
        ({ state: targetState }) as never,
    },
    constants: {
      setup: "setup",
      trap: "trap",
      crybaby: "crybaby",
      dedicatedResponseTeam: "drt",
      dieterEsslin: "dieter",
      turbeauDelacroix: "turbeau",
      corprunnersShatteredRemains: "shattered",
      experimentalAi: "experimental",
      vacantSoulkiller: "soulkiller",
      virusTestSite: "virus",
      chimera: "chimera",
    },
    callbacks: {
      rules: {
        isV097OrLater: () => true,
        isV099OrLater: () => true,
      },
      turn: {
        ensureRunnerTurnFlags: (targetState: GameState) => {
          calls.push("ensureRunnerTurnFlags");
          targetState.runnerTurnFlags ??= {
            stoleAgendaThisTurn: false,
            stoleAgendaLastTurn: false,
          };
          return targetState.runnerTurnFlags;
        },
        consumeRunnerFutureActionDebt: () => calls.push("consumeDebt"),
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
        startTraceFromOperation: () => calls.push("startTrace"),
        traceSuccessEffectForCardImplementation: () => undefined,
      },
      damage: {
        createDamageImminentEvent: (() => ({})) as never,
        doDamage: (() => ({
          damageType: "net",
          amount: 0,
          cardsTrashed: 0,
          flatline: false,
        })) as never,
        openEventModificationWindow: (() => false) as never,
        openReplacementWindow: (() => false) as never,
        resolveDamageImminentEvent: (() => ({
          damageType: "net",
          amount: 0,
          cardsTrashed: 0,
          flatline: false,
        })) as never,
        setDamagePayload: (() => undefined) as never,
        resolveDamageOperation: () => calls.push("resolveDamageOperation"),
      },
      tags: {
        addRunnerTagsWithPrevention: () => calls.push("addTags"),
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
        addCounterToAllInstalledRunnerIcebreakers: () => ({
          amount: 0,
          counterType: "virus",
          countersAfter: 0,
          publicPayload: {},
        }),
      },
      ice: {
        strengthForIce: () => 0,
        icebreakerHasSpecial: () => false,
        dupreStrengthCounterBonus: () => 0,
        resetBreakerStrength: () => calls.push("resetBreakerStrength"),
        withoutVariableIceState: (card: CardInstance) => card,
      },
      zones: {
        removeFromAllZones: () => calls.push("removeFromAllZones"),
        trashCorpInstalledCardToArchives: () => calls.push("trashCorp"),
        trashRunnerInstalledCardToHeap: () => calls.push("trashRunner"),
        trashRunnerInstalledProgram: () => calls.push("trashProgram"),
        cleanupEmptyRemotes: () => undefined,
        ensureSpecialZones: () =>
          ({ removedFromGame: [], setAside: [] }) as never,
        shuffleCorpCardIntoRd: () => ({ publicPayload: {} }),
        returnRunnerInstalledProgramsToGripForAccess: () => ({
          publicPayload: {},
        }),
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
        shuffleStateIds: (_state: GameState, ids: string[]) => ids,
      },
      misc: {
        drawCorpCards: () => calls.push("drawCorpCards"),
        acmeSavingsAndLoanObligationCount: () => 0,
        addAcmeSavingsAndLoanObligation: () => undefined,
        applyRunnerForgoNextAction: () => undefined,
        hasInstalledMicrotechTrodeSet: () => false,
        traceCounterEffectDefinitionFor: () => undefined,
        installedRunnerVirusSourceIds: () => [],
        virusCounterImplementationForCard: () => undefined,
        agendaPointsForScoredCard: () => 1,
        snapshotPersistentStealCostModifiersForSource: () =>
          calls.push("snapshotStealCost"),
        archivesAccessRequiresDecisionOrEffect: () => false,
        installedRevealHelperCount: () => 0,
      },
    },
  } as unknown as RunAccessLegalActionHostCompositionHost;
}

describe("run-access-legal-action-hosts", () => {
  it("does not import from index or contain public/player-view wiring", () => {
    const source = readFileSync(
      new URL("./run-access-legal-action-hosts.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("PlayerView");
    expect(source).not.toContain("publicContext");
    expect(source).not.toContain("randomPurpose");
  });

  it("creates run and access adapters from grouped host composition", () => {
    const composition = createRunAccessLegalActionHostComposition(hostFor([]));

    expect(Object.keys(composition.runFlow).sort()).toContain(
      "runnerEncounterActionHostForState",
    );
    expect(Object.keys(composition.accessFlow).sort()).toEqual([
      "accessEffectHandlerHost",
      "accessFlowHost",
      "breachStateHost",
      "runnerAccessActionHost",
    ]);
  });

  it("keeps Run and Access legal-action host edges delegated", () => {
    const calls: string[] = [];
    const currentState = state();
    const composition = createRunAccessLegalActionHostComposition(hostFor(calls));

    composition.runFlow.runCoreExecutionHost(currentState).access
      .breachStateHost()
      .servers.mustServer("hq");
    composition.accessFlow.accessFlowHost(currentState).runner.ensureTurnFlags();
    composition.runFlow.runMovementHostForState(currentState).cleanup.finishRun(
      true,
    );
    composition.accessFlow.runnerAccessActionHost(currentState).actions
      .buildLegalAction("runner", "access_card", "Karte accessen", "game_rule");

    expect(calls).toEqual([
      "mustServer:hq",
      "ensureRunnerTurnFlags",
      "finishRun:true",
    ]);
  });

  it("fails clearly when a required host group is missing", () => {
    expect(() =>
      createRunAccessLegalActionHostComposition({
        ...hostFor([]),
        cards: undefined,
      } as unknown as RunAccessLegalActionHostCompositionHost),
    ).toThrow("RunAccessLegalActionHostCompositionHost.cards ist erforderlich.");
  });
});
