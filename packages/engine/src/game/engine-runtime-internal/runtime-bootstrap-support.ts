import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import * as runtimePorts from "./runtime-port-bindings";
import {
  type ActionType,
  type ChoiceRequest,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstance,
  type CardInstanceId,
  type CardType,
  type CounterType,
  type CorpServer,
  type DeckDefinition,
  type DemoDeckId,
  type DamageType,
  type ApplyActionOptions,
  type EngineError,
  type EngineResult,
  type EventVisibilityClass,
  type EffectCommand,
  type EventModificationCandidate,
  type EventModificationWindow,
  type GameEvent,
  type GameEndReason,
  type GameState,
  type ImminentEvent,
  type LegalAction,
  type AbilityPayloadDiscriminatorField,
  type PlayerAction,
  type PlayerController,
  type PublicGameEvent,
  type PurgeableRunnerVirusCounterBucket,
  type PurgeableRunnerVirusCounterType,
  type ReplacementCandidate,
  type ReplacementWindow,
  type ResolvedGameEffect,
  type ReplayResult,
  type SpecialZoneKind,
  type SpecialZoneState,
  type SpecialZoneVisibility,
  type ModifierKind,
  type ServerId,
  type SetupState,
  type Side,
  type StateHash,
  type TraceSuccessEffect,
  type ValidationResult,
  type VisibleCard,
  type Winner,
} from "@netgrid/shared";
import {
  assertCorpRezCostQuoteValid,
  corpServerIdForInstalledCard,
  quoteCorpIceInstallCost,
  rezCostForCard,
  rezCostReductionSourceDefinitionIdsFor,
  type CorpTracePaymentDependencies,
  type RunnerTracePaymentDependencies,
} from "../payment";
import {
  resolvePendingChoice,
  type PendingChoiceResolutionHost,
} from "../choices/pending-choice-resolution";
import { selectedChoiceIds } from "../choices/choice-validation";
import {
  corpInstalledCardIds,
  corpRootAssetIdsInServer,
  corpRootMainCardIdsInServer,
  definitionFor,
  mustInstance,
  mustRun,
  mustServer,
  publicInstalledCorpCardIdentityKnown,
  rezzedRootCardIdOnServer,
  runnerInstalledCardIds,
  scoredCorpAgendaIds,
  unrezzedRootCardIdOnServer,
} from "../state/card-server-lookup";
import {
  drawCorpCard,
  drawCorpCards,
  randomHqAccess,
  rollDeterministicDie,
  shuffleStateIds,
  mustArrayValue,
  nextRandom,
  recordStateRandomMarkers,
} from "../state/draw-random";
import {
  credits,
  spendClick,
  spendClicks,
  spendCredits,
} from "../state/economy-mutation";
import {
  addCardCounter,
  cardCounter,
  cardInstanceWithoutCounters,
  clearCardCounters,
  ensureCorpTurnFlags,
  ensureRunnerTurnFlags,
  hasSuccessfulHqRunThisTurn,
  hasSuccessfulRunThisTurn,
  recordRunnerActionSpent,
  setCardCounter,
  spendCardCounter,
} from "../state/turn-flags-counters";
import {
  cleanupEmptyRemotes,
  createRemote,
  ensureSpecialZones,
  hostedCardsOn,
  removeFromAllZones,
  setHostedOn,
  uninstallCorpInstalledCardToHq,
} from "../state/zone-mutation";
export { getLegalActions, legalActionsFor } from "../legal-actions";
import {
  configureLegalActionHostComposition,
  type LegalActionHostCompositionHost,
} from "../legal-action-hosts";
export {
  eventVisibilityForAction,
  isHiddenInfoBarrierEvent,
} from "../events/build-event";
import { configureEventContextHostComposition } from "../events/event-context-hosts";
import { BAD_PUBLICITY_LOSS_THRESHOLD } from "../win-conditions";
export { checkWinConditions } from "../win-conditions";
import {
  calculateRunnerLink as calculateRunnerLinkInTrace,
  handleTraceOrchestrationAction,
  resolveTraceChoice,
  traceBidChoice,
  startTraceFromOperation as startTraceFromOperationInTrace,
  type TraceOrchestrationHost,
} from "../trace/trace-orchestration";
import {
  buildLegalAction as action,
  makeActionId,
} from "../turn/action-builders";
import {
  createMainActionHostComposition,
  type MainActionHostCompositionHost,
} from "../turn/main-action-hosts";
import {
  buildCorpDrawAction,
  buildCorpEndTurnAction,
  buildCorpGainCreditAction,
  buildCorpPurgeVirusAction,
} from "../turn/corp-basic-actions";
import {
  buildCorpNewRemoteIceInstallAction,
  buildCorpNewRemoteRootInstallAction,
  buildCorpServerIceInstallAction,
  buildCorpServerRootInstallAction,
} from "../turn/corp-install-actions";
import {
  assertCorpCanCreateNewDataFort,
  buildCorpTrashNewDataFortCreationLockActions,
  corpNewDataFortCreationLocked,
  newDataFortCreationLockForSource,
} from "../turn/corp-data-fort-lock";
import {
  buildRunnerEndTurnAction,
  buildRunnerGainCreditAction,
  buildRunnerRemoveTagAction,
} from "../turn/runner-basic-actions";
import {
  buildRunnerDrawCardActions,
  type RunnerDrawActionContext,
} from "../turn/runner-draw-actions";
import {
  addCorpActionDebt,
  corpActionDebtPending,
  purgeableRunnerVirusCounterAmount,
  purgeableRunnerVirusCounterTotal,
  purgeVirusCounters,
  type TurnBasicExecutionHost,
} from "../turn/turn-basic-execution";
import { type CreditEconomyExecutionHost } from "../economy/credit-economy-execution";
import { type TriggerAbilityExecutionHost } from "../abilities/trigger-ability-execution";
import {
  handleCounterUtilityTriggerExecution,
  type CounterUtilityTriggerExecutionHost,
} from "../abilities/counter-utility-trigger-execution";
import { handleHiddenZoneTriggerExecution } from "../abilities/hidden-zone-trigger-execution";
import {
  handleRunFortTriggerExecution,
  hostedProgramIdsOnHardware,
  topHostedProgramOnHardware,
  type RunFortTriggerExecutionHost,
} from "../abilities/run-fort-trigger-execution";
import {
  applyDelayedInstallStartOfTurn,
  handleRunnerSpecialTriggerExecution,
  delayedInstallCounterCost,
  delayedInstallPreparedTargetIds,
  delayedInstallPrepareTargetIds,
  topRunnerHeapCardId,
  type RunnerSpecialTriggerExecutionHost,
} from "../abilities/runner-special-trigger-execution";
import {
  installCard as executeInstallCard,
  type InstallCardHost,
} from "../install/install-card";
import { rezCard as executeRezCard, type RezCardHost } from "../rez/rez-card";
import {
  addRunnerTagsWithPrevention,
  aggregateDamageSummaries,
  configureDamageCoreHost,
  createDamageImminentEvent,
  damagePreventionSourcesForDefinition,
  doDamage,
  hiddenRunnerResourceRevealPayload,
  isRunnerHardwareDeckDefinition,
  openEventModificationWindow,
  openReplacementWindow,
  openRunnerInstalledTrashPreventionWindow,
  resolveDamageImminentEvent,
  resolveDamageOperation,
  resolveEventModificationChoice,
  resolveReplacementChoice,
  resolveRunnerInstalledTrashImminentEvent,
  setDamagePayload,
  type DamageCoreHost,
  type DamageSummary,
} from "../damage/damage-core";
import {
  buildRunnerHardwareInstallAction,
  buildRunnerProgramInstallAction,
  buildRunnerResourceInstallAction,
} from "../turn/runner-install-actions";
import {
  buildRunnerAgendaPointInstallAction,
  buildRunnerSelectedServerInstallAction,
} from "../turn/runner-install-context-actions";
import { buildRunnerHostedProgramInstallAction } from "../turn/runner-hosted-install-actions";
import { buildRunnerProgramTrashBeforeInstallAction } from "../turn/runner-program-trash-install-actions";
import { buildRunnerStackSearchProgramToGripAction } from "../turn/runner-hidden-zone-search-actions";
import {
  buildRunnerDelayedInstallRemoveCounterAction,
  buildRunnerDelayedInstallSetAsideAction,
  buildRunnerValuPakInstallAction,
  buildRunnerValuPakSequenceEndAction,
} from "../turn/runner-special-zone-install-actions";
import {
  lookTopStackShowToCorpThenInstallMatchingTargets,
  searchStackInstallTargets,
  temporaryProgramInstallableProgramIds,
  temporaryProgramInstallSourceOptions,
  startAujourdOuiTop5Activation,
  startRunnerStackSearchChoiceActivation,
  startHiddenStackProgramInstallActivation,
  startTemporaryProgramInstallSourceActivation,
} from "../hidden-zone/search-choice-activations";
import {
  handleHiddenZoneSearchChoice,
  type HiddenZoneSearchActivationHandlerHost,
  type HiddenZoneSearchChoiceHandlerHost,
} from "../hidden-zone/search-choice-handlers";
import {
  handleHiddenZoneArrangeChoice,
  resolveConcealAndReorderInstalledIce,
  startCorpAssetRdTopReorderChoice,
  startCorpRdArrangeChoice,
  startCorpRdTopReorderChoice,
  startSuccessfulRunFortIceReorderChoice,
  startRunnerStackArrangeChoice,
  startRunnerStackTop5Choice,
  type HiddenZoneArrangeChoiceHandlerHost,
} from "../hidden-zone/arrange-choice-handlers";
import {
  handleHiddenZoneNonSearchChoice,
  startCorpArchivesToHqChoice,
  startCorpDiscardHqWithRetainPaymentChoice,
  startRunnerGripTrashForCreditsChoice,
  startRunnerInstalledTrashForCreditsChoice,
  startInstalledCardTrashForCreditsChoice,
  startSecretSpendGuessThenTargetedBypassRunHideChoice,
  startCorpHqRetainPaymentChoice,
  type HiddenZoneNonSearchChoiceHandlerHost,
} from "../hidden-zone/nonsearch-choice-handlers";
import {
  handleCorpZoneChoice,
  resolveHqArchivesShuffleDraw,
  resolveReschedulerHqShuffleDraw,
  startScoredAgendaHqShuffleCreditsChoice,
  startCorpHqAgendaRevealChoice,
  type CorpZoneChoiceHandlerHost,
} from "../hidden-zone/corp-zone-choice-handlers";
import {
  handleCorpInstallRezSequenceChoice,
  resolveAgendaPurgeInstallTargets,
  startHqToNewRemoteInstallRezChoice,
  startScoredAgendaFreeRezChoice,
  type CorpInstallRezSequenceHandlerHost,
} from "../corp/install-rez-sequence-handlers";
import {
  handleScoredAgendaFlowChoice,
  startScoredAgendaStartDrawChoice,
  type ScoredAgendaFlowHost,
} from "../corp/scored-agenda-flow";
import {
  buildScoredAgendaAbilityActionsForCard,
  handleScoredAgendaActivatedAbilityAction,
  type ScoredAgendaAbilityHost,
} from "../corp/scored-agenda-abilities";
import {
  buildCorpTraceDamageAbilityActionsForCard,
  handleCorpTraceDamageActivatedAbility,
  type CorpTraceDamageAbilityHost,
} from "../corp/trace-damage-abilities";
import {
  buildCorpSpecialDamageAbilityActionsForCard,
  handleCorpSpecialDamageAbilityAction,
  type CorpSpecialDamageAbilityHost,
} from "../corp/special-damage-abilities";
import {
  availableRunnerAccessTrashCredits,
  runnerAccessTrashRecurringCreditSourceIds,
  type RunnerAccessActionHost,
} from "../access/access-actions";
import {
  resolveAccessInstalledRunnerProgramReturnChoice,
  resolveAccessPaymentChoice,
  type AccessEffectHandlerHost,
} from "../access/access-effect-handlers";
import {
  advanceArchivesBreachPastNonDecisionCards,
  type AccessFlowHost,
} from "../access/access-flow";
import {
  installedAccessBonusForServer,
  runnerHqAccessBonus as runnerHqAccessBonusForBreach,
  type BreachStateHost,
} from "../access/breach-state";
import {
  resolvePreAccessTopRdReorderChoice,
  resolveSuccessfulRunCreditLossSpendChoice,
  sourcePayloadForSuccessfulRunReplacement,
  type RunAccessTransitionHost,
} from "../run/run-access-transition";
import { type StartRunOptions } from "../run/run-core-execution";
import {
  applySuccessfulRunExtraRunFollowup,
  resolveSuccessfulRunFollowupAbility,
  resolveSuccessfulRunInterventionChoice as resolveSuccessfulRunInterventionChoiceInRunModule,
  type SuccessfulRunInterventionHost,
} from "../run/successful-run-interventions";
import {
  handleRunEndCleanup,
  recordFortBoundBreakerUsage,
  resetBreakerStrength,
  resolveBrokenIceVirusCounterChoice,
  type RunEndCleanupHost,
} from "../run/run-end-cleanup";
import {
  activeRunActionSpendingCapSourceIds,
  availableRunnerRunStartCredits,
  hostedPaymentCredits,
  isRestrictedHostedCreditSource,
  payRunStartTaxCredits,
  recordRunnerRunCreditSpend,
  recordRunActionSpendingCapSpend,
  restrictedHostedCreditSourceForDefinition,
  restrictedHostedCreditSourceIds,
  restrictedHostedCredits,
  runDurationPaymentHost,
  shouldLoadLegacyRecurringCredits,
  spendHostedPaymentCredits,
  spendRestrictedHostedCredits,
  spendRunnerRunCredits,
  type RunDurationPaymentHost,
} from "../run/run-duration-payment";
import {
  resolvePassRezzedIceProgramTrashChoice as resolvePassRezzedIceProgramTrashChoiceInRunModule,
  resolveActiveIceProgramTrashChoice as resolveActiveIceProgramTrashChoiceInRunModule,
  type EncounterResolutionHost,
} from "../run/encounter-resolution";
import {
  applyPassedIceRunEndTrigger,
  isTraceLinkForceJackOutSource,
  markTraceLinkForceJackOutAfterEncounter,
  resolveFullyBrokenPassedIceDerezAndEndRun as resolveFullyBrokenPassedIceDerezAndEndRunInRunModule,
  resolveFullyBrokenPassedIceTrash as resolveFullyBrokenPassedIceTrashInRunModule,
  resolveSecretSpendCompareChoice as resolveSecretSpendCompareChoiceInRunModule,
  type EncounterSpecialWindowHost,
} from "../run/encounter-special-windows";
import {
  applyPrintedTraceSuccessFollowups,
  isSupportedEncounterTraceSuccessEffect,
  type EncounterPrintedEffectHost,
} from "../run/encounter-printed-effects";
import { type EncounterPrintedNonTraceHost } from "../run/encounter-printed-nontrace-effects";
import {
  breakAbilityMatchesIce,
  breakAbilityMatchesSubroutine,
  buildRunnerEncounterActions,
  buildRunnerMovementActions,
  type RunnerEncounterActionHost,
} from "../run/encounter-actions";
import {
  buildRunnerAccessStartCardImplementationActions,
  buildCorpEncounterCardImplementationActions,
} from "../run/card-implementation-run-actions";
import {
  createGameCardImplementationRuntimeDeps,
  type GameCardImplementationRuntimeDepsHost,
} from "../card-implementation/card-implementation-runtime-deps";
import { type HiddenZoneRuntimeDepsHost } from "../card-implementation/hidden-zone-runtime-deps";
import { type InstallRezRuntimeDepsHost } from "../card-implementation/install-rez-runtime-deps";
import { type CounterLifecycleRuntimeDepsHost } from "../card-implementation/counter-lifecycle-runtime-deps";
import { type TraceRuntimeDepsHost } from "../card-implementation/trace-runtime-deps";
import {
  beginEncounter,
  isApproachIceExposeViewingWindowOpen,
  isApproachIceExposeWindowOpen,
  resolveApproachIceExposeAbility,
  resolveApproachIceExposeViewingDecision,
  runnerApproachIceExposeActions,
  runnerApproachIceExposeViewingActions,
  type EncounterEntryHost,
} from "../run/encounter-entry";
import {
  buildCorpApproachActions,
  buildCorpRunRootRezWindowActions,
  corpRunRootRezWindowKey,
  handleRunRootRezPostRez,
  isCorpRunRootRezWindowOpen,
  passCorpRunRootRezWindow,
  resolveCorpRootRezEffect,
  resolveRezInterruptJackOutChoice,
  type RunRezWindowHost,
} from "../run/run-rez-window";
import {
  resolveFortPassAdvancementWindow,
  resolveHqIceSwapChoice,
  resolveStartRunIceRepositionWindow,
  startHqIceSwapChoice,
  type FortPassWindowHost,
} from "../run/fort-pass-window";
import {
  applyPostBreakStealthLoss,
  clearActivityGatedFortRunMarkers,
  isActivityGatedFortRunBlocked,
  isFortTraceBitPoolSource,
  markFortActivityForRunGate,
  fortTraceBitPoolSource,
  fortTraceBitPoolTotal,
  fortTraceBitPoolCapacityForCard,
  resolveAardvarkInterceptionChoice,
  resolveHammerStealthLossChoice,
  runnerStealthRecurringCredits,
  shouldOpenAardvarkInterception,
  spendFortTraceBitPool,
  startAardvarkInterceptionChoice,
  validateActivityGatedFortRun,
  type FortRunSideFamiliesHost,
} from "../run/fort-run-side-families";
import {
  handleRunMovementAction,
  passApproachedIce,
  type RunMovementHost,
} from "../run/run-movement";
import {
  createRunAccessLegalActionHostComposition,
  type RunAccessLegalActionHostCompositionHost,
} from "../run/run-access-legal-action-hosts";
import { type RunnerBreakerActionExecutionHost } from "../run/runner-breaker-action-execution";
import { type StartRunActionExecutionHost } from "../run/start-run-action-execution";
import { type RezActionExecutionHost } from "../rez/rez-action-execution";
import { type PlayCardExecutionHost } from "../play/play-card-execution";
import {
  canPlayCorpOperation,
  cardImplementationOperationLegalActions,
  corpUtilityImplementationForDefinition,
  hasPrintedCostOnPlayCardImplementation,
  onPlayCardImplementationEffects,
  onPlayCardImplementationAdditionalOperationCost,
  onPlayCardImplementationNeedsLastTurnResourceTarget,
  resolveCorpOperation,
  type CorpOperationResolutionHost,
} from "../play/corp-operation-resolution";
import { type BoardStateActionExecutionHost } from "../board/board-state-action-execution";
import { shuffleRunnerStackAndRefreshZones } from "../hidden-zone/runner-stack-shuffle";
export { quoteCorpRezCost } from "../payment";
export { createGame, createGameAfterSetup } from "../create-game";
import { hashState } from "../hash";
import { applyAction as applyActionFromGame } from "../apply-action";
export { applyAction } from "../apply-action";
import {
  configureApplyActionHostComposition,
  type ApplyActionHostCompositionHost,
} from "../apply/apply-action-hosts";
export { applyGameAction } from "../apply-game-action";
export { getPlayerView, playerViewFor } from "../player-view";
export { replayEvents, replayGameEvents } from "../replay";
import {
  hiddenRunnerResourceSlotId,
  isConcealedRunnerResource,
  resolveHiddenRunnerResourceSlot,
} from "../view/card-view";
import { toPublicEvent } from "../view/public-event-view";
export { redactPublicEventForSide } from "../view/public-event-view";
export { hashGameState, hashState } from "../hash";
import { validateGameState } from "../validation";
export { validateGameState, validateGameStateForDebug } from "../validation";
import {
  additionalSubroutinesForIce,
  currentEncounterAdditionalSubroutinesForIce,
} from "../../ability-engine/additional-subroutine-modifiers";
import { rezzedCorpRootCardIds as rezzedCorpRootCardIdsFromState } from "../../ability-engine/card-implementation-modifiers";
import { quoteBreakSubroutineCostModifiers } from "../../ability-engine/break-subroutine-cost-modifiers";
import {
  effectiveAgendaDifficulty,
  maxHandSize,
  runnerMemoryLimit,
  type EffectiveAgendaDifficultyDependencies,
} from "../../ability-engine/effective-values";
import {
  publicServerLabel,
  publicServerLabelForCard,
  serverChoiceDisplayLabel,
} from "../../public-context";
import { printedSubroutinesForCardImplementation } from "../../ability-engine/printed-subroutine-implementations";
import { traceSuccessEffectForCardImplementation } from "../../ability-engine/trace-implementations";
import {
  icebreakerAbilitiesForDefinition,
  type RuntimeIcebreakerAbility,
} from "../../ability-engine/icebreaker-abilities";
import { iceStrengthModifierBonusFor } from "../../ability-engine/ice-strength-modifiers";
import {
  CARD_IMPLEMENTATIONS,
  cardImplementationForDefinitionId,
} from "../../card-implementations/registry";
import {
  COUNTER_OPERATION_SOURCES,
  OVERADVANCE_AGENDA_SOURCES,
  scoredAgendaCounterCreditPayload,
  scoredAgendaCounterCreditProfileForDefinition,
  scoredAgendaCounterCreditProfileForPayload,
  SCORED_REVEAL_AGENDA_SOURCES,
  SERVER_DIFFICULTY_UPGRADE_SOURCES,
} from "../../mechanics/agenda-scoring";
import { TAG_HANDSIZE_ASSET_SOURCE } from "../../mechanics/global-modifiers";
import { COUNTER_UPGRADE_SOURCES } from "../../mechanics/hosting-counters";
import {
  corpInstalledEconomyActionPayload,
  corpInstalledEconomyActionProfileForDefinition,
  corpInstalledEconomyActionProfileForPayload,
  type EconomyActionProfile,
} from "../../mechanics/payment-costs";
import { isP358HiddenReplacementCompatibilityChoiceSource } from "../../compatibility/payload-compatibility";
import { RUN_TAX_UPGRADE_SOURCES } from "../../mechanics/trace-tags";
import { snapshotPersistentStealCostModifiersForSource } from "../../ability-engine/steal-cost-modifiers";
import { createCardImplementationEffectAdapters } from "../../ability-engine/card-implementation-effect-adapters";
import { executeCardImplementationEffects } from "../../ability-engine/effect-interpreter";
import {
  canPlayPrintedCostOnPlayImplementation,
  executeCardImplementationLifecycleEffects,
  executeCardImplementationRunnerRunStartEffects,
  executeCardImplementationStartOfCorpTurnEffects,
  executeCardImplementationStartOfRunnerTurnEffects,
  executeOnPlayCardImplementationAbility,
  pushActivatedCardImplementationActions,
  pushActivatedCardImplementationActionsForTiming,
  pushCardImplementationEndOfRunnerTurnActions,
  resolveActivatedCardImplementationAbility,
  resolveCardImplementationEndOfRunnerTurnAction,
} from "../../ability-engine/card-implementation-runtime";
import type {
  ActivatedCardAbilityImplementation,
  CardCorpUtilityImplementation,
  CardDamagePreventionSourceImplementation,
  CardFlatlineReplacementSourceImplementation,
  CardHiddenReplacementLongtailImplementation,
  CardRemainingReplacementLongtailImplementation,
  CardRunnerEventLongtailImplementation,
  CardRunnerUtilityLongtailImplementation,
  CardScoredAgendaImplementation,
  CardTagPreventionSourceImplementation,
  CardTraceSuccessEffectImplementation,
  CardTrashPreventionSourceImplementation,
  CardUniqueDirectLongtailImplementation,
  CardVariableRezImplementation,
  CardVirusCounterImplementation,
  MakeRunEffectImplementation,
} from "../../ability-engine/definition-types";

