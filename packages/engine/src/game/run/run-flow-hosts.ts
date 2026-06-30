import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  ChoiceRequest,
  CorpServer,
  CounterType,
  EffectCommand,
  GameState,
  LegalAction,
  ServerId,
  Side,
  SubroutineDefinition,
  TraceSuccessEffect,
} from "@netgrid/shared";
import { selectedChoiceIds } from "../choices/choice-validation";
import {
  createDamageImminentEvent,
  doDamage,
  openDamageResolutionWindow,
  openEventModificationWindow,
  openReplacementWindow,
  resolveDamageImminentEvent,
  setDamagePayload,
} from "../damage/damage-core";
import { buildLegalAction as action } from "../turn/action-builders";
import type { CardVirusCounterImplementation } from "../../ability-engine/definition-types";
import {
  startCorpRdArrangeChoice,
  type HiddenZoneArrangeChoiceHandlerHost,
} from "../hidden-zone/arrange-choice-handlers";
import type { BreachStateHost } from "../access/breach-state";
import type { AccessFlowHost } from "../access/access-flow";
import {
  enterAccessFromSuccessfulRun,
  type RunAccessTransitionHost,
} from "./run-access-transition";
import {
  startRun as startRunFromRunCore,
  type RunCoreExecutionHost,
  type StartRunOptions,
} from "./run-core-execution";
import {
  continueRun as continueRunFromRunContinuation,
  type RunContinuationExecutionHost,
} from "./run-continuation-execution";
import {
  applySuccessfulRunExtraRunFollowup,
  applyDirectSuccessfulRunTriggers,
  buildSuccessfulRunFollowupActions,
  cleanupDelayedSuccessfulRunTemporaryIce,
  successfulRunInterventionCost,
  successfulRunInterventionKindForDefinition,
  type SuccessfulRunInterventionHost,
} from "./successful-run-interventions";
import {
  resetBreakerStrength,
  type RunEndCleanupHost,
} from "./run-end-cleanup";
import {
  availableRunnerRunCredits,
  hostedPaymentCredits,
  isRestrictedHostedCreditSource,
  restrictedHostedCreditSourceIds,
  runDurationPaymentHost,
  runJackOutAdditionalCost,
  spendHostedPaymentCredits,
} from "./run-duration-payment";
import {
  encounterPrintedNonTraceHost,
  resolveDirectTrashProgramSubroutine,
  type EncounterPrintedNonTraceHost,
} from "./encounter-printed-nontrace-effects";
import {
  encounterPrintedEffectHost,
  isSupportedEncounterTraceSuccessEffect,
  type EncounterPrintedEffectHost,
} from "./encounter-printed-effects";
import {
  encounterSpecialWindowHost,
  fullyBrokenPassedIcePostPassActions,
  fullyBrokenPassedIceTrashPostPassActions,
  type EncounterSpecialWindowHost,
} from "./encounter-special-windows";
import {
  encounterResolutionHost as createEncounterResolutionHost,
  type EncounterResolutionHost,
} from "./encounter-resolution";
import {
  beginEncounter,
  continueAfterCorpRootRezIfWindowIsComplete,
  approachIceExposeCanBeOfferedForCurrentIce,
  type EncounterEntryHost,
} from "./encounter-entry";
import {
  corpRunRootRezActionsAvailable,
  passCorpRunRootRezWindow,
  type RunRezWindowHost,
} from "./run-rez-window";
import type { FortPassWindowHost } from "./fort-pass-window";
import {
  isTokyoUnsuccessfulRunSource,
  fortTraceBitPoolSource,
  runnerCanUseBreakerOnCurrentFort,
  tokyoUnsuccessfulRunAmountForCard,
  type FortRunSideFamiliesHost,
} from "./fort-run-side-families";
import {
  approachOrEncounterIce,
  type RunMovementHost,
} from "./run-movement";
import type { RunnerEncounterActionHost } from "./encounter-actions";
import type { RunnerAccessActionHost } from "../access/access-actions";

