import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { createChoiceHiddenZoneRuntime } from "./choice-hidden-zone-runtime";
import { createLifecycleRuntime } from "./lifecycle-runtime";
import { createTurnCorpRuntime } from "./turn-corp-runtime";
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
import { publicIceRunSubroutineDerivation } from "../run/public-ice-run-derivation";
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
import { temporaryBreakerStrengthBonusUntilEndOfTurn } from "../state/temporary-breaker-strength";
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
  icebreakerAbilityForLegalAction,
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
import type { RuntimeDeps } from "./runtime-shared";

export function createCardRuntimeDepsHosts(
  deps: RuntimeDeps,
  runtime: RuntimeDeps,
): Pick<
  import("./card-runtime-host-port").CardRuntimeHostPort,
  | "selectedServerIcebreakerStrengthCounterBonus"
  | "permanentIcebreakerStrengthCounterBonus"
  | "pumpAmountForLegalAction"
  | "pumpAbilityForLegalAction"
  | "breakAbilityForLegalAction"
  | "pumpDurationForLegalAction"
  | "assertCurrentSubroutineMatchesLegalAction"
  | "resolveMultiBreakSubroutinesAction"
  | "assertBreakSubroutineCostQuoteValid"
  | "subroutinesForCurrentEncounter"
  | "variableTraceSubroutineForCurrentEncounter"
  | "relativeDamageSubroutineForCurrentEncounter"
  | "relativeTraceSubroutinesForCurrentEncounter"
  | "runCardImplementationActionHost"
  | "runStartTaxForServerUpgrades"
  | "runStartTaxForCorpRootAssets"
  | "spendRunnerAccessTrashCredits"