export type AutomaticEffectCollector = ResolvedGameEffect[];
// Effective-value helpers are pure/read-only. Legacy agenda-difficulty pieces
// are still injected through runtime wiring so this module avoids public-facade
// imports without changing existing score legality or revalidation ordering.
export const effectiveAgendaDifficultyDeps: EffectiveAgendaDifficultyDependencies =
  {
    definitionFor,
    serverDifficultyIncreaseFromRunCounters: (state, agendaId) =>
      runtimePorts.serverDifficultyIncreaseFromRunCounters(state, agendaId),
    serverDifficultyReductionFromUpgrades: (state, agendaId) =>
      runtimePorts.serverDifficultyReductionFromUpgrades(state, agendaId),
  };

export const DEFAULT_CONTROLLERS: {
  runner: PlayerController;
  corp: PlayerController;
} = {
  runner: {
    controllerId: "runner-local",
    side: "runner",
    type: "human_local",
    displayName: "Runner",
  },
  corp: {
    controllerId: "corp-ai",
    side: "corp",
    type: "ai",
    displayName: "Korp KI",
  },
};

export type ActiveRun = NonNullable<GameState["run"]>;
export type ActiveBreach = NonNullable<ActiveRun["breach"]>;
export const INITIAL_HAND_SIZE = 5;

