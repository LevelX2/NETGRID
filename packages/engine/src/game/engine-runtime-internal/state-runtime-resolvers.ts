import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { createChoiceHiddenZoneRuntime } from "./choice-hidden-zone-runtime";
import { createLifecycleRuntime } from "./lifecycle-runtime";
import { createTurnCorpRuntime } from "./turn-corp-runtime";
import { createActionRuntimeHosts } from "./action-runtime-hosts";
import { createCardRuntimeHosts } from "./card-runtime-hosts";
import { createFlowRuntimeHosts } from "./flow-runtime-hosts";
import { createStateRuntimeServices } from "./state-runtime-services";
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
  closeRunnerCostPenaltySupportWindowForPayment as closeRunnerCostPenaltySupportWindowForPaymentHelper,
  openRunnerCostPenaltySupportWindow as openRunnerCostPenaltySupportWindowHelper,
  runnerCostPenaltySupportCreditCapacity as runnerPaymentSupportCreditCapacity,
} from "../payment/runner-payment-support";
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
  drawCorpCards,
  randomHqAccess,
  rollDeterministicDie,
  shuffleStateIds,
  mustArrayValue,
  nextRandom,
  recordStateRandomMarkers,
} from "../state/draw-random";
import {
  spendClick,
  spendClicks,
  spendCredits,
} from "../state/economy-mutation";
import { applyCreditGain } from "../economy/credit-gain";
import {
  abilityUsageSourceUsed,
  markAbilityUsageSourceUsed,
} from "../../ability-engine/card-implementation-ability-limits";
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
  RESTRICTED_ACTION_GRANT_KEYS,
  spendRestrictedActionGrantTemporaryCredits,
} from "../state/restricted-action-grants";
import {
  cleanupEmptyRemotes,
  createRemote,
  ensureSpecialZones,
  hostedCardsOn,
  removeFromAllZones,
  setHostedOn,
  uninstallCorpInstalledCardToHq,
} from "../state/zone-mutation";
import {
  configureLegalActionHostComposition,
  type LegalActionHostCompositionHost,
} from "../legal-action-hosts";
import { configureEventContextHostComposition } from "../events/event-context-hosts";
import { BAD_PUBLICITY_LOSS_THRESHOLD } from "../win-conditions";
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
  recordDupreBreakUsage,
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
  runnerInstallPaymentSourcePaymentsFromPayload,
  runnerProgramInstallAutomaticCreditSourceIds,
  runnerProgramInstallOptionalCreditSourceIds,
  type RunnerInstallCreditSpendResult,
} from "../install/runner-program-install-payment";
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
import { hashState } from "../hash";
import { applyAction as applyActionFromGame } from "../apply-action";
import {
  configureApplyActionHostComposition,
  type ApplyActionHostCompositionHost,
} from "../apply/apply-action-hosts";
import {
  hiddenRunnerResourceSlotId,
  isConcealedRunnerResource,
  resolveHiddenRunnerResourceSlot,
} from "../view/card-view";
import { toPublicEvent } from "../view/public-event-view";
import { validateGameState } from "../validation";
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
import {
  BOARDWALK_RANDOM_PROGRAM_SOURCE,
  RANDOM_RESOURCE_SOURCE,
} from "../../mechanics/random-effects";
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
import type {
  AutomaticEffectCollector,
  RuntimeDeps,
  VirusCounterPurgePreserveTarget,
  VisibleCounterPayload,
} from "./runtime-shared";
import { cloneState } from "./runtime-bootstrap-support";

