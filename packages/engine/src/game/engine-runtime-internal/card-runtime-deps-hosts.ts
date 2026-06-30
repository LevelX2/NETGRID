import { createChoiceHiddenZoneRuntime } from "./choice-hidden-zone-runtime";
import { createLifecycleRuntime } from "./lifecycle-runtime";
import { createTurnCorpRuntime } from "./turn-corp-runtime";
import {
  DEMO_CARDS_BY_ID,
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
  type LegacyAbilityPayloadField,
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
import {
  buildRunnerHostedProgramInstallAction,
} from "../turn/runner-hosted-install-actions";
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
  resolveChimeraDaemonTrashChoice as resolveAccessChimeraDaemonTrashChoice,
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
import {
  FLATLINE_REPLACEMENT_EVENT_SOURCE,
  OVERADVANCE_DIRECTOR_AGENDA_SOURCE,
  ACCESS_HARDWARE_TRASH_ASSET_SOURCE,
  ACCESS_PROGRAM_TRASH_ASSET_SOURCE,
  COUNTER_GAIN_PROGRAM_SOURCE,
  COUNTER_CREDIT_OPERATION_SOURCE,
  OVERADVANCE_ACQUISITION_AGENDA_SOURCE,
  ADVANCEMENT_REASSIGN_OPERATION_SOURCE,
  AGENDA_ADVANCE_OPERATION_SOURCE,
  ECONOMY_RECOVERY_OPERATION_SOURCE,
  ADVANCEMENT_PLACEMENT_OPERATION_SOURCE,
  TEAM_COUNTER_OPERATION_SOURCE,
  ACCESS_CORE_DAMAGE_ASSET_SOURCE,
  ACCESS_NET_DAMAGE_ASSET_SOURCE,
} from "../../mechanics/agenda-operation-effects";
import {
  INSTALLED_CARD_LIMIT_ASSET_SOURCE,
  VIRUS_COUNTER_ASSET_SOURCE,
  ACCESS_SETUP_AMBUSH_ASSET_SOURCE,
  ACCESS_TRAP_AMBUSH_ASSET_SOURCE,
} from "../../mechanics/asset-node-effects";
import {
  ABLATIVE_COUNTER_HARDWARE_SOURCE,
  ABLATIVE_COUNTER_HARDWARE_STARTING_COUNTERS,
  RUNNER_DAMAGE_PREVENTION_RESOURCE_SOURCE,
  SELF_REPAIR_DAMAGE_PREVENTION_PROGRAM_SOURCE,
  CORE_REPLACEMENT_DAMAGE_PREVENTION_SOURCE,
  RUNTIME_DAMAGE_PREVENTION_PROFILES,
} from "../../mechanics/damage-prevention";
import {
  ARCHIVES_TO_HQ_OPERATION_SOURCE,
  HQ_AGENDA_REVEAL_ASSET_SOURCE,
  RD_TOP5_REORDER_OPERATION_SOURCE,
  COUNTER_STACK_TOP_REVEAL_PROGRAM_SOURCE,
  DAILY_CREDIT_RESOURCE_SOURCE,
  GRIP_TRASH_EVENT_SOURCE,
  STACK_TOP5_EVENT_SOURCE,
  SERVER_EXPOSE_PROGRAM_SOURCES,
  SERVER_ICE_SWAP_UPGRADE_SOURCE,
  PAID_STACK_SEARCH_RESOURCE_SOURCE,
  STACK_SEARCH_PROGRAM_SOURCES,
  STACK_TOP_REORDER_RESOURCE_SOURCE,
} from "../../mechanics/hidden-zone";
import { TAG_HANDSIZE_ASSET_SOURCE } from "../../mechanics/global-modifiers";
import { COUNTER_UPGRADE_SOURCES } from "../../mechanics/hosting-counters";
import {
  BLACK_ICE_DEREZ_EVENT_SOURCE,
  HQ_ICE_JETTISON_EVENT_SOURCE,
  RUNNER_CARD_INSTALL_OPERATION_SOURCE,
  FORCE_REZ_EVENT_SOURCE,
  BREAKER_DISABLE_PROGRAM_SOURCE,
  HOST_RETURN_HARDWARE_SOURCE,
  INSTALLED_CARD_TRASH_EVENT_SOURCE,
  TAG_RETURN_EVENT_SOURCE,
  HQ_INTERFACE_PROGRAM_SOURCE,
  HQ_CARD_TRASH_EVENT_SOURCE,
  HQ_ACCESS_RETAIN_EVENT_SOURCE,
  PROGRAM_BUNDLE_INSTALL_EVENT_SOURCE,
  ZETATECH_SOFTWARE_INSTALLER_SOURCE,
} from "../../mechanics/longtail-card-effects";
import {
  corpInstalledEconomyActionPayload,
  corpInstalledEconomyActionProfileForDefinition,
  corpInstalledEconomyActionProfileForPayload,
  type EconomyActionProfile,
} from "../../mechanics/payment-costs";
import { isP358HiddenReplacementCompatibilityChoiceSource } from "../../compatibility/payload-compatibility";
import {
  ALL_NIGHTER_ID,
  ARMADILLO_ARMORED_ROAD_HOME_ID,
  BIZARRE_ENCRYPTION_SCHEME_ID,
  BLINK_ID,
  BODYWEIGHT_DATA_CRECHE_ID,
  BUTCHER_BOY_ID,
  CHIMERA_ID,
  COCKROACH_ID,
  CODE_VIRAL_CACHE_ID,
  DANSHIS_SECOND_ID,
  DEAL_WITH_MILITECH_ID,
  DRIFTER_MOBILE_ENVIRONMENT_ID,
  DUPRE_ID,
  EMPLOYEE_EMPOWERMENT_ID,
  GRUBB_ID,
  HELLS_RUN_ID,
  HUNT_CLUB_BBS_ID,
  INCUBATOR_ID,
  JUNKYARD_BBS_ID,
  MICROTECH_TRODE_SET_ID,
  MIT_WEST_TIER_REMOVED_FROM_GAME_REASON,
  MYSTERY_BOX_ID,
  NEVINYRRAL_ID,
  PATTELS_VIRUS_ID,
  POX_ID,
  RONIN_AROUND_ID,
  SELF_MODIFYING_CODE_ID,
  SHELL_TRADERS_ID,
  SKIVVISS_ID,
  SMARTEYE_ID,
  SNEAK_PREVIEW_ID,
  TERRORIST_REPRISAL_ID,
  TOO_MANY_DOORS_ID,
} from "../../compatibility/runtime-compatibility";
import {
  BOARDWALK_RANDOM_PROGRAM_SOURCE,
  RANDOM_RESOURCE_SOURCE,
  RUNNER_RANDOM_PROGRAM_SOURCES,
} from "../../mechanics/random-effects";
import {
  RUN_ACCESS_PRESSURE_EVENT_SOURCE,
  RUN_REPLACEMENT_OVERLAP_EVENT_SOURCE,
  TRACE_AWARE_RUN_EVENT_SOURCE,
} from "../../mechanics/run-access";
import {
  ACCESS_COST_UPGRADE_SOURCE,
  ACCESS_MEAT_DAMAGE_UPGRADE_SOURCE,
  ACCESS_NET_DAMAGE_UPGRADE_SOURCE,
  ACCESS_TRACE_DAMAGE_UPGRADE_SOURCE,
} from "../../mechanics/server-upgrades";
import {
  RUN_TAX_UPGRADE_SOURCES,
} from "../../mechanics/trace-tags";
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
) {
  const {
    breakSubroutineCostBreakdown,
    cardImplementationRuntimeDeps,
    effectiveSubtypesForCard,
    executeEffectCommands,
    fortRunSideFamiliesHostForState,
    hasCorpUtilityKind,
    hostedProgramStrengthModifier,
    iceStrengthFor,
    icebreakerEncounterStrengthBonus,
    icebreakerHasSpecial,
    normalizeSubtypeLabel,
    rezzedCorpRootCardIds,
    rezzedIceOutsideThisIceCount,
    runRemainderStrengthBonusForBreaker,
    runnerAccessActionHost,
  } = deps;

  function dupreStrengthCounterBonus(
    state: GameState,
    breakerId: CardInstanceId,
  ): number {
    if (
      !icebreakerHasSpecial(
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

  function permanentIcebreakerStrengthCounterBonus(
    state: GameState,
    breakerId: CardInstanceId,
  ): number {
    if (
      icebreakerHasSpecial(
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
    const payloadAmount = Number(legalAction.payload?.pumpAmount);
    if (Number.isInteger(payloadAmount) && payloadAmount >= 0)
      return payloadAmount;
    const breakerId = String(legalAction.payload?.breakerId ?? "");
    const abilityId = legalAction.abilityRef?.abilityId;
    const definition = state.cardInstances[breakerId]
      ? definitionFor(state, breakerId)
      : undefined;
    const ability = definition
      ? icebreakerAbilitiesForDefinition(definition).find(
          (candidate) =>
            candidate.type === "pump_strength" &&
            (!abilityId || candidate.id === abilityId),
        )
      : undefined;
    const amount = ability?.amount ?? 1;
    return Number.isInteger(amount) ? amount : 1;
  }

  function pumpAbilityForLegalAction(
    state: GameState,
    legalAction: LegalAction,
  ): RuntimeIcebreakerAbility | undefined {
    const breakerId = String(legalAction.payload?.breakerId ?? "");
    const abilityId = legalAction.abilityRef?.abilityId;
    const definition = state.cardInstances[breakerId]
      ? definitionFor(state, breakerId)
      : undefined;
    return definition
      ? icebreakerAbilitiesForDefinition(definition).find(
          (candidate) =>
            candidate.type === "pump_strength" &&
            (!abilityId || candidate.id === abilityId),
        )
      : undefined;
  }

  function breakAbilityForLegalAction(
    state: GameState,
    legalAction: LegalAction,
  ): RuntimeIcebreakerAbility | undefined {
    const breakerId = String(legalAction.payload?.breakerId ?? "");
    const abilityId = legalAction.abilityRef?.abilityId;
    const definition = state.cardInstances[breakerId]
      ? definitionFor(state, breakerId)
      : undefined;
    return definition
      ? icebreakerAbilitiesForDefinition(definition).find(
          (candidate) =>
            candidate.type === "break_subroutine" &&
            (!abilityId || candidate.id === abilityId),
        )
      : undefined;
  }

  function pumpDurationForLegalAction(
    state: GameState,
    legalAction: LegalAction,
  ): "current_encounter" | "current_run" {
    const breakerId = String(legalAction.payload?.breakerId ?? "");
    const abilityId = legalAction.abilityRef?.abilityId;
    const definition = state.cardInstances[breakerId]
      ? definitionFor(state, breakerId)
      : undefined;
    const ability = definition
      ? icebreakerAbilitiesForDefinition(definition).find(
          (candidate) =>
            candidate.type === "pump_strength" &&
            (!abilityId || candidate.id === abilityId),
        )
      : undefined;
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
    const ability = icebreakerAbilitiesForDefinition(breakerDefinition).find(
      (candidate) =>
        candidate.id === legalAction.abilityRef?.abilityId &&
        candidate.type === "break_subroutine",
    );
    if (
      !ability ||
      !breakAbilityMatchesIce(
        ability,
        effectiveSubtypesForCard(state, iceId as CardInstanceId, iceDefinition),
      )
    )
      throw new Error(
        "Der Icebreaker hat keine gueltige Multi-Break-Faehigkeit.",
      );
    if (
      ability.selectedIceSubtypeFromBreaker &&
      !effectiveSubtypesForCard(
        state,
        iceId as CardInstanceId,
        iceDefinition,
      ).includes(
        normalizeSubtypeLabel(
          mustInstance(state.cardInstances, breakerId).selectedSubtype ?? "",
        ),
      )
    )
      throw new Error("Der gewählte Icebreaker-Typ passt nicht zum ICE.");
    const breakerStrength =
      (breakerDefinition.strength ?? 0) +
      mustInstance(state.cardInstances, breakerId).strengthModifier +
      hostedProgramStrengthModifier(state, breakerId) +
      icebreakerEncounterStrengthBonus(state, breakerId, iceId) +
      cardCounter(state, breakerId, "militech") +
      permanentIcebreakerStrengthCounterBonus(state, breakerId) +
      cardCounter(state, breakerId, "breaker_strength_penalty") * -1 +
      dupreStrengthCounterBonus(state, breakerId) +
      runRemainderStrengthBonusForBreaker(run, breakerId);
    if (breakerStrength < iceStrengthFor(state, iceId))
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
          breakAbilityMatchesSubroutine(ability, subroutine) &&
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
      if (!breakAbilityMatchesSubroutine(ability, subroutine))
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
    const expectedCost = breakSubroutineCostBreakdown(
      state,
      ability.cost.credits,
      subroutineIndexes.length,
      breakerId,
    ).totalCost;
    if ((legalAction.costs[0]?.credits ?? 0) !== expectedCost)
      throw new Error("Multi-Break-Kosten sind nicht mehr gueltig.");
    spendRunnerRunCredits(
      runDurationPaymentHost(state),
      expectedCost,
      breakerId,
    );
    executeEffectCommands(
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
      fortRunSideFamiliesHostForState(state),
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
    const ability = icebreakerAbilitiesForDefinition(breakerDefinition).find(
      (candidate) =>
        candidate.id === legalAction.abilityRef?.abilityId &&
        candidate.type === "break_subroutine",
    );
    if (
      !ability ||
      !breakAbilityMatchesIce(
        ability,
        effectiveSubtypesForCard(state, run.encounteredIceId, iceDefinition),
      )
    )
      throw new Error("Breaker hat keine gueltige Break-Faehigkeit.");
    if (
      ability.selectedIceSubtypeFromBreaker &&
      !effectiveSubtypesForCard(
        state,
        run.encounteredIceId,
        iceDefinition,
      ).includes(
        normalizeSubtypeLabel(
          mustInstance(state.cardInstances, breakerId).selectedSubtype ?? "",
        ),
      )
    )
      throw new Error("Der gewählte Icebreaker-Typ passt nicht zum ICE.");
    if (!breakAbilityMatchesSubroutine(ability, subroutine))
      throw new Error("Breaker kann diese Subroutine nicht brechen.");
    if (ability.breakAllMatchingSubroutines)
      throw new Error(
        "Diese Break-Faehigkeit muss als Multi-Break genutzt werden.",
      );
    const breakerStrength =
      (breakerDefinition.strength ?? 0) +
      mustInstance(state.cardInstances, breakerId).strengthModifier +
      hostedProgramStrengthModifier(state, breakerId) +
      icebreakerEncounterStrengthBonus(state, breakerId, run.encounteredIceId) +
      cardCounter(state, breakerId, "militech") +
      permanentIcebreakerStrengthCounterBonus(state, breakerId) +
      cardCounter(state, breakerId, "breaker_strength_penalty") * -1 +
      dupreStrengthCounterBonus(state, breakerId) +
      runRemainderStrengthBonusForBreaker(run, breakerId);
    if (breakerStrength < iceStrengthFor(state, run.encounteredIceId))
      throw new Error("Der Icebreaker ist nicht stark genug fuer dieses ICE.");
    const expectedCost = breakSubroutineCostBreakdown(
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
    const subroutines = printedSubroutines.flatMap((subroutine) => {
      const copies = [subroutine];
      for (let index = 0; index < transmutationCopies; index += 1) {
        copies.push({
          ...subroutine,
          id: `${subroutine.id}.scored_rezzed_ice_mark_modifier.${index + 1}`,
        });
      }
      return copies.map((copy) =>
        relativeDamageSubroutineForCurrentEncounter(
          state,
          run?.encounteredIceId,
          variableTraceSubroutineForCurrentEncounter(
            state,
            run?.encounteredIceId,
            copy,
          ),
        ),
      );
    });
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
      const variableIceState =
        state.cardInstances[run.encounteredIceId]?.variableIceState;
      if (variableIceState?.family === "paid_end_the_run_subroutines") {
        const subroutineCount = Math.max(
          0,
          Math.floor(variableIceState.subroutineCount ?? 0),
        );
        for (let index = 0; index < subroutineCount; index += 1) {
          subroutines.push({
            id: `variable_ice_paid_end_the_run_${index + 1}`,
            type: "end_the_run",
          });
        }
      }
      subroutines.push(
        ...currentEncounterAdditionalSubroutinesForIce(
          state,
          run.encounteredIceId,
        ),
      );
      subroutines.push(
        ...relativeTraceSubroutinesForCurrentEncounter(
          state,
          run.encounteredIceId,
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
    const instance = state.cardInstances[iceId];
    const variableRez = cardImplementationForDefinitionId(
      instance?.definitionId ?? "",
    )?.variableRez;
    const variableIceState = instance?.variableIceState;
    if (
      variableRez?.kind !== "x_strength" ||
      variableIceState?.family !== "x_strength"
    )
      return subroutine;
    const value = Math.max(0, Math.floor(variableIceState.value));
    return {
      ...subroutine,
      ...(variableRez.traceBaseFromValue ? { baseTraceStrength: value } : {}),
      ...(variableRez.traceBidLimitFromValue ? { traceBidLimit: value } : {}),
    };
  }

  function relativeDamageSubroutineForCurrentEncounter(
    state: GameState,
    iceId: CardInstanceId | undefined,
    subroutine: NonNullable<CardDefinition["subroutines"]>[number],
  ): NonNullable<CardDefinition["subroutines"]>[number] {
    if (!iceId || subroutine.type !== "do_damage") return subroutine;
    const relativeIce = cardImplementationForDefinitionId(
      definitionFor(state, iceId).id,
    )?.relativeIce;
    const dynamicDamage = relativeIce?.dynamicDamageSubroutine;
    if (!dynamicDamage || dynamicDamage.subroutineId !== subroutine.id)
      return subroutine;
    return {
      ...subroutine,
      amount:
        rezzedIceOutsideThisIceCount(state, iceId) *
        dynamicDamage.amountPerCount,
    };
  }

  function relativeTraceSubroutinesForCurrentEncounter(
    state: GameState,
    iceId: CardInstanceId,
  ): NonNullable<CardDefinition["subroutines"]> {
    const definition = definitionFor(state, iceId);
    const dynamicTrace = cardImplementationForDefinitionId(definition.id)
      ?.relativeIce?.dynamicTraceSubroutines;
    if (!dynamicTrace) return [];
    const count = rezzedIceOutsideThisIceCount(state, iceId);
    return Array.from({ length: count }, (_, index) => ({
      id: `relative_ice_outside_${definition.id}.trace.${index + 1}`,
      type: "initiate_trace",
      baseTraceStrength: dynamicTrace.baseTraceStrength,
      traceSuccessEffect: dynamicTrace.traceSuccessEffect,
    }));
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
            cardImplementationRuntimeDeps,
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
  ): { amount: number; sourceDefinitionIds: CardDefinitionId[] } {
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
    for (const cardId of server.root.slice().sort()) {
      const instance = mustInstance(state.cardInstances, cardId);
      if (!instance.rezzed) continue;
      if (!hasCorpUtilityKind(state, cardId, "run_start_tax_runner_tags"))
        continue;
      const tagTax = Math.max(0, Math.floor(state.runner.tags));
      if (tagTax <= 0) continue;
      amount += tagTax;
      sourceDefinitionIds.push(definitionFor(state, cardId).id);
    }
    return {
      amount,
      sourceDefinitionIds,
    };
  }

  function runStartTaxForCorpRootAssets(state: GameState): {
    amount: number;
    sourceDefinitionIds: CardDefinitionId[];
  } {
    const sourceDefinitionIds = rezzedCorpRootCardIds(state)
      .filter(
        (cardId: CardInstanceId) =>
          definitionFor(state, cardId).id ===
            TAG_HANDSIZE_ASSET_SOURCE ||
          hasCorpUtilityKind(state, cardId, "run_start_tax"),
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
    const host = runnerAccessActionHost(state);
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
    dupreStrengthCounterBonus,
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