export function privateLookCardIds(
  state: GameState,
  zone: Extract<ServerId, "rd" | "hq">,
  count: number | "all",
): CardInstanceId[] {
  const ids = zone === "rd" ? state.corp.rd : state.corp.hq;
  const limit =
    count === "all"
      ? ids.length
      : Math.min(Math.max(0, Math.floor(count)), ids.length);
  return ids.slice(0, limit);
}

export function finishRun(
  state: GameState,
  successful: boolean,
  legalAction?: LegalAction,
): void {
  handleRunEndCleanup(
    runtimePorts.runEndCleanupHost(state),
    successful,
    legalAction,
  );
}

export function handForSide(state: GameState, side: Side): CardInstanceId[] {
  return side === "corp" ? state.corp.hq : state.runner.grip;
}

export function hasCardImplementationMemoryUnitModifier(
  definition: CardDefinition,
): boolean {
  return (
    cardImplementationForDefinitionId(definition.id)?.modifiers?.some(
      (modifier) => modifier.kind === "memory_units",
    ) === true
  );
}

export function cardImplementationAgendaPointInstallCost(
  definition: CardDefinition,
): number {
  return (
    cardImplementationForDefinitionId(definition.id)?.installAdditionalCosts ??
    []
  ).reduce((sum, cost) => {
    if (cost.kind !== "agenda_point") return sum;
    if (!Number.isInteger(cost.amount) || cost.amount <= 0)
      throw new Error("Agenda-Punkt-Installationskosten sind ungueltig.");
    return sum + cost.amount;
  }, 0);
}