> {
  function selectedServerIcebreakerStrengthCounterBonus(
    state: GameState,
    breakerId: CardInstanceId,
  ): number {
    if (
      !deps.icebreakerHasSpecial(
        state,
        breakerId,
        "dupre_strength_counter_and_last_fort",
      )
    )
      return 0;
    const selectedServerId = mustInstance(
      state.cardInstances,
      breakerId,
    ).selectedServerId;
    if (
      state.run &&
      selectedServerId &&
      selectedServerId !== state.run.attackedServerId
    )
      return 0;
    return cardCounter(state, breakerId, "power");
  }

  function currentRunIcebreakerBaseStrength(
    state: GameState,
    breakerId: CardInstanceId,
    breakerDefinition: CardDefinition,
  ): number {
    const run = state.run;
    const runStrength =
      run?.runStartRandomStrengthByBreaker?.[breakerId] ??
      (run?.runStartRandomStrengthSourceCardId === breakerId
        ? run.runStartRandomStrength
        : undefined);
    return typeof runStrength === "number"
      ? runStrength
      : (breakerDefinition.strength ?? 0);
  }

  function permanentIcebreakerStrengthCounterBonus(
    state: GameState,
    breakerId: CardInstanceId,
  ): number {
    if (
      deps.icebreakerHasSpecial(
        state,
        breakerId,
        "dupre_strength_counter_and_last_fort",
      )
    )
      return 0;
    return cardCounter(state, breakerId, "power");
  }

  function pumpAmountForLegalAction(
    state: GameState,
    legalAction: LegalAction,
  ): number {
    const breakerId = String(
      legalAction.payload?.breakerId ?? "",
    ) as CardInstanceId;
    const definition = state.cardInstances[breakerId]
      ? definitionFor(state, breakerId)
      : undefined;
    if (!definition)
      throw new Error("Die Breaker-Definition existiert nicht mehr.");
    const ability = icebreakerAbilityForLegalAction(
      definition,
      breakerId,
      legalAction,
      "pump_strength",
    );
    const payloadAmount = Number(legalAction.payload?.pumpAmount);
    if (Number.isInteger(payloadAmount) && payloadAmount >= 0)
      return payloadAmount;
    const amount = ability?.amount ?? 1;
    return Number.isInteger(amount) ? amount : 1;
  }

  function pumpAbilityForLegalAction(
    state: GameState,
    legalAction: LegalAction,
  ): RuntimeIcebreakerAbility | undefined {
    const breakerId = String(
      legalAction.payload?.breakerId ?? "",
    ) as CardInstanceId;
    const definition = state.cardInstances[breakerId]
      ? definitionFor(state, breakerId)
      : undefined;
    if (!definition)
      throw new Error("Die Breaker-Definition existiert nicht mehr.");
    return icebreakerAbilityForLegalAction(
      definition,
      breakerId,
      legalAction,
      "pump_strength",
    );
  }

  function breakAbilityForLegalAction(
    state: GameState,
    legalAction: LegalAction,
  ): RuntimeIcebreakerAbility | undefined {
    if (legalAction.payload?.nextSentryFreeBreak === true) return undefined;
    const breakerId = String(
      legalAction.payload?.breakerId ?? "",
    ) as CardInstanceId;
    const definition = state.cardInstances[breakerId]
      ? definitionFor(state, breakerId)
      : undefined;
    if (!definition)
      throw new Error("Die Breaker-Definition existiert nicht mehr.");
    return icebreakerAbilityForLegalAction(
      definition,
      breakerId,
      legalAction,
      "break_subroutine",
    );
  }

  function pumpDurationForLegalAction(
    state: GameState,
    legalAction: LegalAction,
  ): "current_encounter" | "current_run" | "current_turn" {
    const breakerId = String(
      legalAction.payload?.breakerId ?? "",
    ) as CardInstanceId;
    const definition = state.cardInstances[breakerId]
      ? definitionFor(state, breakerId)
      : undefined;
    if (!definition)
      throw new Error("Die Breaker-Definition existiert nicht mehr.");
    const ability = icebreakerAbilityForLegalAction(
      definition,
      breakerId,
      legalAction,
      "pump_strength",
    );
    return ability?.strengthDuration ?? "current_encounter";
  }

  function assertCurrentSubroutineMatchesLegalAction(
    state: GameState,
    iceDefinition: CardDefinition,
    subroutineIndex: number,
    legalAction: LegalAction,
  ): NonNullable<CardDefinition["subroutines"]>[number] {
    const subroutine = subroutinesForCurrentEncounter(state, iceDefinition)[
      subroutineIndex
    ];
    if (!subroutine) throw new Error("Subroutine existiert nicht mehr.");
    const expectedSubroutineId =
      typeof legalAction.payload?.subroutineId === "string"
        ? legalAction.payload.subroutineId
        : undefined;
    if (expectedSubroutineId && subroutine.id !== expectedSubroutineId)
      throw new Error("Subroutine-Ziel ist nicht mehr gueltig.");
    return subroutine;
  }

  function resolveMultiBreakSubroutinesAction(
    state: GameState,
    breakerId: CardInstanceId,
    legalAction: LegalAction,
  ): void {
    const run = mustRun(state);
    const iceId = String(legalAction.payload?.iceId ?? "");
    if (run.phase !== "encounter_ice" || !run.encounteredIceId)
      throw new Error("Multi-Break kann nur im ICE-Encounter genutzt werden.");
    if (run.encounteredIceId !== iceId)
      throw new Error("Multi-Break zielt nicht auf das encountered ICE.");
    if (run.noBreakSubroutinesActive)
      throw new Error(
        "Subroutinen koennen in diesem Encounter nicht gebrochen werden.",
      );
    if (!state.runner.rig.programs.includes(breakerId))
      throw new Error("Der Icebreaker ist nicht installiert.");
    const breakerDefinition = definitionFor(state, breakerId);
    const iceDefinition = definitionFor(state, iceId);
    if (legalAction.payload?.targetIceDefinitionId !== iceDefinition.id)
      throw new Error("Multi-Break zielt auf die falsche ICE-Definition.");
    const ability = icebreakerAbilityForLegalAction(
      breakerDefinition,
      breakerId,
      legalAction,
      "break_subroutine",
    );
    if (
      !ability ||
      !breakAbilityMatchesIce(
        ability,
        deps.effectiveSubtypesForCard(
          state,
          iceId as CardInstanceId,
          iceDefinition,
        ),
        iceDefinition.id,
      )
    )
      throw new Error(
        "Der Icebreaker hat keine gueltige Multi-Break-Faehigkeit.",
      );
    if (
      ability.selectedIceSubtypeFromBreaker &&
      !deps
        .effectiveSubtypesForCard(state, iceId as CardInstanceId, iceDefinition)
        .includes(
          deps.normalizeSubtypeLabel(
            mustInstance(state.cardInstances, breakerId).selectedSubtype ?? "",
          ),
        )
    )
      throw new Error("Der gewählte Icebreaker-Typ passt nicht zum ICE.");
    const breakerStrength =
      currentRunIcebreakerBaseStrength(state, breakerId, breakerDefinition) +
      mustInstance(state.cardInstances, breakerId).strengthModifier +
      deps.hostedProgramStrengthModifier(state, breakerId) +
      deps.icebreakerEncounterStrengthBonus(state, breakerId, iceId) +
      cardCounter(state, breakerId, "militech") +
      permanentIcebreakerStrengthCounterBonus(state, breakerId) +
      (cardCounter(state, breakerId, "breaker_strength_penalty") +
        cardCounter(state, breakerId, "pattel")) *
        -1 +
      selectedServerIcebreakerStrengthCounterBonus(state, breakerId) +
      temporaryBreakerStrengthBonusUntilEndOfTurn(state, breakerId) +
      deps.runRemainderStrengthBonusForBreaker(run, breakerId);
    if (breakerStrength < deps.iceStrengthFor(state, iceId))
      throw new Error("Der Icebreaker ist nicht stark genug fuer dieses ICE.");
    const rawIndexes =
      typeof legalAction.payload?.subroutineIndexes === "string"
        ? legalAction.payload.subroutineIndexes
        : "";
    if (!rawIndexes) throw new Error("Multi-Break braucht Subroutine-Ziele.");
    const subroutineIndexes = rawIndexes
      .split(",")
      .map((value) => Number(value));
    const subroutines = subroutinesForCurrentEncounter(state, iceDefinition);
    const eligibleIndexes = subroutines
      .map((subroutine, index) => ({ subroutine, index }))
      .filter(
        ({ subroutine, index }) =>
          breakAbilityMatchesSubroutine(
            ability,
            subroutine,
            deps.effectiveSubtypesForCard(
              state,
              iceId as CardInstanceId,
              iceDefinition,
            ),
          ) &&
          !run.brokenSubroutineIndexes.includes(index) &&
          !run.resolvedSubroutineIndexes.includes(index),
      )
      .map(({ index }) => index);
    const maxSelectableCount = ability.breakAllMatchingSubroutines
      ? eligibleIndexes.length
      : Math.min(ability.count ?? 4, subroutines.length);
    if (
      subroutineIndexes.length < 1 ||
      subroutineIndexes.length > maxSelectableCount ||
      new Set(subroutineIndexes).size !== subroutineIndexes.length ||
      subroutineIndexes.some((index) => !Number.isInteger(index) || index < 0)
    ) {
      throw new Error("Multi-Break hat ungueltige Subroutine-Ziele.");
    }
    if (
      ability.breakAllMatchingSubroutines &&
      (subroutineIndexes.length !== eligibleIndexes.length ||
        eligibleIndexes.some((index) => !subroutineIndexes.includes(index)))
    ) {
      throw new Error("Dieser Break muss alle passenden Subroutinen brechen.");
    }
    for (const subroutineIndex of subroutineIndexes) {
      const subroutine = subroutines[subroutineIndex];
      if (!subroutine)
        throw new Error("Multi-Break zielt auf eine fehlende Subroutine.");
      if (
        !breakAbilityMatchesSubroutine(
          ability,
          subroutine,
          deps.effectiveSubtypesForCard(
            state,
            iceId as CardInstanceId,
            iceDefinition,
          ),
        )
      )
        throw new Error("Multi-Break kann diese Subroutine nicht brechen.");
      if (
        run.brokenSubroutineIndexes.includes(subroutineIndex) ||
        run.resolvedSubroutineIndexes.includes(subroutineIndex)
      ) {
        throw new Error(
          "Multi-Break zielt auf eine bereits erledigte Subroutine.",
        );
      }
    }
    const expectedCost = deps.breakSubroutineCostBreakdown(
      state,
      ability.cost.credits,
      subroutineIndexes.length,
      breakerId,
    ).totalCost;
    if ((legalAction.costs[0]?.credits ?? 0) !== expectedCost)
      throw new Error("Multi-Break-Kosten sind nicht mehr gueltig.");
    const payment = spendRunnerRunCredits(
      runDurationPaymentHost(state),
      expectedCost,
      breakerId,
      legalAction,
    );
    if (payment.handled && payment.paid === false) return;
    deps.executeEffectCommands(
      state,
      subroutineIndexes.map((subroutineIndex) => ({
        type: "break_subroutine",
        subroutineIndex,
      })),
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      breakSubroutineCount: subroutineIndexes.length,
      multiBreakSubroutines: true,
      ...(ability.breakAllMatchingSubroutines
        ? { breakAllMatchingSubroutines: true }
        : {}),
      ...(ability.onUseEndRun ? { breakerEndsRunAfterBreak: true } : {}),
      sourceDefinitionId: breakerDefinition.id,
    };
    applyPostBreakStealthLoss(
      deps.fortRunSideFamiliesHostForState(state),
      breakerId,
      legalAction,
    );
  }

  function assertBreakSubroutineCostQuoteValid(
    state: GameState,
    breakerId: CardInstanceId | undefined,
    legalAction: LegalAction,
    subroutine: NonNullable<CardDefinition["subroutines"]>[number],
  ): void {
    if (!breakerId) throw new Error("Break-Subroutine-Quelle fehlt.");
    const run = mustRun(state);
    if (run.phase !== "encounter_ice" || !run.encounteredIceId)
      throw new Error("Subroutine kann nur im ICE-Encounter gebrochen werden.");
    if (!state.runner.rig.programs.includes(breakerId))
      throw new Error("Breaker ist nicht installiert.");
    const breakerDefinition = definitionFor(state, breakerId);
    const iceDefinition = definitionFor(state, run.encounteredIceId);
    const ability = icebreakerAbilityForLegalAction(
      breakerDefinition,
      breakerId,
      legalAction,
      "break_subroutine",
    );
    if (
      !ability ||
      !breakAbilityMatchesIce(
        ability,
        deps.effectiveSubtypesForCard(
          state,
          run.encounteredIceId,
          iceDefinition,
        ),
        iceDefinition.id,
      )
    )
      throw new Error("Breaker hat keine gueltige Break-Faehigkeit.");
    if (
      ability.selectedIceSubtypeFromBreaker &&
      !deps
        .effectiveSubtypesForCard(state, run.encounteredIceId, iceDefinition)
        .includes(
          deps.normalizeSubtypeLabel(
            mustInstance(state.cardInstances, breakerId).selectedSubtype ?? "",
          ),
        )
    )
      throw new Error("Der gewählte Icebreaker-Typ passt nicht zum ICE.");
    if (
      !breakAbilityMatchesSubroutine(
        ability,
        subroutine,
        deps.effectiveSubtypesForCard(
          state,
          run.encounteredIceId,
          iceDefinition,
        ),
      )
    )
      throw new Error("Breaker kann diese Subroutine nicht brechen.");
    if (ability.breakAllMatchingSubroutines)
      throw new Error(
        "Diese Break-Faehigkeit muss als Multi-Break genutzt werden.",
      );
    const breakerStrength =
      currentRunIcebreakerBaseStrength(state, breakerId, breakerDefinition) +
      mustInstance(state.cardInstances, breakerId).strengthModifier +
      deps.hostedProgramStrengthModifier(state, breakerId) +
      deps.icebreakerEncounterStrengthBonus(
        state,
        breakerId,
        run.encounteredIceId,
      ) +
      cardCounter(state, breakerId, "militech") +
      permanentIcebreakerStrengthCounterBonus(state, breakerId) +
      (cardCounter(state, breakerId, "breaker_strength_penalty") +
        cardCounter(state, breakerId, "pattel")) *
        -1 +
      selectedServerIcebreakerStrengthCounterBonus(state, breakerId) +
      temporaryBreakerStrengthBonusUntilEndOfTurn(state, breakerId) +
      deps.runRemainderStrengthBonusForBreaker(run, breakerId);
    if (breakerStrength < deps.iceStrengthFor(state, run.encounteredIceId))
      throw new Error("Der Icebreaker ist nicht stark genug fuer dieses ICE.");
    const expectedCost = deps.breakSubroutineCostBreakdown(
      state,
      ability.cost.credits,
      1,
      breakerId,
    ).totalCost;
    if ((legalAction.costs[0]?.credits ?? 0) !== expectedCost)
      throw new Error("Break-Subroutine-Kosten sind nicht mehr gueltig.");
  }

  function subroutinesForCurrentEncounter(
    state: GameState,
    iceDefinition: CardDefinition,
  ): NonNullable<CardDefinition["subroutines"]> {
    const run = state.run;
    const transmutationCopies = run?.encounteredIceId
      ? cardCounter(state, run.encounteredIceId, "mark")
      : 0;
    const printedSubroutines =
      printedSubroutinesForCardImplementation(iceDefinition) ??
      iceDefinition.subroutines ??
      [];
    const publicDerivation = run?.encounteredIceId
      ? publicIceRunSubroutineDerivation(
          state,
          run.encounteredIceId,
          printedSubroutines,
        )
      : {
          printedSubroutines: [...printedSubroutines],
          appendedSubroutines: [],
        };
    const subroutines = publicDerivation.printedSubroutines.flatMap(
      (subroutine) => {
        const copies = [subroutine];
        for (let index = 0; index < transmutationCopies; index += 1) {
          copies.push({
            ...subroutine,
            id: `${subroutine.id}.scored_rezzed_ice_mark_modifier.${index + 1}`,
          });
        }
        return copies;
      },
    );
    if (
      run?.encounteredIceId &&
      run.futureEncounterEndTheRunSourceIceId &&
      run.encounteredIceId !== run.futureEncounterEndTheRunSourceIceId
    ) {
      subroutines.push({
        id: "v1922_tutor_future_end_the_run",
        type: "end_the_run",
      });
    }
    if (run?.encounteredIceId) {
      subroutines.push(
        ...publicDerivation.appendedSubroutines.filter(
          (subroutine) => subroutine.type === "end_the_run",
        ),
      );
      subroutines.push(
        ...currentEncounterAdditionalSubroutinesForIce(
          state,
          run.encounteredIceId,
        ),
      );
      subroutines.push(
        ...publicDerivation.appendedSubroutines.filter(
          (subroutine) => subroutine.type === "initiate_trace",
        ),
      );
      subroutines.push(
        ...additionalSubroutinesForIce(state, run.encounteredIceId),
      );
    }
    return subroutines;
  }

  function variableTraceSubroutineForCurrentEncounter(
    state: GameState,
    iceId: CardInstanceId | undefined,
    subroutine: NonNullable<CardDefinition["subroutines"]>[number],
  ): NonNullable<CardDefinition["subroutines"]>[number] {
    if (!iceId || subroutine.type !== "initiate_trace") return subroutine;
    return publicIceRunSubroutineDerivation(state, iceId, [subroutine])
      .printedSubroutines[0] as NonNullable<
      CardDefinition["subroutines"]
    >[number];
  }

  function relativeDamageSubroutineForCurrentEncounter(
    state: GameState,
    iceId: CardInstanceId | undefined,
    subroutine: NonNullable<CardDefinition["subroutines"]>[number],
  ): NonNullable<CardDefinition["subroutines"]>[number] {
    if (!iceId || subroutine.type !== "do_damage") return subroutine;
    return publicIceRunSubroutineDerivation(state, iceId, [subroutine])
      .printedSubroutines[0] as NonNullable<
      CardDefinition["subroutines"]
    >[number];
  }

  function relativeTraceSubroutinesForCurrentEncounter(
    state: GameState,
    iceId: CardInstanceId,
  ): NonNullable<CardDefinition["subroutines"]> {
    return publicIceRunSubroutineDerivation(
      state,
      iceId,
      [],
    ).appendedSubroutines.filter(
      (subroutine) => subroutine.type === "initiate_trace",
    ) as NonNullable<CardDefinition["subroutines"]>;
  }

  function runCardImplementationActionHost(state: GameState) {
    return {
      state,
      cards: {
        cardInstanceFor: (cardId: CardInstanceId) =>
          state.cardInstances[cardId],
        definitionFor: (cardId: CardInstanceId) => definitionFor(state, cardId),
        runnerInstalledCardIds: () => runnerInstalledCardIds(state),
        cardImplementationForDefinitionId: (definitionId: string) =>
          cardImplementationForDefinitionId(definitionId as CardDefinitionId),
      },
      actions: {
        buildLegalAction: (
          type: LegalAction["type"],
          label: string,
          source: LegalAction["source"],
          costs?: LegalAction["costs"],
          payload?: LegalAction["payload"],
        ) => action(state, "runner", type, label, source, costs, payload),
      },
      runtime: {
        pushActivatedActionsForTiming: (
          actions: LegalAction[],
          side: Side,
          sourceCardId: CardInstanceId,
          definition: CardDefinition,
          timing: ActivatedCardAbilityImplementation["timing"],
        ) =>
          pushActivatedCardImplementationActionsForTiming(
            deps.cardImplementationRuntimeDeps,
            state,
            actions,
            side,
            sourceCardId,
            definition,
            timing,
          ),
      },
    };
  }

  function runStartTaxForServerUpgrades(
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ): {
    amount: number;
    sourceDefinitionIds: CardDefinitionId[];
    runStartLossAmount: number;
    runStartLossSourceDefinitionIds: CardDefinitionId[];
  } {
    const server = mustServer(state, serverId);
    const sourceDefinitionIds = server.root
      .filter((cardId) => mustInstance(state.cardInstances, cardId).rezzed)
      .map((cardId) => definitionFor(state, cardId).id)
      .filter(
        (definitionId) =>
          RUN_TAX_UPGRADE_SOURCES.has(definitionId) &&
          !cardImplementationForDefinitionId(definitionId),
      );
    let amount = sourceDefinitionIds.length;
    let runStartLossAmount = 0;
    const runStartLossSourceDefinitionIds: CardDefinitionId[] = [];
    for (const cardId of server.root.slice().sort()) {
      const instance = mustInstance(state.cardInstances, cardId);
      if (!instance.rezzed) continue;
      if (
        !deps.hasCorpUtilityKind(
          state,
          cardId,
          "run_start_lose_runner_credits_per_tag",
        )
      )
        continue;
      const tagLoss = Math.max(0, Math.floor(state.runner.tags));
      if (tagLoss <= 0) continue;
      runStartLossAmount += tagLoss;
      runStartLossSourceDefinitionIds.push(definitionFor(state, cardId).id);
    }
    return {
      amount,
      sourceDefinitionIds,
      runStartLossAmount,
      runStartLossSourceDefinitionIds,
    };
  }

  function runStartTaxForCorpRootAssets(state: GameState): {
    amount: number;
    sourceDefinitionIds: CardDefinitionId[];
  } {
    const sourceDefinitionIds = deps
      .rezzedCorpRootCardIds(state)
      .filter(
        (cardId: CardInstanceId) =>
          definitionFor(state, cardId).id === TAG_HANDSIZE_ASSET_SOURCE ||
          deps.hasCorpUtilityKind(state, cardId, "run_start_tax"),
      )
      .map((cardId: CardInstanceId) => definitionFor(state, cardId).id);
    return {
      amount: sourceDefinitionIds.length,
      sourceDefinitionIds,
    };
  }

  function spendRunnerAccessTrashCredits(
    state: GameState,
    amount: number,
    accessedCardId: CardInstanceId,
  ): { recurringSpent: number; runnerCreditsSpent: number } {
    if (amount <= 0) return { recurringSpent: 0, runnerCreditsSpent: 0 };
    const host = deps.runnerAccessActionHost(state);
    if (availableRunnerAccessTrashCredits(host, accessedCardId) < amount)
      throw new Error("Der Runner kann die Trashkosten nicht bezahlen.");
    let remaining = amount;
    let recurringSpent = 0;
    for (const cardId of runnerAccessTrashRecurringCreditSourceIds(
      host,
      accessedCardId,
    )) {
      if (remaining <= 0) break;
      const available = hostedPaymentCredits(state, cardId);
      const spent = Math.min(available, remaining);
      if (spent > 0) {
        spendHostedPaymentCredits(state, cardId, spent);
        recurringSpent += spent;
        remaining -= spent;
      }
    }
    spendCredits(state, "runner", remaining);
    return { recurringSpent, runnerCreditsSpent: remaining };
  }

  return {
    selectedServerIcebreakerStrengthCounterBonus,
    permanentIcebreakerStrengthCounterBonus,
    pumpAmountForLegalAction,
    pumpAbilityForLegalAction,
    breakAbilityForLegalAction,
    pumpDurationForLegalAction,
    assertCurrentSubroutineMatchesLegalAction,
    resolveMultiBreakSubroutinesAction,
    assertBreakSubroutineCostQuoteValid,
    subroutinesForCurrentEncounter,
    variableTraceSubroutineForCurrentEncounter,
    relativeDamageSubroutineForCurrentEncounter,
    relativeTraceSubroutinesForCurrentEncounter,
    runCardImplementationActionHost,
    runStartTaxForServerUpgrades,
    runStartTaxForCorpRootAssets,
    spendRunnerAccessTrashCredits,
  };
}
