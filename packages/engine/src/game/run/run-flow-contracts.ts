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
  addRunnerTagsWithPrevention,
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
  applySuccessfulRunEndCreditTriggers,
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
  passApproachedIce,
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
    corpDuringRunCardImplementationLegalActions: (
      state: GameState,
    ) => LegalAction[];
    beginRunnerRunStartOrdering: (
      state: GameState,
      legalAction?: LegalAction,
    ) => boolean;
    applyRunnerTraceCounterRunStartEffects: (
      state: GameState,
      legalAction?: LegalAction,
    ) => boolean;
    applyRunStartRandomStrengthBonus: (
      state: GameState,
      legalAction?: LegalAction,
    ) => void;
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
      damageAmount: number,
      legalAction: LegalAction,
    ) => { payload: Record<string, unknown>; suspended: boolean };
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
    addRunnerTagsWithPrevention: typeof addRunnerTagsWithPrevention;
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
    corpIceInstallTotalCost: (
      state: GameState,
      cardId: CardInstanceId,
      server: CorpServer,
    ) => { totalCost: number };
  };
  install: {
    finalizeCorpIceInstallInnermost: (
      state: GameState,
      cardId: CardInstanceId,
      server: CorpServer,
      legalAction: LegalAction,
    ) => void;
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
      counterType: CounterType,
      amount: number,
      legalAction?: LegalAction,
    ) => number;
    preventOneVirusCounterWithCounterPrevention: (
      state: GameState,
      target?: NonNullable<
        GameState["pendingVirusCounterPrevention"]
      >["targets"][number],
    ) => {
      prevented: boolean;
      creditsPaid: number;
      preventionChargesSpent: number;
      deferred?: boolean;
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
    selectedServerIcebreakerStrengthCounterBonus: (
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
    ) => ReturnType<
      FortRunSideFamiliesHost["breaker"]["breakAbilityForLegalAction"]
    >;
    breakSubroutineCostBreakdown: (
      state: GameState,
      baseCost: number,
      subroutineCount?: number,
      breakerId?: CardInstanceId,
    ) => ReturnType<
      RunnerEncounterActionHost["costs"]["breakSubroutineCostBreakdown"]
    >;
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
    drawRunnerCards: (
      state: GameState,
      count: number,
    ) => {
      drawnCount: number;
      drawTaxSourceCount: number;
      drawTaxCreditsPaid: number;
      drawTaxTagsAdded: number;
    };
    awardRunnerEventAgendaPoint?: (
      state: GameState,
      legalAction: LegalAction,
      sourceDefinitionId: CardDefinitionId,
    ) => void;
    activeObligationCount: (state: GameState) => number;
    addActiveObligation: (state: GameState, amount: number) => void;
    applyRunnerForgoNextAction: (state: GameState) => void;
    hasInstalledRunnerApDamageReducerHardware: (state: GameState) => boolean;
    traceCounterEffectDefinitionFor: Parameters<
      typeof isSupportedEncounterTraceSuccessEffect
    >[1];
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
    rezIceWithoutRunContinuation: (
      state: GameState,
      cardId: CardInstanceId,
      legalAction: LegalAction,
    ) => void;
    rezRootCardAtReactionWindow: (
      state: GameState,
      cardId: CardInstanceId,
      legalAction: LegalAction,
    ) => void;
    resumePaidRunnerBreakerAction: (
      state: GameState,
      legalAction: LegalAction,
    ) => void;
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
  resumeRunStart: (state: GameState, legalAction?: LegalAction) => void;
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