export function drawTaxSourceIds(state: GameState): CardInstanceId[] {
  return rezzedCorpRootCardIdsFromState(state).filter(
    (sourceId: CardInstanceId) =>
      runtimePorts.isDrawTaxSourceDefinition(state, sourceId),
  );
}

export function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]+/g, "_").slice(0, 80);
}

export function requireRunnerTagged(state: GameState): void {
  if (state.runner.tags <= 0) throw new Error("Der Runner ist nicht getaggt.");
}

export function runnerStoleAgendaLastTurn(state: GameState): boolean {
  return state.runnerTurnFlags?.stoleAgendaLastTurn === true;
}

export function runnerStolenAgendaAdvancementCountersLastTurn(
  state: GameState,
): number {
  return Math.max(
    0,
    Math.floor(
      state.runnerTurnFlags?.stolenAgendaAdvancementCountersLastTurn ?? 0,
    ),
  );
}

export function runnerRunAttemptsLastTurn(state: GameState): number {
  return Math.max(
    0,
    Math.floor(state.runnerTurnFlags?.runAttemptsLastTurn ?? 0),
  );
}

export function runnerRunAttemptsThisGame(state: GameState): number {
  return Math.max(
    0,
    Math.floor(state.runnerTurnFlags?.runAttemptsThisGame ?? 0),
  );
}

