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
  quoteCorpRootRezCost,
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
import { startRunnerMemoryCheckpointChoice } from "../checkpoints/runner-memory-checkpoint";
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
  type RunFortTriggerExecutionHost,
} from "../abilities/run-fort-trigger-execution";
import {
  applyDelayedInstallStartOfTurn,
  handleRunnerSpecialTriggerExecution,
  delayedInstallCounterCost,
  delayedInstallPreparedTargetIds,
  delayedInstallPrepareTargetIds,
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
  CardInstallCapabilityImplementation,
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

import {
  cardImplementationAgendaPointInstallCost,
  effectiveAgendaDifficultyDeps,
  pickRunnerAgendaForAgendaPointCost,
} from "./runtime-bootstrap-support";
import type { RuntimeDeps } from "./runtime-shared";
import { RUNNER_EVENT_RESOLVERS } from "./public-event-runtime-bootstrap";

export function configureActionRuntimeBootstrap({
  cardImplementationRuntimeDeps,
  runFlow,
}: Pick<RuntimeDeps, "cardImplementationRuntimeDeps" | "runFlow">) {
  const mainActionHostComposition = createMainActionHostComposition({
    actions: {
      buildLegalAction: action,
      makeActionId,
      buildEndTurnAction: buildCorpEndTurnAction,
      buildForgoActionDebtAction: (state) =>
        legalActionHostComposition.buildCorpForgoActionDebtAction(state),
      buildPurgeableRunnerVirusPurgeAction: (state) =>
        legalActionHostComposition.buildPurgeableRunnerVirusPurgeAction(state),
      buildPurgeVirusAction: buildCorpPurgeVirusAction,
      buildGainCreditAction: buildCorpGainCreditAction,
      buildDrawAction: buildCorpDrawAction,
      buildTrashNewDataFortCreationLockActions:
        buildCorpTrashNewDataFortCreationLockActions,
      buildNewRemoteIceInstallAction: buildCorpNewRemoteIceInstallAction,
      buildServerIceInstallAction: buildCorpServerIceInstallAction,
      buildNewRemoteRootInstallAction: buildCorpNewRemoteRootInstallAction,
      buildServerRootInstallAction: buildCorpServerRootInstallAction,
      buildRunnerEndTurnAction,
      buildRunnerGainCreditAction,
      buildRunnerRemoveTagAction,
      buildRunnerDrawCardActions,
      buildRunnerProgramInstallAction,
      buildRunnerProgramTrashBeforeInstallAction,
      buildRunnerHostedProgramInstallAction,
      buildRunnerAgendaPointInstallAction,
      buildRunnerHardwareInstallAction,
      buildRunnerSelectedServerInstallAction,
      buildRunnerResourceInstallAction,
      buildRunnerValuPakInstallAction,
      buildRunnerValuPakSequenceEndAction,
      buildRunnerDelayedInstallSetAsideAction,
      buildRunnerDelayedInstallRemoveCounterAction,
    },
    cards: {
      definitionFor,
      mustInstance,
      isUniqueCard: runtimePorts.isUniqueCard,
      hasInstalledUniqueCardDefinition:
        runtimePorts.hasInstalledUniqueCardDefinition,
      cardImplementationForDefinitionId,
      rezzedCorpRootCardIds: runtimePorts.rezzedCorpRootCardIds,
      corpInstalledCardIds,
    },
    scored: {
      effectiveAgendaDifficulty,
      effectiveAgendaDifficultyDeps,
      scoredAgendaKindForDefinition: runtimePorts.scoredAgendaKindForDefinition,
      serverChoiceDisplayLabel,
      scoredAgendaAbilityHost: runtimePorts.scoredAgendaAbilityHost,
      buildScoredAgendaAbilityActionsForCard,
    },
    counters: {
      totalCounters: runtimePorts.totalCounters,
      purgeableRunnerVirusCounterTotal,
      spyCountersForServer: runtimePorts.spyCountersForServer,
      cardCounter,
      runnerTraceCounterEffectDefinitions:
        runtimePorts.runnerTraceCounterEffectDefinitions,
      runnerCounterDisplayName: runtimePorts.runnerCounterDisplayName,
    },
    corp: {
      corpActionDebtPending,
      activeObligationCount: runtimePorts.activeObligationCount,
      canPlayCorpOperation: (stateToRead, definition) =>
        canPlayCorpOperation(
          runtimePorts.corpOperationResolutionHost(stateToRead),
          definition,
        ),
      cardImplementationOperationLegalActions: (
        stateToRead,
        cardId,
        definition,
      ) =>
        cardImplementationOperationLegalActions(
          runtimePorts.corpOperationResolutionHost(stateToRead),
          cardId,
          definition,
        ),
      corpUtilityImplementationForDefinition,
      hardwareTrashByCounterLegalActions:
        runtimePorts.hardwareTrashByCounterLegalActions,
      corpAgendaPointTotal: runtimePorts.corpAgendaPointTotal,
      hasCorpUtilityKind: runtimePorts.hasCorpUtilityKind,
      uniqueDirectLongtailKindForDefinition:
        runtimePorts.uniqueDirectLongtailKindForDefinition,
      filterActionsForRestrictedExtraActions:
        runtimePorts.filterActionsForRestrictedExtraActions,
    },
    runner: {
      isConcealedRunnerResource,
      hiddenRunnerResourceSlotId,
      ensureRunnerTurnFlags,
      availableRunnerTagRemovalCredits:
        runtimePorts.availableRunnerTagRemovalCredits,
      availableRunnerProgramInstallCredits:
        runtimePorts.availableRunnerProgramInstallCredits,
      runnerCostPenaltySupportCreditCapacity:
        runtimePorts.runnerCostPenaltySupportCreditCapacity,
      availableRunnerRunStartCredits,
      runnerDrawActionContext: runtimePorts.runnerDrawActionContext,
      runnerUtilityLongtailKindForCard:
        runtimePorts.runnerUtilityLongtailKindForCard,
      uniqueDirectLongtailImplementationForCard:
        runtimePorts.uniqueDirectLongtailImplementationForCard,
      filterActionsForRestrictedExtraActions:
        runtimePorts.filterActionsForRestrictedExtraActions,
    },
    run: {
      activeRunActionSpendingCapSourceIds,
      runDurationPaymentHost,
      runStartTaxForServerUpgrades: runtimePorts.runStartTaxForServerUpgrades,
      runStartTaxForCorpRootAssets: runtimePorts.runStartTaxForCorpRootAssets,
    },
    install: {
      corpNewDataFortCreationLocked,
      corpIceInstallTotalCost: runtimePorts.corpIceInstallTotalCost,
      canInstallCorpRootCardInServer:
        runtimePorts.canInstallCorpRootCardInServer,
      canInstallCorpRootCardInNewRemote: (definition) =>
        !runtimePorts.requiresDataFortInstallTarget(definition) &&
        !runtimePorts
          .cardInstallCapabilitiesForDefinition(definition.id)
          .some(
            (capability: CardInstallCapabilityImplementation) =>
              capability.kind === "install_only_in_hq_or_rd" ||
              capability.kind === "install_only_in_hq",
          ) &&
        (definition.type === "agenda" ||
          definition.type === "asset" ||
          definition.type === "upgrade"),
      isRegionUpgrade: runtimePorts.isRegionUpgrade,
      corpRegionUpgradeIdsInServer: runtimePorts.corpRegionUpgradeIdsInServer,
      corpRootAgendaOrNodeCapacityInServer:
        runtimePorts.corpRootAgendaOrNodeCapacityInServer,
      corpRootAssetIdsInServer,
      corpRootMainCardIdsInServer,
      isInstalledCorpCardAdvanceable:
        runtimePorts.isInstalledCorpCardAdvanceable,
      shouldOfferRunnerProgramTrashBeforeInstall:
        runtimePorts.shouldOfferRunnerProgramTrashBeforeInstall,
      canHostProgramOnDaemon: runtimePorts.canHostProgramOnDaemon,
      cardImplementationAgendaPointInstallCost,
      pickRunnerAgendaForAgendaPointCost,
      requiresDataFortInstallTarget: runtimePorts.requiresDataFortInstallTarget,
    },
    rez: {
      rootInstallRezzesOnInstall: runtimePorts.rootInstallRezzesOnInstall,
      rezCostForCard,
      quoteCorpRootRezCost,
      rezCostReductionSourceDefinitionIdsFor,
      isObligationDebtDefinition: runtimePorts.isObligationDebtDefinition,
    },
    cardImplementation: {
      corpTraceDamageAbilityHost: runtimePorts.corpTraceDamageAbilityHost,
      corpSpecialDamageAbilityHost: runtimePorts.corpSpecialDamageAbilityHost,
      pushCorpTraceDamageOrCardImplementationActions:
        runtimePorts.pushCorpTraceDamageOrCardImplementationActions,
      buildCorpSpecialDamageAbilityActionsForCard,
      runtimeDeps: cardImplementationRuntimeDeps,
      cardImplementationForDefinitionId,
      pushEndOfRunnerTurnActions: pushCardImplementationEndOfRunnerTurnActions,
      canPlayPrintedCostOnPlayImplementation,
      runnerEventResolver: runtimePorts.cardImplementationRunnerEventResolver,
      runnerEventInstallChoiceActionPayload:
        runtimePorts.runnerEventInstallChoiceActionPayload,
      printedCostMakeRunEffect:
        runtimePorts.printedCostCardImplementationMakeRunEffect,
      pushActivatedActions: pushActivatedCardImplementationActions,
    },
    specialZones: {
      specialZoneHarnessActions: runtimePorts.specialZoneHarnessActions,
      edgerunnerTempsInstallActionsRemaining:
        runtimePorts.edgerunnerTempsInstallActionsRemaining,
      valuPakProgramInstallActionsRemaining:
        runtimePorts.valuPakProgramInstallActionsRemaining,
      runnerInstallableProgramIdsForValuPak:
        runtimePorts.runnerInstallableProgramIdsForValuPak,
      delayedInstallPrepareTargetIds: (stateToRead) =>
        delayedInstallPrepareTargetIds(
          runtimePorts.runnerSpecialTriggerExecutionHost(stateToRead),
        ),
      delayedInstallCounterCost,
      delayedInstallPreparedTargetIds: (stateToRead) =>
        delayedInstallPreparedTargetIds(
          runtimePorts.runnerSpecialTriggerExecutionHost(stateToRead),
        ),
    },
    callbacks: {
      mustServer,
      serverChoiceDisplayLabel,
      runnerMemoryLimit,
      constants: {
        COUNTER_UPGRADE_SOURCES,
        RUNNER_EVENT_RESOLVERS,
      },
    },
  } satisfies MainActionHostCompositionHost);

  const legalActionHostComposition = configureLegalActionHostComposition({
    actions: {
      buildChoiceAction: runtimePorts.choiceAction,
      corpRunnerActionPaidWindowActions:
        runtimePorts.corpRunnerActionPaidWindowActions,
    },
    counters: {
      corpActionDebtPending,
      purgeableRunnerVirusCounterTotal,
    },
    hosts: {
      corpMainActionGenerationHost:
        mainActionHostComposition.corpMainActionGenerationHost,
      runnerMainActionGenerationHost:
        mainActionHostComposition.runnerMainActionGenerationHost,
      runnerEncounterActionHost: runtimePorts.runnerEncounterActionHostForState,
      encounterEntryHost: runtimePorts.encounterEntryHostForState,
      runRezWindowHost: runtimePorts.runRezWindowHostForState,
      runMovementHost: runtimePorts.runMovementHostForState,
      runCardImplementationActionHost:
        runtimePorts.runCardImplementationActionHost,
      runnerAccessActionHost: runtimePorts.runnerAccessActionHost,
    },
  } satisfies LegalActionHostCompositionHost);

  const applyActionHostComposition: ApplyActionHostCompositionHost = {
    actions: {
      applyAction: applyActionFromGame,
      afterPerformAction: (state, legalAction) => {
        if (runtimePorts.clickCostForAction(legalAction) > 0)
          runtimePorts.consumeRestrictedExtraActionForAction(
            state,
            legalAction,
          );
        startRunnerMemoryCheckpointChoice({
          state,
          runnerMemoryLimit: () => runnerMemoryLimit(state),
          runnerProgramUsesMemory: (cardId) =>
            runtimePorts.runnerProgramUsesMemory(state, cardId),
          definitionFor: (cardId) => definitionFor(state, cardId),
          trashRunnerInstalledCardToHeap: (cardId, action) =>
            runtimePorts.trashRunnerInstalledCardToHeap(state, cardId, action),
        });
        if (
          !state.pendingChoice &&
          !state.imminentEvent &&
          !state.eventModificationWindow &&
          !state.replacementWindow
        )
          delete state.runnerTurnFlags?.currentRunnerActionOrdinal;
      },
    },
    perform: {
      turn: { turnBasicExecutionHost: runtimePorts.turnBasicExecutionHost },
      economy: {
        creditEconomyExecutionHost: runtimePorts.creditEconomyExecutionHost,
      },
      abilities: {
        triggerAbilityExecutionHost: runtimePorts.triggerAbilityExecutionHost,
      },
      cardImplementation: {
        activatedCardImplementationExecutionHost:
          runtimePorts.activatedCardImplementationExecutionHost,
      },
      play: { playCardExecutionHost: runtimePorts.playCardExecutionHost },
      install: { installCardHost: runtimePorts.installCardHost },
      board: {
        boardStateActionExecutionHost:
          runtimePorts.boardStateActionExecutionHost,
      },
      corp: { scoredAgendaFlowHost: runtimePorts.scoredAgendaFlowHost },
      run: {
        startRunActionExecutionHost: runtimePorts.startRunActionExecutionHost,
        runMovementHostForState: runtimePorts.runMovementHostForState,
        runnerBreakerActionExecutionHost:
          runtimePorts.runnerBreakerActionExecutionHost,
        continueRun: (state, legalAction) =>
          runFlow.continueRun(state, legalAction),
      },
      rez: { rezActionExecutionHost: runtimePorts.rezActionExecutionHost },
      access: { accessFlowHost: runtimePorts.accessFlowHost },
      choices: {
        pendingChoiceResolutionHost: runtimePorts.pendingChoiceResolutionHost,
      },
    },
  };

  configureApplyActionHostComposition(applyActionHostComposition);

  return {
    mainActionHostComposition,
    legalActionHostComposition,
    applyActionHostComposition,
  };
}