export function createStateRuntimeResolvers(
  deps: RuntimeDeps,
): import("./state-runtime-resolver-port").StateRuntimeResolverPort {
  function resolveTraceHardwareWreckerSuccess(
    state: GameState,
    sourceDefinitionId: CardDefinitionId,
    sourceCardInstanceId: CardInstanceId,
    traceId: string,
  ): NonNullable<LegalAction["payload"]> {
    const targetHardwareId = deps.runnerInstalledHardwareTrashTarget(state);
    const targetDefinitionId = targetHardwareId
      ? definitionFor(state, targetHardwareId).id
      : undefined;
    if (targetHardwareId)
      deps.trashRunnerInstalledCardToHeap(state, targetHardwareId);
    const damageAmount = 2;
    const summary = doDamage(state, {
      damageId: `${traceId}.${sourceCardInstanceId}.unpreventable_meat`,
      damageType: "meat",
      amount: damageAmount,
      source: `trace_success:${sourceDefinitionId}`,
    });
    return {
      traceSuccessEffect: "hardware_trash_meat_damage_end_run",
      sourceDefinitionId,
      trashedCardType: "hardware",
      trashedCount: targetHardwareId ? 1 : 0,
      ...(targetDefinitionId
        ? { trashedCardDefinitionId: targetDefinitionId }
        : {}),
      damageCannotBePrevented: true,
      damageResolved: true,
      damageType: summary.damageType,
      damageAmount: summary.amount,
      cardsTrashed: summary.cardsTrashed,
      flatline: summary.flatline,
    };
  }

  function resolveTraceTrashRunnerResourceSuccess(
    state: GameState,
    sourceDefinitionId: CardDefinitionId,
    sourceCardInstanceId: CardInstanceId,
    traceId: string,
    targetCardId: CardInstanceId | undefined,
  ): NonNullable<LegalAction["payload"]> {
    if (
      !targetCardId ||
      !deps.runnerLastTurnInstalledResourceIds(state).includes(targetCardId)
    )
      throw new Error(
        "Die Runner-Resource ist fuer diesen Trace nicht mehr legal.",
      );
    const hiddenResource = isConcealedRunnerResource(state, targetCardId);
    const hiddenResourceSlotId = hiddenRunnerResourceSlotId(targetCardId);
    const targetDefinitionId = definitionFor(state, targetCardId).id;
    deps.trashRunnerInstalledCardToHeap(state, targetCardId);
    return {
      traceSuccessEffect: "trash_runner_resource_and_add_tag",
      sourceDefinitionId,
      sourceCardInstanceId,
      traceId,
      trashedCardType: "resource",
      trashedCount: 1,
      trashedCardDefinitionId: targetDefinitionId,
      ...(hiddenResource
        ? {
            hiddenResourceSlotId,
            hiddenRunnerResource: true,
            hiddenRunnerResourceRevealed: true,
            redactedKind: "hidden_runner_resource",
          }
        : {}),
    };
  }

  function encounterTemporaryTraceCreditsAvailable(
    state: GameState,
    trace: NonNullable<GameState["trace"]>,
  ): number {
    const credits = state.run?.encounterTemporaryTraceCredits;
    if (
      !credits ||
      credits.sourceIceId !== trace.sourceCardInstanceId ||
      credits.sourceIceId !== trace.encounterTemporaryTraceCreditSourceIceId
    )
      return 0;
    return Math.max(0, Math.floor(credits.remaining ?? 0));
  }

  function spendEncounterTemporaryTraceCredits(
    state: GameState,
    trace: NonNullable<GameState["trace"]>,
    amount: number,
  ): number {
    const credits = state.run?.encounterTemporaryTraceCredits;
    if (
      !credits ||
      credits.sourceIceId !== trace.sourceCardInstanceId ||
      amount <= 0
    )
      return 0;
    const spent = Math.min(Math.max(0, Math.floor(amount)), credits.remaining);
    credits.remaining = Math.max(0, credits.remaining - spent);
    return spent;
  }

  function identityModifierAmount(
    state: GameState,
    side: Side,
    kind: ModifierKind,
    duration: "setup" | "static",
  ): number {
    const identity = identityDefinition(state, side);
    return (identity.modifiers ?? [])
      .filter(
        (modifier) =>
          modifier.side === side &&
          modifier.kind === kind &&
          modifier.duration === duration,
      )
      .reduce((sum, modifier) => {
        if (!Number.isInteger(modifier.amount))
          throw new Error("Identity-Modifier ist ungueltig.");
        return sum + modifier.amount;
      }, 0);
  }

  function identityDefinition(state: GameState, side: Side): CardDefinition {
    return definitionFor(
      state,
      side === "runner" ? state.runner.identity : state.corp.identity,
    );
  }

  function executeEffectCommands(
    state: GameState,
    commands: EffectCommand[],
  ): void {
    for (const [commandIndex, command] of commands.entries()) {
      switch (command.type) {
        case "gain_credits":
          assertNonNegativeAmount(command.amount);
          applyCreditGain(state, {
            side: command.side,
            baseAmount: command.amount,
            source: {
              kind: "rule_effect",
              reason: "effect_command",
            },
          });
          break;
        case "spend_credits":
          assertNonNegativeAmount(command.amount);
          spendCredits(state, command.side, command.amount);
          break;
        case "draw_card":
          if (command.side === "corp") {
            drawCorpCards(state, command.amount ?? 1);
            const remainingCommands = commands.slice(commandIndex + 1);
            if (state.pendingCorpDraw && remainingCommands.length > 0) {
              state.pendingCorpDraw.continuation = {
                kind: "effect_commands",
                remainingCommands,
              };
              return;
            }
          } else {
            deps.drawRunnerCards(state, command.amount ?? 1);
          }
          break;
        case "do_damage":
          doDamage(state, {
            damageId: `effect.${command.source ?? "unknown"}.${state.stateVersion}.${state.randomCounter}`,
            damageType: command.damageType,
            amount: command.amount,
            source: command.source ?? "effect_command",
          });
          break;
        case "remove_tag":
          assertNonNegativeAmount(command.amount);
          state.runner.tags = Math.max(0, state.runner.tags - command.amount);
          break;
        case "change_breaker_strength":
          mustInstance(
            state.cardInstances,
            command.breakerId,
          ).strengthModifier += command.amount;
          break;
        case "break_subroutine": {
          const run = mustRun(state);
          if (!run.brokenSubroutineIndexes.includes(command.subroutineIndex))
            run.brokenSubroutineIndexes.push(command.subroutineIndex);
          break;
        }
        case "set_pending_choice":
          if (state.pendingChoice)
            throw new Error("Es ist bereits eine Choice offen.");
          state.pendingChoice = cloneState(command.choice);
          break;
        case "complete_pending_choice":
          if (
            !state.pendingChoice ||
            state.pendingChoice.choiceId !== command.choiceId
          )
            throw new Error("Diese Choice ist nicht offen.");
          delete state.pendingChoice;
          break;
        case "emit_event":
          throw new Error(
            "Effect-Event-Emission wird in V0.93 nur spezifiziert, aber nicht vom State-Only-Executor geschrieben.",
          );
      }
    }
  }

  function assertNonNegativeAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount < 0)
      throw new Error("Effect amount ist ungueltig.");
  }

  function assertPositiveIntegerAmount(amount: number): void {
    if (!Number.isInteger(amount) || amount <= 0)
      throw new Error("Damage amount ist ungueltig.");
  }

  function withoutVariableIceState(instance: CardInstance): CardInstance {
    const { variableIceState: _variableIceState, ...rest } = instance;
    void _variableIceState;
    return rest;
  }

  function clickCostForAction(legalAction: LegalAction): number {
    return legalAction.costs.reduce(
      (sum, cost) =>
        sum + (Number.isInteger(cost.clicks) && cost.clicks ? cost.clicks : 0),
      0,
    );
  }

  function creditCostForAction(legalAction: LegalAction): number {
    return legalAction.costs.reduce(
      (sum, cost) =>
        sum +
        (Number.isInteger(cost.credits) && cost.credits ? cost.credits : 0),
      0,
    );
  }

  function runnerActionsPerTurn(state: GameState): number {
    const override = Math.floor(state.runnerActionsPerTurnOverride ?? 4);
    return Math.max(0, override);
  }

  function agendaPoints(state: GameState, side: Side): number {
    const ids = side === "corp" ? state.corp.scoreArea : state.runner.scoreArea;
    const scoredPoints = ids.reduce(
      (sum, id) => sum + deps.agendaPointsForScoredCard(state, id),
      0,
    );
    return side === "corp"
      ? scoredPoints + Math.max(0, Math.floor(state.corpBonusAgendaPoints ?? 0))
      : scoredPoints;
  }

  function addVirusCounterWithCounterPrevention(
    state: GameState,
    targetCardId: CardInstanceId,
    amount: number,
    legalAction?: LegalAction,
  ): number {
    if (!Number.isInteger(amount) || amount < 0)
      throw new Error("Virus-Counter amount ist ungueltig.");
    let added = 0;
    let prevented = 0;
    let creditsPaid = 0;
    let preventionChargesSpent = 0;
    for (let index = 0; index < amount; index += 1) {
      const prevention = preventOneVirusCounterWithCounterPrevention(state);
      if (prevention.prevented) {
        prevented += 1;
        creditsPaid += prevention.creditsPaid;
        preventionChargesSpent += prevention.preventionChargesSpent;
        continue;
      }
      addCardCounter(state, targetCardId, "virus", 1);
      added += 1;
    }
    if (legalAction && prevented > 0) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        virusCounterAvoided: prevented,
        counterPreventionCreditsPaid: creditsPaid,
        runnerVirusCounterPreventionChargesSpent: preventionChargesSpent,
        corpRunnerVirusCounterPreventionChargesAfter:
          state.corpRunnerVirusCounterPreventionCharges ?? 0,
        corpCreditsAfter: state.corp.credits,
      };
    }
    return added;
  }

  function preventOneVirusCounterWithCounterPrevention(state: GameState): {
    prevented: boolean;
    creditsPaid: number;
    preventionChargesSpent: number;
  } {
    const storedCharges = Math.max(
      0,
      Math.floor(state.corpRunnerVirusCounterPreventionCharges ?? 0),
    );
    if (storedCharges > 0) {
      const remaining = storedCharges - 1;
      if (remaining > 0)
        state.corpRunnerVirusCounterPreventionCharges = remaining;
      else delete state.corpRunnerVirusCounterPreventionCharges;
      return {
        prevented: true,
        creditsPaid: 0,
        preventionChargesSpent: 1,
      };
    }
    const flags = ensureCorpTurnFlags(state);
    const sourceId = deps
      .rezzedCorpRootCardIds(state)
      .filter((cardId: CardInstanceId) =>
        deps.hasCorpUtilityKind(
          state,
          cardId,
          "counter_prevention_replacement",
        ),
      )
      .filter(
        (cardId: CardInstanceId) =>
          !abilityUsageSourceUsed(
            flags.counterPreventionUsedSourceIdsThisTurn,
            cardId,
          ),
      )
      .sort()[0];
    if (!sourceId || state.corp.credits < 1)
      return { prevented: false, creditsPaid: 0, preventionChargesSpent: 0 };
    state.corp.credits -= 1;
    flags.counterPreventionUsedSourceIdsThisTurn = markAbilityUsageSourceUsed(
      flags.counterPreventionUsedSourceIdsThisTurn,
      sourceId,
    );
    return { prevented: true, creditsPaid: 1, preventionChargesSpent: 0 };
  }

  function addVisibleCardCounter(
    state: GameState,
    cardId: CardInstanceId,
    counterType: CounterType,
    amount: number,
  ): VisibleCounterPayload {
    addCardCounter(state, cardId, counterType, amount);
    return {
      counterType,
      addedCounterAmount: amount,
      remainingCounters: cardCounter(state, cardId, counterType),
    };
  }

  function spendVisibleCardCounter(
    state: GameState,
    cardId: CardInstanceId,
    counterType: CounterType,
    amount: number,
  ): VisibleCounterPayload {
    spendCardCounter(state, cardId, counterType, amount);
    return {
      counterType,
      removedCounterAmount: amount,
      remainingCounters: cardCounter(state, cardId, counterType),
    };
  }

  function totalCounters(state: GameState, counterType: CounterType): number {
    const cardCounterTotal = Object.keys(state.cardInstances).reduce(
      (sum, cardId) => sum + cardCounter(state, cardId, counterType),
      0,
    );
    if (counterType !== "virus") return cardCounterTotal;
    let poxTotal = 0;
    for (const amount of Object.values(state.poxCountersByServer ?? {})) {
      poxTotal += Math.max(0, Math.floor(Number(amount ?? 0)));
    }
    let faitTotal = 0;
    for (const amount of Object.values(
      state.serverAgendaCostCountersByServer ?? {},
    )) {
      faitTotal += Math.max(0, Math.floor(Number(amount ?? 0)));
    }
    return cardCounterTotal + poxTotal + faitTotal;
  }

  function installedVirusCounterPurgePreserveSourceIds(
    state: GameState,
  ): CardInstanceId[] {
    return state.runner.rig.resources
      .filter(
        (cardId) =>
          deps.hiddenReplacementLongtailForDefinition(
            definitionFor(state, cardId),
          )?.kind === "purge_replacement_with_runner_virus_counter_cleanup",
      )
      .sort();
  }

  function virusCounterPurgePreserveTargets(
    state: GameState,
  ): Array<
    VirusCounterPurgePreserveTarget & { optionId: string; publicLabel: string }
  > {
    const targets: Array<
      VirusCounterPurgePreserveTarget & {
        optionId: string;
        publicLabel: string;
      }
    > = [];
    for (const cardId of deps.visibleVirusCounterTargetIds(state).sort()) {
      const amount = cardCounter(state, cardId, "virus");
      const title = definitionFor(state, cardId).title;
      for (let index = 1; index <= amount; index += 1) {
        targets.push({
          kind: "card",
          cardId,
          index,
          optionId: `card:${cardId}:${index}`,
          publicLabel: `${title} Virus-Counter ${index}`,
        });
      }
    }
    for (const [serverId, rawAmount] of Object.entries(
      state.poxCountersByServer ?? {},
    ).sort(([left], [right]) => left.localeCompare(right))) {
      const amount = Math.max(0, Math.floor(Number(rawAmount ?? 0)));
      if (amount <= 0) continue;
      const typedServerId = serverId as Exclude<ServerId, "new_remote">;
      const label = publicServerLabel(state, typedServerId) ?? typedServerId;
      for (let index = 1; index <= amount; index += 1) {
        targets.push({
          kind: "pox",
          serverId: typedServerId,
          index,
          optionId: `pox:${typedServerId}:${index}`,
          publicLabel: `Pox auf ${label} ${index}`,
        });
      }
    }
    return targets;
  }

  function startVirusCounterPurgePreserveChoice(
    state: GameState,
    legalAction: LegalAction,
  ): boolean {
    const sourceIds = installedVirusCounterPurgePreserveSourceIds(state);
    if (sourceIds.length === 0) return false;
    const targets = virusCounterPurgePreserveTargets(state);
    if (targets.length === 0) return false;
    const sourceCardId = sourceIds[0];
    if (!sourceCardId)
      throw new Error(
        "Keine installierte Virus-Purge-Erhaltungsquelle gefunden.",
      );
    state.pendingChoice = {
      choiceId: `runner_virus_purge_replacement_${state.stateVersion + 1}`,
      side: "runner",
      source: `runner_virus_counter_purge_replacement:${sourceCardId}:${state.stateVersion + 1}`,
      prompt: "Bis zu zwei Virus-Counter behalten.",
      kind: "select_cards",
      options: targets.map((target) => ({
        id: target.optionId,
        label: target.publicLabel,
        publicLabel: target.publicLabel,
        value: target.optionId,
      })),
      minSelections: 0,
      maxSelections: Math.min(2, targets.length),
      stateVersion: state.stateVersion + 1,
      visibility: "public",
    };
    state.activeSide = "runner";
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      sourceDefinitionId: definitionFor(state, sourceCardId).id,
      runnerVirusCounterPurgeReplacementOpened: true,
      eligibleCounterCount: targets.length,
      maxPreserveCounters: Math.min(2, targets.length),
      purgedCounterType: "virus",
    };
    return true;
  }

  function parseVirusCounterPurgePreserveOption(
    optionId: string,
  ): VirusCounterPurgePreserveTarget | undefined {
    const [kind, id, indexRaw] = optionId.split(":");
    const index = Number(indexRaw);
    if (!Number.isInteger(index) || index <= 0) return undefined;
    if (kind === "card" && id)
      return { kind: "card", cardId: id as CardInstanceId, index };
    if (kind === "pox" && id && id !== "new_remote")
      return {
        kind: "pox",
        serverId: id as Exclude<ServerId, "new_remote">,
        index,
      };
    return undefined;
  }

  function restorePurgePreservedVirusCounters(
    state: GameState,
    selectedOptionIds: string[],
  ): { preserved: number; preservedCardDefinitionIds: CardDefinitionId[] } {
    const selectedTargets = selectedOptionIds
      .map(parseVirusCounterPurgePreserveOption)
      .filter((target): target is VirusCounterPurgePreserveTarget =>
        Boolean(target),
      );
    if (selectedTargets.length !== selectedOptionIds.length)
      throw new Error("Die Virus-Counter-Erhaltungsauswahl ist ungueltig.");
    if (selectedTargets.length > 2)
      throw new Error(
        "Diese Replacement-Faehigkeit kann hoechstens 2 Counter behalten.",
      );
    const beforeCardCounts = new Map<CardInstanceId, number>();
    const beforePoxCounts = new Map<Exclude<ServerId, "new_remote">, number>();
    const preservedCardDefinitionIds: CardDefinitionId[] = [];
    for (const target of selectedTargets) {
      if (target.kind === "card") {
        if (!deps.visibleVirusCounterTargetIds(state).includes(target.cardId))
          throw new Error(
            "Ein Virus-Counter-Erhaltungsziel ist nicht mehr legal.",
          );
        const count =
          beforeCardCounts.get(target.cardId) ??
          cardCounter(state, target.cardId, "virus");
        if (target.index > count)
          throw new Error(
            "Ein zu erhaltender Virus-Counter existiert nicht mehr.",
          );
        beforeCardCounts.set(target.cardId, count);
      } else {
        mustServer(state, target.serverId);
        const count =
          beforePoxCounts.get(target.serverId) ??
          Math.max(
            0,
            Math.floor(
              Number(state.poxCountersByServer?.[target.serverId] ?? 0),
            ),
          );
        if (target.index > count)
          throw new Error(
            "Ein zu erhaltender Pox-Counter existiert nicht mehr.",
          );
        beforePoxCounts.set(target.serverId, count);
      }
    }

    purgeVirusCounters(state);

    const cardPreserveCounts = new Map<CardInstanceId, number>();
    const poxPreserveCounts = new Map<
      Exclude<ServerId, "new_remote">,
      number
    >();
    for (const target of selectedTargets) {
      if (target.kind === "card") {
        cardPreserveCounts.set(
          target.cardId,
          (cardPreserveCounts.get(target.cardId) ?? 0) + 1,
        );
      } else {
        poxPreserveCounts.set(
          target.serverId,
          (poxPreserveCounts.get(target.serverId) ?? 0) + 1,
        );
      }
    }
    for (const [cardId, amount] of cardPreserveCounts) {
      setCardCounter(state, cardId, "virus", amount);
      preservedCardDefinitionIds.push(definitionFor(state, cardId).id);
    }
    for (const [serverId, amount] of poxPreserveCounts) {
      state.poxCountersByServer = {
        ...(state.poxCountersByServer ?? {}),
        [serverId]: amount,
      };
    }
    return {
      preserved: selectedTargets.length,
      preservedCardDefinitionIds: preservedCardDefinitionIds.sort(),
    };
  }

  function resolveVirusCounterPurgePreserveChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (
      !choice ||
      !choice.source.startsWith("runner_virus_counter_purge_replacement")
    )
      throw new Error("Es ist keine Virus-Counter-Erhaltungs-Choice offen.");
    const [, sourceCardId] = choice.source.split(":");
    if (
      !sourceCardId ||
      !installedVirusCounterPurgePreserveSourceIds(state).includes(sourceCardId)
    )
      throw new Error("Die Replacement-Quelle ist nicht mehr installiert.");
    const selected = selectedChoiceIds(playerAction.selectedChoices);
    const legalOptionIds = new Set(choice.options.map((option) => option.id));
    if (selected.some((optionId) => !legalOptionIds.has(optionId)))
      throw new Error("Die Virus-Counter-Erhaltungsauswahl ist nicht legal.");
    const result = restorePurgePreservedVirusCounters(state, selected);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      sourceDefinitionId: definitionFor(state, sourceCardId).id,
      purgedCounterType: "virus",
      preservedCounterAmount: result.preserved,
      ...(result.preservedCardDefinitionIds.length > 0
        ? {
            preservedCardDefinitionIds:
              result.preservedCardDefinitionIds.join(","),
          }
        : {}),
      remainingVirusCounters: totalCounters(state, "virus"),
    };
    delete state.pendingChoice;
  }

  function installedProgramTrashBackupHardwareIds(
    state: GameState,
  ): CardInstanceId[] {
    return state.runner.rig.hardware
      .filter(
        (cardId) =>
          deps.runnerUtilityLongtailKindForCard(state, cardId) ===
          "replace_installed_program_trash_with_host_on_source",
      )
      .sort();
  }

  function availableRunnerProgramInstallCredits(state: GameState): number {
    return (
      state.runner.credits +
      runnerRecurringCredits(state) +
      restrictedHostedCredits(state, "install_programs", {
        installCardType: "program",
      }) +
      deps.valuPakTemporaryProgramInstallCredits(state)
    );
  }

  function runnerCanPayInstallCost(
    state: GameState,
    amount: number,
    cardType: CardDefinition["type"],
  ): boolean {
    if (amount <= 0) return true;
    if (cardType === "program")
      return availableRunnerProgramInstallCredits(state) >= amount;
    return state.runner.credits >= amount;
  }

  function runnerCostPenaltySupportCreditCapacity(state: GameState): number {
    return runnerPaymentSupportCreditCapacity(state);
  }

  function openRunnerCostPenaltySupportWindow(
    state: GameState,
    legalAction: LegalAction,
    amount: number,
    cardType: CardDefinition["type"],
  ): boolean {
    return openRunnerCostPenaltySupportWindowHelper(state, legalAction, {
      amount,
      availableWithoutSupport:
        cardType === "program"
          ? availableRunnerProgramInstallCredits(state)
          : state.runner.credits,
      context:
        cardType === "program" ? "runner_program_install" : "runner_install",
    });
  }

  function closeRunnerCostPenaltySupportWindowForPayment(
    state: GameState,
    legalAction: LegalAction,
    amount: number,
  ): void {
    closeRunnerCostPenaltySupportWindowForPaymentHelper(
      state,
      legalAction,
      amount,
    );
  }

  function runnerRecurringCredits(state: GameState): number {
    return runnerProgramInstallRecurringCreditSourceIds(state).reduce(
      (sum, cardId) => sum + cardCounter(state, cardId, "recurring_credit"),
      0,
    );
  }

  function runnerProgramInstallRecurringCreditSourceIds(
    state: GameState,
  ): CardInstanceId[] {
    return runnerProgramInstallAutomaticCreditSourceIds(state);
  }

  function spendRunnerInstallCredits(
    state: GameState,
    amount: number,
    cardType: CardDefinition["type"],
    paymentPayload?: LegalAction["payload"],
  ): RunnerInstallCreditSpendResult {
    const result = {
      amount: Math.max(0, Math.floor(amount)),
      normalCreditsSpent: 0,
      hostedCreditsSpent: 0,
      recurringCreditsSpent: 0,
      temporaryCreditsSpent: 0,
      sourceDefinitionIds: [] as string[],
      runnerCreditsAfter: state.runner.credits,
    };
    if (amount <= 0) return result;
    if (cardType !== "program") {
      spendCredits(state, "runner", amount);
      result.normalCreditsSpent = amount;
      result.runnerCreditsAfter = state.runner.credits;
      return result;
    }
    if (availableRunnerProgramInstallCredits(state) < amount)
      throw new Error(
        "Der Runner kann die Installationskosten nicht bezahlen.",
      );
    const sourceDefinitionIds = new Set<string>();
    const declaredSourcePayments =
      runnerInstallPaymentSourcePaymentsFromPayload(paymentPayload);
    if (declaredSourcePayments) {
      let remaining = amount;
      const optionalSources = new Set(
        runnerProgramInstallOptionalCreditSourceIds(state),
      );
      const seenSources = new Set<CardInstanceId>();
      for (const payment of declaredSourcePayments) {
        if (seenSources.has(payment.sourceCardId))
          throw new Error(
            "Die Programminstallations-Zahlungsaufteilung enthaelt doppelte Quellen.",
          );
        seenSources.add(payment.sourceCardId);
        if (!optionalSources.has(payment.sourceCardId))
          throw new Error(
            "Eine Zahlungsquelle ist fuer diese Programminstallation nicht legal.",
          );
        if (hostedPaymentCredits(state, payment.sourceCardId) < payment.amount)
          throw new Error(
            "Eine Zahlungsquelle hat nicht genug verfuegbare Bits.",
          );
        if (payment.amount <= 0) continue;
        if (payment.amount > remaining)
          throw new Error(
            "Die Programminstallations-Zahlungsaufteilung zahlt zu viele Bits.",
          );
        spendHostedPaymentCredits(state, payment.sourceCardId, payment.amount);
        remaining -= payment.amount;
        result.hostedCreditsSpent += payment.amount;
        sourceDefinitionIds.add(definitionFor(state, payment.sourceCardId).id);
      }
      const flags = ensureRunnerTurnFlags(state);
      const temporary = Math.min(
        deps.valuPakTemporaryProgramInstallCredits(state),
        remaining,
      );
      if (temporary > 0) {
        spendRestrictedActionGrantTemporaryCredits(
          flags,
          RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
          temporary,
        );
        flags.valuPakTemporaryProgramInstallCredits = Math.max(
          0,
          Math.floor(flags.valuPakTemporaryProgramInstallCredits ?? 0) -
            temporary,
        );
        remaining -= temporary;
        result.temporaryCreditsSpent = temporary;
      }
      for (const cardId of runnerProgramInstallRecurringCreditSourceIds(
        state,
      )) {
        if (remaining <= 0) break;
        const available = hostedPaymentCredits(state, cardId);
        const spent = Math.min(available, remaining);
        if (spent > 0) {
          spendHostedPaymentCredits(state, cardId, spent);
          remaining -= spent;
          result.hostedCreditsSpent += spent;
          result.recurringCreditsSpent += spent;
          sourceDefinitionIds.add(definitionFor(state, cardId).id);
        }
      }
      spendCredits(state, "runner", remaining);
      result.normalCreditsSpent = remaining;
      result.sourceDefinitionIds = [...sourceDefinitionIds].sort();
      result.runnerCreditsAfter = state.runner.credits;
      return result;
    }
    let remaining = amount;
    const flags = ensureRunnerTurnFlags(state);
    const temporary = Math.min(
      deps.valuPakTemporaryProgramInstallCredits(state),
      remaining,
    );
    if (temporary > 0) {
      spendRestrictedActionGrantTemporaryCredits(
        flags,
        RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
        temporary,
      );
      flags.valuPakTemporaryProgramInstallCredits = Math.max(
        0,
        Math.floor(flags.valuPakTemporaryProgramInstallCredits ?? 0) -
          temporary,
      );
      remaining -= temporary;
      result.temporaryCreditsSpent = temporary;
    }
    const restricted = spendRestrictedHostedCredits(
      state,
      "install_programs",
      remaining,
      { installCardType: cardType },
    );
    remaining -= restricted.spent;
    result.hostedCreditsSpent += restricted.spent;
    for (const definitionId of restricted.sourceDefinitionIds)
      sourceDefinitionIds.add(definitionId);
    for (const cardId of runnerProgramInstallRecurringCreditSourceIds(state)) {
      if (remaining <= 0) break;
      const available = hostedPaymentCredits(state, cardId);
      const spent = Math.min(available, remaining);
      if (spent > 0) {
        spendHostedPaymentCredits(state, cardId, spent);
        remaining -= spent;
        result.hostedCreditsSpent += spent;
        result.recurringCreditsSpent += spent;
        sourceDefinitionIds.add(definitionFor(state, cardId).id);
      }
    }
    spendCredits(state, "runner", remaining);
    result.normalCreditsSpent = remaining;
    result.sourceDefinitionIds = [...sourceDefinitionIds].sort();
    result.runnerCreditsAfter = state.runner.credits;
    return result;
  }

  function runnerTagRemovalRecurringCreditSourceIds(
    state: GameState,
  ): CardInstanceId[] {
    return [...restrictedHostedCreditSourceIds(state, "remove_tags")].sort();
  }

  function runnerTagRemovalRecurringCredits(state: GameState): number {
    return runnerTagRemovalRecurringCreditSourceIds(state).reduce(
      (sum, cardId) => sum + hostedPaymentCredits(state, cardId),
      0,
    );
  }

  function availableRunnerTagRemovalCredits(state: GameState): number {
    return state.runner.credits + runnerTagRemovalRecurringCredits(state);
  }

  function spendRunnerTagRemovalCredits(
    state: GameState,
    amount: number,
    legalAction: LegalAction,
  ): void {
    if (amount <= 0) return;
    if (availableRunnerTagRemovalCredits(state) < amount)
      throw new Error("Der Runner kann die Tag-Entfernung nicht bezahlen.");
    let remaining = amount;
    let recurringSpent = 0;
    let armadilloRecurringSpent = 0;
    const recurringSourceDefinitionIds: string[] = [];
    for (const cardId of runnerTagRemovalRecurringCreditSourceIds(state)) {
      if (remaining <= 0) break;
      const spent = Math.min(hostedPaymentCredits(state, cardId), remaining);
      if (spent <= 0) continue;
      spendHostedPaymentCredits(state, cardId, spent);
      const sourceDefinitionId = definitionFor(state, cardId).id;
      if (
        restrictedHostedCreditSourceForDefinition(
          definitionFor(state, cardId),
        )?.usableFor.includes("remove_tags")
      )
        armadilloRecurringSpent += spent;
      recurringSourceDefinitionIds.push(sourceDefinitionId);
      recurringSpent += spent;
      remaining -= spent;
    }
    spendCredits(state, "runner", remaining);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      removeTagAmount: 1,
      ...(recurringSpent > 0
        ? {
            ...(armadilloRecurringSpent > 0
              ? { armadilloRecurringCreditsSpent: armadilloRecurringSpent }
              : {}),
            tagRemovalRecurringCreditsSpent: recurringSpent,
            runnerCreditsSpent: remaining,
            tagRemovalCreditSourceDefinitionIds:
              recurringSourceDefinitionIds.join(","),
          }
        : {}),
    };
  }

  function refreshRecurringCredits(
    state: GameState,
    side: Side,
    effects?: AutomaticEffectCollector,
  ): void {
    if (side !== "runner" || !deps.isV099OrLater(state)) return;
    for (const cardId of runnerInstalledCardIds(state)) {
      const definition = definitionFor(state, cardId);
      const restrictedSource =
        restrictedHostedCreditSourceForDefinition(definition);
      if (restrictedSource) {
        if (
          restrictedSource.counterType !== "bit" ||
          restrictedSource.refresh.timing !== "start_of_runner_turn" ||
          restrictedSource.refresh.mode !== "refill_to_capacity_if_used"
        )
          throw new Error("Restricted hosted credit source is invalid.");
        const capacity = Math.max(0, Math.floor(restrictedSource.capacity));
        const previous = cardCounter(state, cardId, "bit");
        if (previous < capacity) {
          setCardCounter(state, cardId, "bit", capacity);
          effects?.push(
            deps.automaticCounterChangeEffect(
              `runner.start.restricted_hosted_credit.${cardId}`,
              "runner",
              definition.id,
              "bit",
              capacity,
              capacity - previous,
            ),
          );
        }
        continue;
      }
      const recurringCredits = definition.recurringCredits ?? 0;
      if (recurringCredits > 0) {
        const previous = cardCounter(state, cardId, "recurring_credit");
        setCardCounter(state, cardId, "recurring_credit", recurringCredits);
        if (previous !== recurringCredits) {
          effects?.push(
            deps.automaticCounterChangeEffect(
              `runner.start.recurring_credit.${cardId}`,
              "runner",
              definition.id,
              "recurring_credit",
              recurringCredits,
              Math.max(0, recurringCredits - previous),
            ),
          );
        }
      }
    }
  }

  return {
    resolveTraceHardwareWreckerSuccess,
    resolveTraceTrashRunnerResourceSuccess,
    encounterTemporaryTraceCreditsAvailable,
    spendEncounterTemporaryTraceCredits,
    identityModifierAmount,
    identityDefinition,
    executeEffectCommands,
    assertNonNegativeAmount,
    assertPositiveIntegerAmount,
    withoutVariableIceState,
    clickCostForAction,
    creditCostForAction,
    runnerActionsPerTurn,
    agendaPoints,
    addVirusCounterWithCounterPrevention,
    preventOneVirusCounterWithCounterPrevention,
    addVisibleCardCounter,
    spendVisibleCardCounter,
    totalCounters,
    installedVirusCounterPurgePreserveSourceIds,
    virusCounterPurgePreserveTargets,
    startVirusCounterPurgePreserveChoice,
    parseVirusCounterPurgePreserveOption,
    restorePurgePreservedVirusCounters,
    resolveVirusCounterPurgePreserveChoice,
    installedProgramTrashBackupHardwareIds,
    availableRunnerProgramInstallCredits,
    runnerCanPayInstallCost,
    runnerCostPenaltySupportCreditCapacity,
    openRunnerCostPenaltySupportWindow,
    closeRunnerCostPenaltySupportWindowForPayment,
    runnerRecurringCredits,
    runnerProgramInstallRecurringCreditSourceIds,
    spendRunnerInstallCredits,
    runnerTagRemovalRecurringCreditSourceIds,
    runnerTagRemovalRecurringCredits,
    availableRunnerTagRemovalCredits,
    spendRunnerTagRemovalCredits,
    refreshRecurringCredits,
  };
}