export function runnerTrashedNodeLastTurn(state: GameState): boolean {
  return state.runnerTurnFlags?.trashedNodeLastTurn === true;
}

export function runnerLastTurnInstalledResourceIds(
  state: GameState,
): CardInstanceId[] {
  return (state.runnerTurnFlags?.installedResourceIdsLastTurn ?? [])
    .filter((cardId) => state.runner.rig.resources.includes(cardId))
    .sort();
}

export function resolveRunnerLastTurnInstalledResourceTargetId(
  state: GameState,
  targetRef: string,
): CardInstanceId | undefined {
  const eligible = runnerLastTurnInstalledResourceIds(state);
  if (eligible.includes(targetRef as CardInstanceId))
    return targetRef as CardInstanceId;
  const hiddenResourceId = resolveHiddenRunnerResourceSlot(state, targetRef);
  return hiddenResourceId && eligible.includes(hiddenResourceId)
    ? hiddenResourceId
    : undefined;
}

export function runnerInstalledResourceLastTurn(state: GameState): boolean {
  return runnerLastTurnInstalledResourceIds(state).length > 0;
}

export function corpScoredBlackOpsAgendaLastTurn(state: GameState): boolean {
  return ensureCorpTurnFlags(state).scoredBlackOpsAgendaLastTurn === true;
}