export type RunFlowHost = {
  cards: {
    definitionFor: (state: GameState, cardId: CardInstanceId) => CardDefinition;
    cardInstanceFor: (state: GameState, cardId: CardInstanceId) => CardInstance;
    cardHasSubtype: (definition: CardDefinition, subtype: string) => boolean;
    runnerInstalledCardIds: (state: GameState) => CardInstanceId[];
    publicInstalledCorpCardIdentityKnown: (
      state: GameState,
      cardId: CardInstanceId,
    ) => boolean;
    effectiveSubtypesForCard: (
      state: GameState,
      cardId: CardInstanceId,
      definition: CardDefinition,
    ) => string[];
    hostedProgramStrengthModifier: (
      state: GameState,
      cardId: CardInstanceId,
    ) => number;
    icebreakerEncounterStrengthBonus: (
      state: GameState,
      breakerId: CardInstanceId,
      encounteredIceId: CardInstanceId,
    ) => number;
    permanentIcebreakerStrengthCounterBonus: (
      state: GameState,
      breakerId: CardInstanceId,
    ) => number;
    cardImplementationAccessHookKindsForDefinition: (
      definitionId: CardDefinitionId,
    ) => readonly string[];
    canReplaceFortCardsFromHq: (
      state: GameState,
      serverId: Exclude<ServerId, "new_remote">,
    ) => boolean;
  };
  servers: {
    mustServer: (
      state: GameState,
      serverId: Exclude<ServerId, "new_remote"> | string,
    ) => CorpServer;
    publicServerLabel: (
      state: GameState,
      serverId: ServerId | string,
    ) => string | undefined;
    randomHqAccess: (state: GameState) => CardInstanceId | undefined;
  };
  rules: {
    isV097OrLater: (state: GameState) => boolean;
    isV099OrLater: (state: GameState) => boolean;
  };
  turn: {
    ensureRunnerTurnFlags: (
      state: GameState,
    ) => NonNullable<GameState["runnerTurnFlags"]>;
    consumeRunnerFutureActionDebt: (state: GameState) => void;
  };
  access: {
    breachStateHost: (state: GameState) => BreachStateHost;
    accessFlowHost: (state: GameState) => AccessFlowHost;
    hasHiddenResourceAccessStartActions: (
      state: GameState,
      run: NonNullable<GameState["run"]>,
      serverId: Exclude<ServerId, "new_remote">,
    ) => boolean;
    advanceArchivesBreachPastNonDecisionCards: (
      host: AccessFlowHost,
      legalAction?: LegalAction,
    ) => void;
    startRunnerPrivateLookChoice: (
      state: GameState,
      sourceCardId: CardInstanceId,
      sourceDefinitionId: CardDefinitionId,
      zone: Extract<ServerId, "rd" | "hq">,
      count: number | "all",
      reason: "ability" | "successful_run" | "post_access",
      legalAction?: LegalAction,
    ) => boolean;
    startPostAccessInstalledProgramChoice: (
      state: GameState,
      run: NonNullable<GameState["run"]>,
      legalAction?: LegalAction,
    ) => void;
  };
  run: {
    currentRun: (state: GameState) => NonNullable<GameState["run"]>;
    currentEncounterSubroutines: (
      state: GameState,
      iceDefinition: CardDefinition,
    ) => SubroutineDefinition[];
    runRemainderStrengthBonusForBreaker: (
      run: GameState["run"],
      breakerId: CardInstanceId,
    ) => number;
    runnerDuringRunCardImplementationLegalActions: (
      state: GameState,
    ) => LegalAction[];
    executeCardImplementationRunnerRunStartEffects: (
      state: GameState,
      legalAction?: LegalAction,
    ) => void;
    applyRunnerTraceCounterRunStartEffects: (
      state: GameState,
      legalAction?: LegalAction,
    ) => void;
    applyRunStartRandomStrengthBonus: (state: GameState, legalAction?: LegalAction) => void;
    openStartOfRunFortUtilityWindow: (
      state: GameState,
      legalAction?: LegalAction,
    ) => boolean;
  };
  trace: {
    calculateRunnerLink: (state: GameState) => number;
    addCorpTraceCounterPoolCounters: (state: GameState) => number;
    corpTraceCounterPoolTotal: (state: GameState) => number;
    recurringTraceCreditPoolTotal: (state: GameState) => number;
    rabbitTraceLimitReductionForIceTrace: (state: GameState) => number;
    resolveTraceHardwareWreckerSuccess: (
      state: GameState,
      sourceDefinitionId: CardDefinitionId,
      sourceCardInstanceId: CardInstanceId,
      traceId: string,
    ) => Record<string, unknown>;
    resolveTraceTrashRunnerResourceSuccess: (
      state: GameState,
      sourceDefinitionId: CardDefinitionId,
      sourceCardInstanceId: CardInstanceId,
      traceId: string,
      targetCardId: CardInstanceId,
    ) => Record<string, unknown>;
    supportsTraceSuccessEffect: (effect: TraceSuccessEffect) => boolean;
    traceBidChoice: (
      state: GameState,
      side: Side,
      traceId: string,
      prompt: string,
      maxBid: number,
    ) => ChoiceRequest;
  };
  damage: {
    createDamageImminentEvent: typeof createDamageImminentEvent;
    doDamage: typeof doDamage;
    openEventModificationWindow: typeof openEventModificationWindow;
    openReplacementWindow: typeof openReplacementWindow;
    openDamageResolutionWindow: typeof openDamageResolutionWindow;
    resolveDamageImminentEvent: typeof resolveDamageImminentEvent;
    setDamagePayload: typeof setDamagePayload;
  };
  payment: {
    spendCredits: (state: GameState, side: Side, amount: number) => void;
    spendCorpRunTemporaryCreditsForCurrentRunCost: (
      state: GameState,
      amount: number,
    ) => void;
    credits: (state: GameState, side: Side, amount: number) => void;
    rezCostForCard: (state: GameState, cardId: CardInstanceId) => number;
    creditCostForAction: (legalAction: LegalAction) => number;
  };
  counters: {
    cardCounter: (
      state: GameState,
      cardId: CardInstanceId,
      counterType: CounterType,
    ) => number;
    addCardCounter: (
      state: GameState,
      cardId: CardInstanceId,
      counterType: CounterType,
      amount: number,
    ) => void;
    setCardCounter: (
      state: GameState,
      cardId: CardInstanceId,
      counterType: CounterType,
      amount: number,
    ) => void;
    spendCardCounter: (
      state: GameState,
      cardId: CardInstanceId,
      counterType: CounterType,
      amount: number,
    ) => void;
    addVirusCounterWithCounterPrevention: (
      state: GameState,
      cardId: CardInstanceId,
      amount: number,
      legalAction?: LegalAction,
    ) => number;
    preventOneVirusCounterWithCounterPrevention: (state: GameState) => {
      prevented: boolean;
      creditsPaid: number;
    };
    poxCountersForServer: (
      state: GameState,
      serverId: Exclude<ServerId, "new_remote">,
    ) => number;
  };
  ice: {
    strengthForIce: (state: GameState, iceId: CardInstanceId) => number;
    icebreakerHasSpecial: (
      state: GameState,
      breakerId: CardInstanceId,
      special: string,
    ) => boolean;
    dupreStrengthCounterBonus: (
      state: GameState,
      breakerId: CardInstanceId,
    ) => number;
    resetBreakerStrength: (state: GameState) => void;
    withoutVariableIceState: (instance: CardInstance) => CardInstance;
  };
  zones: {
    removeFromAllZones: (state: GameState, cardId: CardInstanceId) => void;
    trashCorpInstalledCardToArchives: (
      state: GameState,
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
    trashRunnerInstalledCardToHeap: (
      state: GameState,
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
    trashRunnerInstalledProgram: (
      state: GameState,
      cardId: CardInstanceId,
    ) => void;
    cleanupEmptyRemotes: (state: GameState) => void;
    ensureSpecialZones: (state: GameState) => void;
  };
  choices: {
    hiddenZoneArrangeChoiceHandlerHost: (
      state: GameState,
      legalAction: LegalAction,
    ) => HiddenZoneArrangeChoiceHandlerHost;
    openRunnerInstalledTrashPreventionWindow: (
      state: GameState,
      legalAction: LegalAction,
      targetCardIds: CardInstanceId[],
      source: string,
    ) => boolean;
  };
  effects: {
    executeEffectCommands: (
      state: GameState,
      commands: EffectCommand[],
    ) => void;
    breakAbilityForLegalAction: (
      state: GameState,
      legalAction: LegalAction,
    ) => ReturnType<FortRunSideFamiliesHost["breaker"]["breakAbilityForLegalAction"]>;
    breakSubroutineCostBreakdown: (
      state: GameState,
      baseCost: number,
      subroutineCount?: number,
    ) => ReturnType<RunnerEncounterActionHost["costs"]["breakSubroutineCostBreakdown"]>;
    abilityMetadata: RunnerEncounterActionHost["actions"]["abilityMetadata"];
    revealCorpRdTop: (state: GameState, legalAction: LegalAction) => void;
  };
  rng: {
    nextRandom: (state: GameState, purpose: string) => number;
    rollDie: (state: GameState, purpose: string) => number;
    shuffleStateIds: (
      state: GameState,
      ids: CardInstanceId[],
      purpose: string,
    ) => CardInstanceId[];
  };
  callbacks: {
    finishRun: (
      state: GameState,
      successful: boolean,
      legalAction?: LegalAction,
    ) => void;
    drawCorpCards: (state: GameState, count: number) => void;
    awardRunnerEventAgendaPoint?: (
      state: GameState,
      legalAction: LegalAction,
      sourceDefinitionId: CardDefinitionId,
    ) => void;
    activeObligationCount: (state: GameState) => number;
    addActiveObligation: (state: GameState, amount: number) => void;
    applyRunnerForgoNextAction: (state: GameState) => void;
    hasInstalledRunnerApDamageReducerHardware: (state: GameState) => boolean;
    traceCounterEffectDefinitionFor: Parameters<typeof isSupportedEncounterTraceSuccessEffect>[1];
    installedRunnerVirusSourceIds: (
      state: GameState,
      predicate?: (implementation: CardVirusCounterImplementation) => boolean,
    ) => CardInstanceId[];
    virusCounterImplementationForCard: (
      state: GameState,
      cardId: CardInstanceId,
    ) => CardVirusCounterImplementation | undefined;
    resolveTestSpinRunEnd: (
      state: GameState,
      run: NonNullable<GameState["run"]>,
      legalAction?: LegalAction,
    ) => { handled: boolean; stateChanged?: boolean };
  };
};

export type RunFlowAdapters = {
  startRun: (
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
    pendingSuccessBonusCredits?: number,
    accessCount?: number,
    options?: StartRunOptions,
    legalAction?: LegalAction,
  ) => void;
  continueRun: (state: GameState, legalAction?: LegalAction) => void;
  runCoreExecutionHost: (state: GameState) => RunCoreExecutionHost;
  runContinuationExecutionHost: (
    state: GameState,
  ) => RunContinuationExecutionHost;
  runnerEncounterActionHostForState: (
    state: GameState,
  ) => RunnerEncounterActionHost;
  runMovementHostForState: (state: GameState) => RunMovementHost;
  runRezWindowHostForState: (state: GameState) => RunRezWindowHost;
  fortPassWindowHostForState: (state: GameState) => FortPassWindowHost;
  fortRunSideFamiliesHostForState: (
    state: GameState,
  ) => FortRunSideFamiliesHost;
  encounterEntryHostForState: (state: GameState) => EncounterEntryHost;
  successfulRunInterventionHost: (
    state: GameState,
  ) => SuccessfulRunInterventionHost;
  encounterResolutionHostForState: (
    state: GameState,
  ) => EncounterResolutionHost;
  encounterSpecialWindowHostForState: (
    state: GameState,
  ) => EncounterSpecialWindowHost;
  encounterPrintedEffectHostForState: (
    state: GameState,
    legalAction?: LegalAction,
  ) => EncounterPrintedEffectHost;
  encounterPrintedNonTraceHostForState: (
    state: GameState,
    legalAction?: LegalAction,
  ) => EncounterPrintedNonTraceHost;
  runEndCleanupHost: (state: GameState) => RunEndCleanupHost;
  runAccessTransitionHost: (state: GameState) => RunAccessTransitionHost;
};

export function createRunFlowAdapters(host: RunFlowHost): RunFlowAdapters {
  assertRequiredHostGroups(host);

  function startRun(
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
    pendingSuccessBonusCredits?: number,
    accessCount = 1,
    options?: StartRunOptions,
    legalAction?: LegalAction,
  ): void {
    startRunFromRunCore(
      runCoreExecutionHost(state),
      serverId,
      pendingSuccessBonusCredits,
      accessCount,
      options,
      legalAction,
    );
  }

  function runCoreExecutionHost(state: GameState): RunCoreExecutionHost {
    return {
      state,
      servers: {
        mustServer: (serverId) => host.servers.mustServer(state, serverId),
      },
      turn: {
        ensureRunnerTurnFlags: () => host.turn.ensureRunnerTurnFlags(state),
      },
      access: {
        breachStateHost: () => host.access.breachStateHost(state),
        runAccessTransitionHost: () => runAccessTransitionHost(state),
      },
      run: {
        movementHost: () => runMovementHostForState(state),
      },
      rules: {
        isV099OrLater: () => host.rules.isV099OrLater(state),
      },
      callbacks: {
        executeCardImplementationRunnerRunStartEffects:
          host.run.executeCardImplementationRunnerRunStartEffects,
        applyRunnerTraceCounterRunStartEffects:
          host.run.applyRunnerTraceCounterRunStartEffects,
        applyRunStartRandomStrengthBonus: host.run.applyRunStartRandomStrengthBonus,
        openStartOfRunFortUtilityWindow:
          host.run.openStartOfRunFortUtilityWindow,
      },
    };
  }

  function continueRun(state: GameState, legalAction?: LegalAction): void {
    continueRunFromRunContinuation(
      runContinuationExecutionHost(state),
      legalAction,
    );
  }

  function runContinuationExecutionHost(
    state: GameState,
  ): RunContinuationExecutionHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
      },
      encounter: {
        currentSubroutines: (iceDefinition) =>
          host.run.currentEncounterSubroutines(state, iceDefinition),
        resolutionHost: () => encounterResolutionHostForState(state),
        printedEffectHost: (legalAction) =>
          encounterPrintedEffectHostForState(state, legalAction),
        printedNonTraceHost: (legalAction) =>
          encounterPrintedNonTraceHostForState(state, legalAction),
        specialWindowHost: () => encounterSpecialWindowHostForState(state),
        successfulRunInterventionHost: () => successfulRunInterventionHost(state),
      },
      movement: {
        host: () => runMovementHostForState(state),
      },
      damage: {
        dealDamage: (input) => host.damage.doDamage(state, input),
        setDamagePayload: (legalAction, summary) =>
          host.damage.setDamagePayload(legalAction, summary),
      },
      cleanup: {
        resetBreakerStrength: () => host.ice.resetBreakerStrength(state),
      },
      callbacks: {
        finishRun: (successful, legalAction) =>
          host.callbacks.finishRun(state, successful, legalAction),
        icebreakerHasBartmossPostEncounterSelfTrashCheck: (breakerId) =>
          host.ice.icebreakerHasSpecial(
            state,
            breakerId,
            "bartmoss_post_encounter_self_trash_check",
          ),
        rollDeterministicDie: (purpose) => host.rng.rollDie(state, purpose),
        trashRunnerInstalledProgram: (breakerId) =>
          host.zones.trashRunnerInstalledProgram(state, breakerId),
      },
    };
  }

  function runnerEncounterActionHostForState(
    state: GameState,
  ): RunnerEncounterActionHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        cardInstanceFor: (cardId) => host.cards.cardInstanceFor(state, cardId),
        cardCounter: (cardId, counterType) =>
          host.counters.cardCounter(state, cardId, counterType as CounterType),
        effectiveSubtypesForCard: (cardId, definition) =>
          definition
            ? host.cards.effectiveSubtypesForCard(state, cardId, definition)
            : [],
        hostedProgramStrengthModifier: (cardId) =>
          host.cards.hostedProgramStrengthModifier(state, cardId),
        icebreakerEncounterStrengthBonus: (breakerId, encounteredIceId) =>
          host.cards.icebreakerEncounterStrengthBonus(
            state,
            breakerId,
            encounteredIceId,
          ),
        permanentIcebreakerStrengthCounterBonus: (breakerId) =>
          host.cards.permanentIcebreakerStrengthCounterBonus(state, breakerId),
        publicServerLabel: (serverId) =>
          host.servers.publicServerLabel(state, serverId),
      },
      run: {
        currentRun: () => host.run.currentRun(state),
        currentEncounterSubroutines: (iceDefinition) =>
          host.run.currentEncounterSubroutines(state, iceDefinition),
        runnerDuringRunCardImplementationLegalActions: () =>
          host.run.runnerDuringRunCardImplementationLegalActions(state),
        runRemainderStrengthBonusForBreaker: (breakerId) =>
          host.run.runRemainderStrengthBonusForBreaker(state.run, breakerId),
        canUseBreakerOnCurrentFort: (breakerId) =>
          runnerCanUseBreakerOnCurrentFort(
            fortRunSideFamiliesHostForState(state),
            breakerId,
          ),
      },
      ice: {
        strengthForIce: (iceId) => host.ice.strengthForIce(state, iceId),
      },
      breaker: {
        dupreStrengthCounterBonus: (breakerId) =>
          host.ice.dupreStrengthCounterBonus(state, breakerId),
      },
      payment: {
        availableRunnerRunCredits: (breakerId) =>
          availableRunnerRunCredits(runDurationPaymentHost(state), breakerId),
        runJackOutAdditionalCost: (run) => runJackOutAdditionalCost(run),
      },
      actions: {
        buildLegalAction: (type, label, source, costs, payload, metadata) =>
          action(state, "runner", type, label, source, costs, payload, metadata),
        abilityMetadata: host.effects.abilityMetadata,
      },
      costs: {
        breakSubroutineCostBreakdown: (baseCost, subroutineCount) =>
          host.effects.breakSubroutineCostBreakdown(
            state,
            baseCost,
            subroutineCount,
          ),
      },
      callbacks: {
        postPassSpecialWindowActions: () => [
          ...fullyBrokenPassedIcePostPassActions(
            encounterSpecialWindowHostForState(state),
          ),
          ...fullyBrokenPassedIceTrashPostPassActions(
            encounterSpecialWindowHostForState(state),
          ),
        ],
      },
    };
  }

  function runMovementHostForState(state: GameState): RunMovementHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        cardInstanceFor: (cardId) => host.cards.cardInstanceFor(state, cardId),
      },
      servers: {
        mustServer: (serverId) => host.servers.mustServer(state, serverId),
        publicServerLabel: (serverId) =>
          host.servers.publicServerLabel(state, serverId),
      },
      rules: {
        isV097OrLater: () => host.rules.isV097OrLater(state),
        corpRunRootRezActionsAvailable: () =>
          corpRunRootRezActionsAvailable(runRezWindowHostForState(state)),
        approachIceExposeCanBeOfferedForCurrentIce: () =>
          approachIceExposeCanBeOfferedForCurrentIce(
            encounterEntryHostForState(state),
          ),
      },
      actions: {
        buildLegalAction: (side, type, label, source, costs, payload) =>
          action(state, side, type, label, source, costs, payload),
      },
      encounter: {
        encounterResolutionHost: () => encounterResolutionHostForState(state),
        encounterSpecialWindowHost: () => encounterSpecialWindowHostForState(state),
        beginEncounter: (iceId, legalAction) =>
          beginEncounter(encounterEntryHostForState(state), iceId, legalAction),
      },
      access: {
        startAccessFromSuccessfulRun: (legalAction) =>
          enterAccessFromSuccessfulRun(
            runAccessTransitionHost(state),
            legalAction,
          ),
      },
      cleanup: {
        finishRun: (successful, legalAction) =>
          host.callbacks.finishRun(state, successful, legalAction),
      },
    };
  }

  function runRezWindowHostForState(state: GameState): RunRezWindowHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        cardInstanceFor: (cardId) => host.cards.cardInstanceFor(state, cardId),
        runnerInstalledProgramIds: () => state.runner.rig.programs,
      },
      servers: {
        mustServer: (serverId) => host.servers.mustServer(state, serverId),
        publicServerLabel: (serverId) =>
          host.servers.publicServerLabel(state, serverId),
      },
      fortPass: fortPassWindowHostForState(state),
      choices: {
        selectedChoiceIds: (selectedChoices) => selectedChoiceIds(selectedChoices),
      },
      callbacks: {
        continueAfterRootRez: (legalAction) =>
          continueAfterCorpRootRezIfWindowIsComplete(
            encounterEntryHostForState(state),
            legalAction,
          ),
        finishRun: (successful, legalAction) =>
          host.callbacks.finishRun(state, successful, legalAction),
        trashCorpInstalledCardToArchives: (cardId, legalAction) =>
          host.zones.trashCorpInstalledCardToArchives(
            state,
            cardId,
            legalAction,
          ),
        canReplaceFortCardsFromHq: (serverId) =>
          host.cards.canReplaceFortCardsFromHq(state, serverId),
        activeObligationCount: () =>
          host.callbacks.activeObligationCount(state),
        addActiveObligation: (amount) =>
          host.callbacks.addActiveObligation(state, amount),
      },
    };
  }

  function fortPassWindowHostForState(state: GameState): FortPassWindowHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        cardInstanceFor: (cardId) => host.cards.cardInstanceFor(state, cardId),
        publicInstalledCorpCardIdentityKnown: (cardId) =>
          host.cards.publicInstalledCorpCardIdentityKnown(state, cardId),
      },
      servers: {
        mustServer: (serverId) => host.servers.mustServer(state, serverId),
      },
      payment: {
        spendCorpCredits: (amount) =>
          host.payment.spendCorpRunTemporaryCreditsForCurrentRunCost(
            state,
            amount,
          ),
      },
    };
  }

  function fortRunSideFamiliesHostForState(
    state: GameState,
  ): FortRunSideFamiliesHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        cardInstanceFor: (cardId) => host.cards.cardInstanceFor(state, cardId),
        cardHasSubtype: host.cards.cardHasSubtype,
        runnerInstalledCardIds: () => host.cards.runnerInstalledCardIds(state),
      },
      servers: {
        mustServer: (serverId) => host.servers.mustServer(state, serverId),
        publicServerLabel: (serverId) =>
          host.servers.publicServerLabel(state, serverId),
      },
      counters: {
        cardCounter: (cardId, counterType) =>
          host.counters.cardCounter(state, cardId, counterType),
        setCardCounter: (cardId, counterType, amount) =>
          host.counters.setCardCounter(state, cardId, counterType, amount),
        spendCardCounter: (cardId, counterType, amount) =>
          host.counters.spendCardCounter(state, cardId, counterType, amount),
      },
      payment: {
        hostedPaymentCredits: (cardId) => hostedPaymentCredits(state, cardId),
        spendHostedPaymentCredits: (cardId, amount) =>
          spendHostedPaymentCredits(state, cardId, amount),
        rezCostForCard: (cardId) => host.payment.rezCostForCard(state, cardId),
        spendCorpCredits: (amount) =>
          host.payment.spendCorpRunTemporaryCreditsForCurrentRunCost(
            state,
            amount,
          ),
      },
      breaker: {
        breakAbilityForLegalAction: (legalAction) =>
          host.effects.breakAbilityForLegalAction(state, legalAction),
      },
      effects: {
        executeEffectCommands: (commands) =>
          host.effects.executeEffectCommands(state, commands),
        trashRunnerInstalledProgram: (cardId) =>
          host.zones.trashRunnerInstalledProgram(state, cardId),
      },
    };
  }

  function encounterEntryHostForState(state: GameState): EncounterEntryHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        cardInstanceFor: (cardId) => host.cards.cardInstanceFor(state, cardId),
        runnerInstalledCardIds: () => host.cards.runnerInstalledCardIds(state),
        effectiveSubtypesForCard: (cardId, definition) =>
          host.cards.effectiveSubtypesForCard(state, cardId, definition),
      },
      servers: {
        mustServer: (serverId) => host.servers.mustServer(state, serverId),
        publicServerLabel: (serverId) =>
          host.servers.publicServerLabel(state, serverId),
      },
      run: {
        corpRootRezActionsAvailable: () =>
          corpRunRootRezActionsAvailable(runRezWindowHostForState(state)),
      },
      callbacks: {
        finishRun: (successful, legalAction) =>
          host.callbacks.finishRun(state, successful, legalAction),
        continueRun: (legalAction) => continueRun(state, legalAction),
        rollDie: (purpose) => host.rng.rollDie(state, purpose),
      },
    };
  }

  function successfulRunInterventionHost(
    state: GameState,
  ): SuccessfulRunInterventionHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        cardInstanceFor: (cardId) => host.cards.cardInstanceFor(state, cardId),
      },
      servers: {
        mustServer: (serverId) => host.servers.mustServer(state, serverId),
        publicServerLabel: (serverId) =>
          host.servers.publicServerLabel(state, serverId),
      },
      actions: {
        createRunnerTriggerAction: (label, sourceCardId, costs, payload) =>
          action(state, "runner", "trigger_ability", label, sourceCardId, costs, payload),
      },
      choices: {
        selectedChoiceIds: (selectedChoices) => selectedChoiceIds(selectedChoices),
      },
      costs: {
        creditCostForAction: (legalAction) =>
          host.payment.creditCostForAction(legalAction),
        rezCostForCard: (cardId) => host.payment.rezCostForCard(state, cardId),
      },
      credits: {
        spend: (side, amount) =>
          side === "corp"
            ? host.payment.spendCorpRunTemporaryCreditsForCurrentRunCost(
                state,
                amount,
              )
            : host.payment.spendCredits(state, side, amount),
        gainRunner: (amount) => host.payment.credits(state, "runner", amount),
      },
      counters: {
        cardCounter: (cardId, counterType) =>
          host.counters.cardCounter(state, cardId, counterType as CounterType),
        addCardCounter: (cardId, counterType, amount) =>
          host.counters.addCardCounter(
            state,
            cardId,
            counterType as CounterType,
            amount,
          ),
      },
      runner: {
        ensureTurnFlags: () => host.turn.ensureRunnerTurnFlags(state),
      },
      zones: {
        removeFromAllZones: (cardId) => host.zones.removeFromAllZones(state, cardId),
        trashCorpInstalledCardToArchives: (cardId, legalAction) =>
          host.zones.trashCorpInstalledCardToArchives(
            state,
            cardId,
            legalAction,
          ),
        trashRunnerInstalledCardToHeap: (cardId, legalAction) =>
          host.zones.trashRunnerInstalledCardToHeap(
            state,
            cardId,
            legalAction,
          ),
      },
      encounter: {
        beginEncounter: (iceId, legalAction) =>
          beginEncounter(encounterEntryHostForState(state), iceId, legalAction),
        approachOrEncounterIce: (iceId, legalAction) =>
          approachOrEncounterIce(
            runMovementHostForState(state),
            iceId,
            legalAction,
          ),
      },
      access: {
        startAccessFromSuccessfulRun: (legalAction) =>
          enterAccessFromSuccessfulRun(runAccessTransitionHost(state), legalAction),
        finishSuccessfulRun: (legalAction) =>
          host.callbacks.finishRun(state, true, legalAction),
      },
    };
  }

  function encounterResolutionHostForState(
    state: GameState,
  ): EncounterResolutionHost {
    return createEncounterResolutionHost(state, {
      applyRunnerForgoNextAction: () => host.callbacks.applyRunnerForgoNextAction(state),
      trashRunnerInstalledProgram: (cardId) =>
        host.zones.trashRunnerInstalledProgram(state, cardId),
    });
  }

  function encounterSpecialWindowHostForState(
    state: GameState,
  ): EncounterSpecialWindowHost {
    return encounterSpecialWindowHost(state, {
      derezCorpInstalledCard: (cardId) => {
        state.cardInstances[cardId] = {
          ...host.ice.withoutVariableIceState(
            host.cards.cardInstanceFor(state, cardId),
          ),
          faceup: false,
          rezzed: false,
        };
      },
      finishRun: (successful, legalAction) =>
        host.callbacks.finishRun(state, successful, legalAction),
      quoteIceRezCost: (iceId) => host.payment.rezCostForCard(state, iceId),
      resetBreakerStrength: () => host.ice.resetBreakerStrength(state),
      rollDie: (purpose) => host.rng.rollDie(state, purpose),
      spendCredits: (side, amount) =>
        side === "corp"
          ? host.payment.spendCorpRunTemporaryCreditsForCurrentRunCost(
              state,
              amount,
            )
          : host.payment.spendCredits(state, side, amount),
      trashCorpInstalledCard: (cardId) =>
        host.zones.trashCorpInstalledCardToArchives(state, cardId),
      trashRunnerInstalledCardToHeap: (cardId, legalAction) =>
        host.zones.trashRunnerInstalledCardToHeap(
          state,
          cardId,
          legalAction,
        ),
    });
  }

  function encounterPrintedEffectHostForState(
    state: GameState,
    legalAction?: LegalAction,
  ): EncounterPrintedEffectHost {
    return encounterPrintedEffectHost(state, {
      addCardCounter: (cardId, counterType, amount) =>
        host.counters.addCardCounter(state, cardId, counterType, amount),
      addCorpTraceCounterPoolCounters: () =>
        host.trace.addCorpTraceCounterPoolCounters(state),
      calculateRunnerLink: () => host.trace.calculateRunnerLink(state),
      cardCounter: (cardId, counterType) =>
        host.counters.cardCounter(state, cardId, counterType),
      createDamageImminentEvent: (request) =>
        host.damage.createDamageImminentEvent(state, request),
      definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
      ensureRunnerTurnFlags: () => host.turn.ensureRunnerTurnFlags(state),
      finishRun: (successful) => host.callbacks.finishRun(state, successful),
      hasInstalledRunnerApDamageReducerHardware: () =>
        host.callbacks.hasInstalledRunnerApDamageReducerHardware(state),
      corpTraceCounterPoolTotal: () => host.trace.corpTraceCounterPoolTotal(state),
      recurringTraceCreditPoolTotal: () => host.trace.recurringTraceCreditPoolTotal(state),
      openEventModificationWindow: (event, action) =>
        host.damage.openEventModificationWindow(state, event, action),
      openReplacementWindow: (event, action) =>
        host.damage.openReplacementWindow(state, event, action),
      openDamageResolutionWindow: (event, action) =>
        host.damage.openDamageResolutionWindow(state, event, action),
      fortTraceBitPoolSource: () =>
        state.run
          ? fortTraceBitPoolSource(fortRunSideFamiliesHostForState(state))
          : undefined,
      rabbitTraceLimitReductionForIceTrace: () =>
        host.trace.rabbitTraceLimitReductionForIceTrace(state),
      resolveDamageImminentEvent: (event) =>
        host.damage.resolveDamageImminentEvent(state, event),
      resolveTraceHardwareWreckerSuccess: (
        sourceDefinitionId,
        sourceCardInstanceId,
        traceId,
      ) =>
        host.trace.resolveTraceHardwareWreckerSuccess(
          state,
          sourceDefinitionId as CardDefinitionId,
          sourceCardInstanceId,
          traceId,
        ),
      resolveTraceTrashRunnerResourceSuccess: (
        sourceDefinitionId,
        sourceCardInstanceId,
        traceId,
        targetCardId,
      ) =>
        host.trace.resolveTraceTrashRunnerResourceSuccess(
          state,
          sourceDefinitionId as CardDefinitionId,
          sourceCardInstanceId,
          traceId,
          targetCardId,
        ),
      resolveTrashInstalledProgramSubroutine: (actionToResolve = legalAction) => {
        const trashResult = resolveDirectTrashProgramSubroutine(
          encounterPrintedNonTraceHostForState(state, actionToResolve),
          { legalAction: actionToResolve },
        );
        const trashedCardId = trashResult.trashedCardIds[0];
        if (!trashedCardId) return undefined;
        const trashedDefinition = host.cards.definitionFor(state, trashedCardId);
        return {
          definitionId: trashedDefinition.id,
          title: trashedDefinition.title,
        };
      },
      setDamagePayload: (summary) => {
        if (legalAction) host.damage.setDamagePayload(legalAction, summary);
      },
      supportsTraceSuccessEffect: (effect) =>
        isSupportedEncounterTraceSuccessEffect(
          effect,
          host.callbacks.traceCounterEffectDefinitionFor,
        ),
      traceBidChoice: (side, traceId, prompt, maxBid) =>
        host.trace.traceBidChoice(state, side, traceId, prompt, maxBid),
    });
  }

  function encounterPrintedNonTraceHostForState(
    state: GameState,
    legalAction?: LegalAction,
  ): EncounterPrintedNonTraceHost {
    return encounterPrintedNonTraceHost(state, {
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
      },
      encounter: {
        resolutionHost: encounterResolutionHostForState(state),
      },
      trash: {
        openRunnerInstalledTrashPreventionWindow: (
          targetCardIds,
          source,
          actionToResolve,
        ) =>
          host.choices.openRunnerInstalledTrashPreventionWindow(
            state,
            actionToResolve,
            targetCardIds,
            source,
          ),
        trashRunnerInstalledProgram: (cardId) =>
          host.zones.trashRunnerInstalledProgram(state, cardId),
      },
      choices: {
        revealCorpRdTop: (actionToResolve) =>
          host.effects.revealCorpRdTop(state, actionToResolve),
        startCorpRdArrangeChoice: (input) => {
          if (!legalAction)
            throw new Error("Continue-Run LegalAction fehlt fuer R&D-Reorder.");
          startCorpRdArrangeChoice(
            host.choices.hiddenZoneArrangeChoiceHandlerHost(
              state,
              legalAction,
            ),
            input,
          );
        },
      },
    });
  }

  function runEndCleanupHost(state: GameState): RunEndCleanupHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        cardInstanceFor: (cardId) => host.cards.cardInstanceFor(state, cardId),
        withoutVariableIceState: host.ice.withoutVariableIceState,
      },
      servers: {
        mustServer: (serverId) => host.servers.mustServer(state, serverId),
        publicServerLabel: (serverId) =>
          host.servers.publicServerLabel(state, serverId),
      },
      runner: {
        ensureTurnFlags: () => host.turn.ensureRunnerTurnFlags(state),
        consumeFutureActionDebt: () => {
          host.turn.consumeRunnerFutureActionDebt(state);
        },
        awardEventAgendaPoint: (sourceCardId, sourceDefinitionId, legalAction) => {
          if (!legalAction)
            throw new Error("Runner-Agenda-Punkt braucht eine LegalAction.");
          legalAction.payload = {
            ...(legalAction.payload ?? {}),
            cardId: sourceCardId,
          };
          if (!host.callbacks.awardRunnerEventAgendaPoint)
            throw new Error("Runner-Agenda-Punkt-Callback fehlt.");
          host.callbacks.awardRunnerEventAgendaPoint(
            state,
            legalAction,
            sourceDefinitionId,
          );
        },
        addFutureActionDebt: (amount) => {
          const flags = host.turn.ensureRunnerTurnFlags(state);
          flags.forgoNextActionsPending =
            Math.max(0, Math.floor(flags.forgoNextActionsPending ?? 0)) +
            amount;
        },
      },
      choices: {
        selectedChoiceIds: (selectedChoices) => selectedChoiceIds(selectedChoices),
      },
      credits: {
        gainRunner: (amount) => {
          state.runner.credits += amount;
        },
        gainCorp: (amount) => {
          state.corp.credits += amount;
        },
      },
      damage: {
        dealUnpreventableCoreDamage: (run, sourceDefinitionId, amount) =>
          host.damage.doDamage(state, {
            damageId: `${run.runId}.${sourceDefinitionId}.run_end_unpreventable_core`,
            damageType: "core",
            amount,
            source: `run_end:${sourceDefinitionId}`,
          }),
      },
      counters: {
        cardCounter: (cardId, counterType) =>
          host.counters.cardCounter(state, cardId, counterType),
        setCardCounter: (cardId, counterType, amount) =>
          host.counters.setCardCounter(state, cardId, counterType, amount),
        addCardCounter: (cardId, counterType, amount) =>
          host.counters.addCardCounter(state, cardId, counterType, amount),
        addVirusCounterWithCounterPrevention: (cardId, amount, legalAction) =>
          host.counters.addVirusCounterWithCounterPrevention(
            state,
            cardId,
            amount,
            legalAction,
          ),
        preventOneVirusCounterWithCounterPrevention: () =>
          host.counters.preventOneVirusCounterWithCounterPrevention(state),
        poxCountersForServer: (serverId) =>
          host.counters.poxCountersForServer(state, serverId),
      },
      ice: {
        icebreakerHasSpecial: (breakerId, special) =>
          host.ice.icebreakerHasSpecial(state, breakerId, special),
      },
      virus: {
        installedRunnerVirusSourceIds: (predicate) =>
          host.callbacks.installedRunnerVirusSourceIds(state, predicate),
        virusCounterImplementationForCard: (cardId) =>
          host.callbacks.virusCounterImplementationForCard(state, cardId),
      },
      aftermath: {
        tokyoUnsuccessfulRunAmountForCard: (cardId) =>
          tokyoUnsuccessfulRunAmountForCard(
            fortRunSideFamiliesHostForState(state),
            cardId,
          ),
        isTokyoUnsuccessfulRunSource: (cardId) =>
          isTokyoUnsuccessfulRunSource(
            fortRunSideFamiliesHostForState(state),
            cardId,
          ),
      },
      followups: {
        applySuccessfulRunExtraRunFollowup: (legalAction) =>
          applySuccessfulRunExtraRunFollowup(
            successfulRunInterventionHost(state),
            legalAction,
          ),
        cleanupDelayedSuccessfulRunTemporaryIce: (run, legalAction) =>
          cleanupDelayedSuccessfulRunTemporaryIce(
            successfulRunInterventionHost(state),
            run,
            legalAction,
          ),
        resolveTestSpinRunEnd: (run, legalAction) =>
          host.callbacks.resolveTestSpinRunEnd(state, run, legalAction),
      },
      cleanup: {
        cleanupEmptyRemotes: () => host.zones.cleanupEmptyRemotes(state),
        trashRunnerInstalledProgram: (cardId) =>
          host.zones.trashRunnerInstalledProgram(state, cardId),
      },
    };
  }

  function runAccessTransitionHost(state: GameState): RunAccessTransitionHost {
    return {
      state,
      breach: host.access.breachStateHost(state),
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        cardInstanceFor: (cardId) => host.cards.cardInstanceFor(state, cardId),
      },
      runner: {
        ensureTurnFlags: () => host.turn.ensureRunnerTurnFlags(state),
        awardEventAgendaPoint: (sourceCardId, sourceDefinitionId, legalAction) => {
          if (!legalAction)
            throw new Error("Runner-Agenda-Punkt braucht eine LegalAction.");
          legalAction.payload = {
            ...(legalAction.payload ?? {}),
            cardId: sourceCardId,
          };
          if (!host.callbacks.awardRunnerEventAgendaPoint)
            throw new Error("Runner-Agenda-Punkt-Callback fehlt.");
          host.callbacks.awardRunnerEventAgendaPoint(
            state,
            legalAction,
            sourceDefinitionId,
          );
        },
      },
      draw: {
        drawCorpCards: (count) => host.callbacks.drawCorpCards(state, count),
      },
      trash: {
        trashCorpInstalledCardToArchives: (cardId, legalAction) =>
          host.zones.trashCorpInstalledCardToArchives(
            state,
            cardId,
            legalAction,
          ),
      },
      rng: {
        shuffleStateIds: (ids, purpose) =>
          host.rng.shuffleStateIds(state, ids, purpose),
      },
      access: {
        hasHiddenResourceAccessStartActions: (run, serverId) =>
          host.access.hasHiddenResourceAccessStartActions(
            state,
            run,
            serverId,
          ),
        advanceArchivesBreachPastNonDecisionCards: (legalAction) =>
          host.access.advanceArchivesBreachPastNonDecisionCards(
            host.access.accessFlowHost(state),
            legalAction,
          ),
        findPreAccessTopRdReorderSource: (run) => {
          if (run.preAccessTopRdReorderResolved) return undefined;
          const accessServerId = run.accessServerOverride ?? run.attackedServerId;
          if (accessServerId !== "rd") return undefined;
          return host.cards.runnerInstalledCardIds(state)
            .slice()
            .sort()
            .find((cardId) =>
              host.cards.cardImplementationAccessHookKindsForDefinition(
                host.cards.definitionFor(state, cardId).id,
              ).includes("pre_access_rd_cut"),
            );
        },
        isPreAccessTopRdReorderSource: (cardId) =>
          host.cards.runnerInstalledCardIds(state).includes(cardId) &&
          host.cards.cardImplementationAccessHookKindsForDefinition(
            host.cards.definitionFor(state, cardId).id,
          ).includes("pre_access_rd_cut"),
        startRunnerPrivateLookChoice: (
          sourceCardId,
          sourceDefinitionId,
          zone,
          count,
          reason,
          legalAction,
        ) =>
          host.access.startRunnerPrivateLookChoice(
            state,
            sourceCardId,
            sourceDefinitionId,
            zone,
            count,
            reason,
            legalAction,
          ),
      },
      run: {
        isV097OrLater: () => host.rules.isV097OrLater(state),
        finishRun: (successful, legalAction) =>
          host.callbacks.finishRun(state, successful, legalAction),
        applyUniqueDirectSuccessfulRunTriggers: (legalAction) =>
          applyDirectSuccessfulRunTriggers(
            successfulRunInterventionHost(state),
            legalAction,
          ),
        successfulRunInterventionKindForSource: (sourceCardId) => {
          return successfulRunInterventionKindForDefinition(
            host.cards.definitionFor(state, sourceCardId).id,
          );
        },
        successfulRunInterventionCost: (kind, serverId, hqIceId) =>
          successfulRunInterventionCost(
            successfulRunInterventionHost(state),
            kind,
            serverId,
            hqIceId,
          ),
      },
      choices: {
        selectedChoiceIds: (selectedChoices) => selectedChoiceIds(selectedChoices),
      },
    };
  }

  return {
    startRun,
    continueRun,
    runCoreExecutionHost,
    runContinuationExecutionHost,
    runnerEncounterActionHostForState,
    runMovementHostForState,
    runRezWindowHostForState,
    fortPassWindowHostForState,
    fortRunSideFamiliesHostForState,
    encounterEntryHostForState,
    successfulRunInterventionHost,
    encounterResolutionHostForState,
    encounterSpecialWindowHostForState,
    encounterPrintedEffectHostForState,
    encounterPrintedNonTraceHostForState,
    runEndCleanupHost,
    runAccessTransitionHost,
  };
}

function assertRequiredHostGroups(host: RunFlowHost): void {
  for (const group of [
    "cards",
    "servers",
    "rules",
    "turn",
    "access",
    "run",
    "trace",
    "damage",
    "payment",
    "counters",
    "ice",
    "zones",
    "choices",
    "effects",
    "rng",
    "callbacks",
  ] as const) {
    if (!host[group])
      throw new Error(`RunFlowHost missing group: ${group}`);
  }
}