export function runnerStoleAgendaSubtypeThisTurn(
  state: GameState,
  subtype: "research" | "gray_ops" | "black_ops",
): boolean {
  if (subtype === "research")
    return state.runnerTurnFlags?.stoleResearchAgendaThisTurn === true;
  if (subtype === "gray_ops")
    return state.runnerTurnFlags?.stoleGrayOpsAgendaThisTurn === true;
  return state.runnerTurnFlags?.stoleBlackOpsAgendaThisTurn === true;
}

export function agendaPointsForScoredCard(
  state: GameState,
  cardId: CardInstanceId,
): number {
  const definition = definitionFor(state, cardId);
  const basePoints = definition.agendaPoints ?? 0;
  const bonusPoints = cardCounter(state, cardId, "agenda");
  const spentPoints = Math.max(
    0,
    Math.floor(state.cardInstances[cardId]?.agendaPointsSpent ?? 0),
  );
  return Math.max(0, basePoints + bonusPoints - spentPoints);
}

export function spendAgendaPointFromScoredCard(
  state: GameState,
  cardId: CardInstanceId,
): void {
  if (agendaPointsForScoredCard(state, cardId) < 1)
    throw new Error(
      "Die gewaehlte Agenda liefert keinen Agenda-Punkt fuer Kosten.",
    );
  const instance = mustInstance(state.cardInstances, cardId);
  state.cardInstances[cardId] = {
    ...instance,
    agendaPointsSpent:
      Math.max(0, Math.floor(instance.agendaPointsSpent ?? 0)) + 1,
  };
}

export function scoreInstalledRunnerProgramAsAgenda(
  state: GameState,
  legalAction: LegalAction,
  sourceCardId: CardInstanceId,
): { publicPayload: Record<string, string | number | boolean> } {
  const instance = mustInstance(state.cardInstances, sourceCardId);
  const installedProgram = instance.installedAsRunnerProgram;
  const definition = definitionFor(state, sourceCardId);
  if (
    !state.runner.rig.programs.includes(sourceCardId) ||
    !installedProgram?.scoreAsAgendaAction ||
    definition.type !== "agenda"
  )
    throw new Error(
      "Die Quelle ist kein als Runner-Programm installiertes Agenda-Programm.",
    );
  const memoryCost = Math.max(0, Math.floor(installedProgram.memoryCost ?? 0));
  const {
    installedAsRunnerProgram: _installedAsRunnerProgram,
    hostedOn: _hostedOn,
    ...scoredInstance
  } = instance;
  void _installedAsRunnerProgram;
  void _hostedOn;
  removeFromAllZones(state, sourceCardId);
  state.runner.memoryUsed = Math.max(0, state.runner.memoryUsed - memoryCost);
  state.runner.scoreArea.push(sourceCardId);
  state.cardInstances[sourceCardId] = {
    ...scoredInstance,
    controller: "runner",
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "scoreArea" },
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    scoredSourceAsAgenda: true,
    sourceDefinitionId: definition.id,
    scoredAgendaPointValue: agendaPointsForScoredCard(state, sourceCardId),
    runnerMemoryUsedAfter: state.runner.memoryUsed,
  };
  return { publicPayload: legalAction.payload };
}

export function pickRunnerAgendaForAgendaPointCost(
  state: GameState,
): CardInstanceId | undefined {
  return state.runner.scoreArea
    .slice()
    .sort((left, right) => {
      const byPoints =
        agendaPointsForScoredCard(state, left) -
        agendaPointsForScoredCard(state, right);
      return byPoints !== 0 ? byPoints : left.localeCompare(right);
    })
    .find((cardId) => agendaPointsForScoredCard(state, cardId) >= 1);
}

type CorpAgendaPointCostResult = {
  paidPoints: number;
  bonusPointsSpent: number;
  spentAgendaIds: CardInstanceId[];
  spentAgendaDefinitionIds: CardDefinitionId[];
};

export function recurringTraceCreditPoolSourceIds(
  state: GameState,
): CardInstanceId[] {
  return rezzedCorpRootCardIdsFromState(state)
    .filter((cardId: CardInstanceId) => {
      const utility = runtimePorts.corpUtilityImplementationForCard(
        state,
        cardId,
      );
      return (
        utility?.kind === "recurring_trace_credit_pool" &&
        utility.counterType === "bit" &&
        utility.spendWindow === "trace" &&
        cardCounter(state, cardId, utility.counterType) > 0
      );
    })
    .sort();
}

export function recurringTraceCreditPoolTotal(state: GameState): number {
  return recurringTraceCreditPoolSourceIds(state).reduce(
    (sum, cardId) => sum + cardCounter(state, cardId, "bit"),
    0,
  );
}

export function runnerInstalledHardwareTrashTarget(
  state: GameState,
): CardInstanceId | undefined {
  return state.runner.rig.hardware.slice().sort((left, right) => {
    const leftDefinition = definitionFor(state, left);
    const rightDefinition = definitionFor(state, right);
    const byInstallCost =
      (rightDefinition.installCost ?? 0) - (leftDefinition.installCost ?? 0);
    return byInstallCost !== 0 ? byInstallCost : left.localeCompare(right);
  })[0];
}

export const corpTracePaymentDeps: CorpTracePaymentDependencies = {
  encounterTemporaryTraceCreditsAvailable: (state, trace) =>
    runtimePorts.encounterTemporaryTraceCreditsAvailable(state, trace),
  spendEncounterTemporaryTraceCredits: (state, trace, amount) =>
    runtimePorts.spendEncounterTemporaryTraceCredits(state, trace, amount),
  fortTraceBitPoolTotal: (state) =>
    fortTraceBitPoolTotal(runtimePorts.fortRunSideFamiliesHostForState(state)),
  spendFortTraceBitPool: (state, sourceCardId, serverId, amount) =>
    spendFortTraceBitPool(
      runtimePorts.fortRunSideFamiliesHostForState(state),
      sourceCardId,
      serverId,
      amount,
    ),
  corpCreditsAvailable: (state) => state.corp.credits,
  spendCorpCredits: (state, amount) => spendCredits(state, "corp", amount),
  corpTraceBitPoolTotal: recurringTraceCreditPoolTotal,
  spendCorpTraceBitPool: (state, amount) =>
    runtimePorts.spendRecurringTraceCreditPool(state, amount),
  corpTraceCounterPoolTotal: (state) =>
    runtimePorts.corpTraceCounterPoolTotal(state),
  spendCorpTraceCounterPool: (state, amount) =>
    runtimePorts.spendCorpTraceCounterPoolCounters(state, amount),
  corpTraceBitPoolSources: (state) =>
    recurringTraceCreditPoolSourceIds(state).map((cardId) => ({
      kind: "corp_trace_bit_pool" as const,
      sourceCardInstanceId: cardId,
      sourceDefinitionId: definitionFor(state, cardId).id,
      available: cardCounter(state, cardId, "bit"),
    })),
  spendCorpTraceBitPoolSource: (state, cardId, amount) => {
    const available = cardCounter(state, cardId, "bit");
    const spent = Math.min(available, Math.max(0, Math.floor(amount)));
    spendCardCounter(state, cardId, "bit", spent);
    return spent;
  },
  corpTraceCounterPoolSources: (state) =>
    runtimePorts.corpTraceCounterPoolSourceIds(state).map((cardId) => {
      const counterType = runtimePorts.corpTraceCounterPoolCounterType(
        state,
        cardId,
      );
      return {
        kind: "corp_trace_counter_pool" as const,
        sourceCardInstanceId: cardId,
        sourceDefinitionId: definitionFor(state, cardId).id,
        available: cardCounter(state, cardId, counterType),
      };
    }),
  spendCorpTraceCounterPoolSource: (state, cardId, amount) => {
    const counterType = runtimePorts.corpTraceCounterPoolCounterType(
      state,
      cardId,
    );
    const available = cardCounter(state, cardId, counterType);
    const spent = Math.min(available, Math.max(0, Math.floor(amount)));
    spendCardCounter(state, cardId, counterType, spent);
    return spent;
  },
  cardCounter,
};

export const runnerTracePaymentDeps: RunnerTracePaymentDependencies = {
  runnerTraceLinkCreditSources: (state) =>
    restrictedHostedCreditSourceIds(state, "increase_link")
      .sort()
      .map((cardId) => {
        const definition = definitionFor(state, cardId);
        const sourceDefinitionId = definition.id;
        const restricted =
          restrictedHostedCreditSourceForDefinition(definition);
        return {
          sourceCardInstanceId: cardId,
          sourceDefinitionId,
          ...(restricted?.usableFor.includes("increase_link")
            ? { publicKind: "runner_trace_link_bonus_credit" as const }
            : {}),
        };
      }),
  hostedPaymentCredits: (state, cardId) => cardCounter(state, cardId, "bit"),
  spendHostedPaymentCredits: (state, cardId, amount) =>
    spendCardCounter(state, cardId, "bit", amount),
  runnerCreditsAvailable: (state) => state.runner.credits,
  spendRunnerCredits: (state, amount) => spendCredits(state, "runner", amount),
  recordRunnerRunCreditSpend: (state, amount) => {
    if (!state.run) return;
    recordRunnerRunCreditSpend(runDurationPaymentHost(state), amount);
  },
  recordRunActionSpendingCapSpend: (state, amount) => {
    if (!state.run) return;
    recordRunActionSpendingCapSpend(runDurationPaymentHost(state), amount);
  },
  definitionIdForCard: (state, cardId) => definitionFor(state, cardId).id,
};

export function isV097OrLater(state: GameState): boolean {
  return isVersionAtLeast(state, 97);
}

export function isV099OrLater(state: GameState): boolean {
  return isVersionAtLeast(state, 99);
}

export function isVersionAtLeast(state: GameState, minorGate: number): boolean {
  const version = state.baseline.engineSchemaVersion
    .split(".")
    .map((part) => Number(part));
  const [major = 0, minor = 0, patch = 0] = version;
  if (major !== 0) return major > 0;
  if (minor !== minorGate) return minor > minorGate;
  return patch >= 0;
}

export function cloneState<T>(state: T): T {
  return structuredClone(state) as T;
}
